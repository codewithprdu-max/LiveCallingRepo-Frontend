import liveswitch from 'fm.liveswitch';
import type { ConnectionState, RemoteParticipantMedia } from '../types';

// Set LiveSwitch log level to Warning to keep console clean
try {
  liveswitch.Log.setLogLevel(liveswitch.LogLevel.Warn);
} catch {
  // Ignore if already set
}

export interface LiveSwitchCallbacks {
  onConnectionStateChange?: (state: ConnectionState, message?: string) => void;
  onRemoteParticipantAdded?: (participant: RemoteParticipantMedia) => void;
  onRemoteParticipantRemoved?: (participantId: string) => void;
  onError?: (error: Error) => void;
}

export class LiveSwitchService {
  private client: liveswitch.Client | null = null;
  private channel: liveswitch.Channel | null = null;
  private localMedia: liveswitch.LocalMedia | null = null;
  private upstreamConnection: liveswitch.SfuUpstreamConnection | null = null;
  private downstreamConnections = new Map<string, {
    connection: liveswitch.SfuDownstreamConnection;
    remoteMedia: liveswitch.RemoteMedia;
  }>();

  private deviceId: string;
  private clientId: string;
  private isDestroyed = false;
  private callbacks: LiveSwitchCallbacks = {};

  // Track action handlers for unbinding
  private remoteUpstreamOpenHandler: liveswitch.IAction1<liveswitch.ConnectionInfo> | null = null;
  private remoteUpstreamCloseHandler: liveswitch.IAction1<liveswitch.ConnectionInfo> | null = null;

  constructor(callbacks: LiveSwitchCallbacks = {}) {
    this.callbacks = callbacks;
    this.deviceId = this.getOrCreateId('ls_device_id');
    // Ensure a unique client ID per LiveSwitch client instance/session
    this.clientId = 'client_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
  }

  private getOrCreateId(storageKey: string): string {
    let id = sessionStorage.getItem(storageKey);
    if (!id) {
      id = 'client_' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem(storageKey, id);
    }
    return id;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  getClientId(): string {
    return this.clientId;
  }

  setCallbacks(callbacks: LiveSwitchCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Initialize and register the LiveSwitch client
   */
  async initializeAndRegister(
    gatewayUrl: string,
    applicationId: string,
    userId: string,
    registerToken: string
  ): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('LiveSwitch service was destroyed before initialization');
    }

    this.callbacks.onConnectionStateChange?.('registering', 'Registering with LiveSwitch Gateway...');

    try {
      // Create single LiveSwitch client instance
      this.client = new liveswitch.Client(
        gatewayUrl,
        applicationId,
        userId,
        this.deviceId,
        this.clientId
      );

      // Register with gateway token
      await new Promise<liveswitch.Channel[]>((resolve, reject) => {
        this.client!.register(registerToken)
          .then((channels: any) => resolve(channels))
          .fail((err: any) => reject(new Error(err?.getDescription?.() || 'Registration failed')));
      });

      this.callbacks.onConnectionStateChange?.('connecting', 'Client registered. Joining channel...');
    } catch (err: any) {
      this.callbacks.onConnectionStateChange?.('failed', err.message || 'Registration failed');
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  /**
   * Join channel using channel join token
   */
  async joinChannel(channelId: string, joinToken: string): Promise<liveswitch.Channel> {
    if (this.isDestroyed) {
      throw new Error('LiveSwitch service was destroyed');
    }
    if (!this.client) {
      throw new Error('LiveSwitch Client is not initialized');
    }

    try {
      this.channel = await new Promise<liveswitch.Channel>((resolve, reject) => {
        this.client!.join(channelId, joinToken)
          .then((channel: any) => resolve(channel))
          .fail((err: any) => reject(new Error(err?.getDescription?.() || 'Failed to join channel')));
      });

      // Bind downstream handlers on channel
      this.setupChannelListeners(this.channel);

      return this.channel;
    } catch (err: any) {
      this.callbacks.onConnectionStateChange?.('failed', err.message || 'Join channel failed');
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  /**
   * Start local camera and/or microphone
   */
  async startLocalMedia(audio: boolean, video: boolean): Promise<HTMLElement | null> {
    if (this.isDestroyed) {
      throw new Error('LiveSwitch service was destroyed');
    }

    // Clean up existing local media if any
    if (this.localMedia) {
      await this.stopLocalMedia();
    }

    // Notice: Do NOT request video for audio-only calls!
    this.localMedia = new liveswitch.LocalMedia(audio, video);

    try {
      await new Promise<liveswitch.LocalMedia>((resolve, reject) => {
        this.localMedia!.start()
          .then((lm: any) => resolve(lm))
          .fail((err: any) => reject(new Error(err?.getDescription?.() || 'Permission denied or media hardware error')));
      });

      if (video) {
        return this.localMedia.getView() as HTMLElement;
      }
      return null;
    } catch (err: any) {
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  /**
   * Open SFU Upstream Connection to send local media into channel
   */
  async openUpstreamConnection(hasAudio: boolean, hasVideo: boolean): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('LiveSwitch service was destroyed');
    }

    if (!this.channel || !this.localMedia) {
      throw new Error('Channel or local media not available for upstream connection');
    }

    const audioStream = hasAudio ? new liveswitch.AudioStream(this.localMedia) : null;
    const videoStream = hasVideo ? new liveswitch.VideoStream(this.localMedia) : null;

    if (audioStream && videoStream) {
      this.upstreamConnection = this.channel.createSfuUpstreamConnection(audioStream, videoStream);
    } else if (audioStream) {
      this.upstreamConnection = this.channel.createSfuUpstreamConnection(audioStream);
    } else if (videoStream) {
      this.upstreamConnection = this.channel.createSfuUpstreamConnection(videoStream);
    } else {
      throw new Error('At least one stream (audio or video) must be specified for upstream connection');
    }

    // Monitor connection state
    this.upstreamConnection.addOnStateChange((conn: any) => {
      const state = conn.getState();
      if (state === liveswitch.ConnectionState.Connected) {
        this.callbacks.onConnectionStateChange?.('connected', 'LiveSwitch upstream connected');
      } else if (state === liveswitch.ConnectionState.Failed) {
        this.callbacks.onConnectionStateChange?.('failed', 'Upstream connection failed');
      } else if (state === liveswitch.ConnectionState.Closing || state === liveswitch.ConnectionState.Closed) {
        this.callbacks.onConnectionStateChange?.('disconnected', 'Upstream connection closed');
      }
    });

    try {
      await new Promise<liveswitch.SfuUpstreamConnection>((resolve, reject) => {
        this.upstreamConnection!.open()
          .then((c: any) => resolve(c))
          .fail((err: any) => reject(new Error(err?.getDescription?.() || 'Failed to open SFU upstream connection')));
      });
    } catch (err: any) {
      this.callbacks.onConnectionStateChange?.('failed', err.message || 'Upstream connection failed');
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  /**
   * Setup channel listeners for remote participant media
   */
  private setupChannelListeners(channel: liveswitch.Channel) {
    // When a remote participant opens an upstream connection, subscribe to it via Downstream
    this.remoteUpstreamOpenHandler = (remoteConnInfo: liveswitch.ConnectionInfo) => {
      this.openDownstreamConnection(channel, remoteConnInfo);
    };

    // When remote participant closes upstream connection, tear down downstream
    this.remoteUpstreamCloseHandler = (remoteConnInfo: liveswitch.ConnectionInfo) => {
      this.closeDownstreamConnection(remoteConnInfo.getId());
    };

    channel.addOnRemoteUpstreamConnectionOpen(this.remoteUpstreamOpenHandler);
    channel.addOnRemoteUpstreamConnectionClose(this.remoteUpstreamCloseHandler);

    // IMPORTANT: Also subscribe to any upstream connections that were ALREADY OPEN before joining!
    try {
      const existingRemotes = channel.getRemoteUpstreamConnectionInfos();
      if (existingRemotes && existingRemotes.length > 0) {
        for (const remoteConnInfo of existingRemotes) {
          this.openDownstreamConnection(channel, remoteConnInfo);
        }
      }
    } catch (e) {
      console.warn('Error reading existing remote upstream connections:', e);
    }
  }

  private async openDownstreamConnection(
    channel: liveswitch.Channel,
    remoteConnInfo: liveswitch.ConnectionInfo
  ) {
    if (this.isDestroyed) return;

    const connectionId = remoteConnInfo.getId();
    const userId = remoteConnInfo.getUserId();

    if (this.downstreamConnections.has(connectionId)) {
      return;
    }

    try {
      const hasAudio = remoteConnInfo.getHasAudio();
      const hasVideo = remoteConnInfo.getHasVideo();
      const remoteMedia = new liveswitch.RemoteMedia(hasAudio, hasVideo);

      const audioStream = hasAudio ? new liveswitch.AudioStream(remoteMedia) : null;
      const videoStream = hasVideo ? new liveswitch.VideoStream(remoteMedia) : null;

      let downstream: liveswitch.SfuDownstreamConnection;
      if (audioStream && videoStream) {
        downstream = channel.createSfuDownstreamConnection(remoteConnInfo, audioStream, videoStream);
      } else if (audioStream) {
        downstream = channel.createSfuDownstreamConnection(remoteConnInfo, audioStream);
      } else if (videoStream) {
        downstream = channel.createSfuDownstreamConnection(remoteConnInfo, videoStream);
      } else {
        return;
      }

      this.downstreamConnections.set(connectionId, {
        connection: downstream,
        remoteMedia,
      });

      const notifyParticipantAdded = () => {
        const view = remoteMedia.getView() as HTMLElement | null;
        this.callbacks.onRemoteParticipantAdded?.({
          id: connectionId,
          userId,
          connectionId,
          viewElement: view,
          hasAudio,
          hasVideo,
        });
      };

      downstream.addOnStateChange((conn: any) => {
        if (conn.getState() === liveswitch.ConnectionState.Connected) {
          notifyParticipantAdded();
        }
      });

      await new Promise<liveswitch.SfuDownstreamConnection>((resolve, reject) => {
        downstream.open()
          .then((c: any) => resolve(c))
          .fail((err: any) => reject(new Error(err?.getDescription?.() || 'Failed to open downstream connection')));
      });

      // Ensure view is attached once connection completes
      notifyParticipantAdded();
    } catch (err) {
      console.error('Error opening downstream connection for remote participant:', err);
    }
  }

  private closeDownstreamConnection(connectionId: string) {
    const item = this.downstreamConnections.get(connectionId);
    if (item) {
      try {
        item.connection.close();
      } catch (e) {
        console.warn('Error closing downstream connection:', e);
      }

      try {
        const view = item.remoteMedia.getView() as HTMLElement | null;
        if (view && view.parentNode) {
          view.parentNode.removeChild(view);
        }
        item.remoteMedia.destroy();
      } catch (e) {
        console.warn('Error destroying remoteMedia:', e);
      }

      this.downstreamConnections.delete(connectionId);
      this.callbacks.onRemoteParticipantRemoved?.(connectionId);
    }
  }

  setAudioMuted(muted: boolean) {
    if (this.localMedia) {
      this.localMedia.setAudioMuted(muted);
    }
  }

  getAudioMuted(): boolean {
    return this.localMedia ? this.localMedia.getAudioMuted() : false;
  }

  setVideoMuted(muted: boolean) {
    if (this.localMedia) {
      this.localMedia.setVideoMuted(muted);
    }
  }

  getVideoMuted(): boolean {
    return this.localMedia ? this.localMedia.getVideoMuted() : false;
  }

  async stopLocalMedia() {
    if (this.localMedia) {
      try {
        await new Promise<liveswitch.LocalMedia>((resolve) => {
          this.localMedia!.stop()
            .then((lm: any) => resolve(lm))
            .fail(() => resolve(this.localMedia!));
        });
      } catch (e) {
        console.warn('Error stopping local media:', e);
      }

      try {
        const view = this.localMedia.getView() as HTMLElement | null;
        if (view && view.parentNode) {
          view.parentNode.removeChild(view);
        }
        this.localMedia.destroy();
      } catch (e) {
        console.warn('Error destroying local media:', e);
      }
      this.localMedia = null;
    }
  }

  /**
   * Leave channel, close all connections, stop media, and unregister client
   */
  async leaveAndCleanUp(): Promise<void> {
    this.isDestroyed = true;

    // 1. Close all downstream connections
    for (const [id] of Array.from(this.downstreamConnections.entries())) {
      this.closeDownstreamConnection(id);
    }
    this.downstreamConnections.clear();

    // 2. Close upstream connection
    if (this.upstreamConnection) {
      try {
        this.upstreamConnection.close();
      } catch (e) {
        console.warn('Error closing upstream connection:', e);
      }
      this.upstreamConnection = null;
    }

    // 3. Stop and destroy local media
    await this.stopLocalMedia();

    // 4. Leave channel
    if (this.channel) {
      try {
        if (this.remoteUpstreamOpenHandler) {
          this.channel.removeOnRemoteUpstreamConnectionOpen(this.remoteUpstreamOpenHandler);
        }
        if (this.remoteUpstreamCloseHandler) {
          this.channel.removeOnRemoteUpstreamConnectionClose(this.remoteUpstreamCloseHandler);
        }
        if (this.client) {
          await new Promise<liveswitch.Channel>((resolve) => {
            this.client!.leave(this.channel!.getId())
              .then((c: any) => resolve(c))
              .fail(() => resolve(this.channel!));
          });
        }
      } catch (e) {
        console.warn('Error leaving channel:', e);
      }
      this.channel = null;
    }

    // 5. Unregister client
    if (this.client) {
      try {
        await new Promise<any>((resolve) => {
          this.client!.unregister()
            .then((res: any) => resolve(res))
            .fail(() => resolve(null));
        });
      } catch (e) {
        console.warn('Error unregistering LiveSwitch client:', e);
      }
      this.client = null;
    }

    this.callbacks.onConnectionStateChange?.('disconnected', 'Call ended and resources released');
  }
}
