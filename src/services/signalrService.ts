import * as signalR from '@microsoft/signalr';
import type { Call } from '../types';

export type CallInvitationCallback = (call: Call) => void;
export type CallStatusCallback = (data: { callId: string; userId?: string; call: Call }) => void;
export type CallEndedCallback = (call: Call) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;

  private onInvitationListeners: Set<CallInvitationCallback> = new Set();
  private onAcceptedListeners: Set<CallStatusCallback> = new Set();
  private onRejectedListeners: Set<CallStatusCallback> = new Set();
  private onEndedListeners: Set<CallEndedCallback> = new Set();
  private onParticipantJoinedListeners: Set<CallStatusCallback> = new Set();
  private onParticipantLeftListeners: Set<CallStatusCallback> = new Set();

  async connect(token: string): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/call', {
          accessTokenFactory: () => token,
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.connection.on('ReceiveCallInvitation', (call: Call) => {
        this.onInvitationListeners.forEach((fn) => fn(call));
      });

      this.connection.on('CallAccepted', (call: Call) => {
        this.onAcceptedListeners.forEach((fn) => fn({ callId: call.id, call }));
      });

      this.connection.on('CallRejected', (data: { callId: string; userId: string; call: Call }) => {
        this.onRejectedListeners.forEach((fn) => fn(data));
      });

      this.connection.on('CallEnded', (call: Call) => {
        this.onEndedListeners.forEach((fn) => fn(call));
      });

      this.connection.on('ParticipantJoined', (data: { callId: string; userId: string; call: Call }) => {
        this.onParticipantJoinedListeners.forEach((fn) => fn(data));
      });

      this.connection.on('ParticipantLeft', (data: { callId: string; userId: string; call: Call }) => {
        this.onParticipantLeftListeners.forEach((fn) => fn(data));
      });

      await this.connection.start();
    } catch (err) {
      console.error('SignalR connection failed:', err);
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (err) {
        console.error('Error stopping SignalR:', err);
      }
      this.connection = null;
    }
  }

  async joinRoom(callId: string): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinCallRoom', callId);
    }
  }

  async leaveRoom(callId: string): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveCallRoom', callId);
    }
  }

  onInvitation(cb: CallInvitationCallback): () => void {
    this.onInvitationListeners.add(cb);
    return () => this.onInvitationListeners.delete(cb);
  }

  onAccepted(cb: CallStatusCallback): () => void {
    this.onAcceptedListeners.add(cb);
    return () => this.onAcceptedListeners.delete(cb);
  }

  onRejected(cb: CallStatusCallback): () => void {
    this.onRejectedListeners.add(cb);
    return () => this.onRejectedListeners.delete(cb);
  }

  onEnded(cb: CallEndedCallback): () => void {
    this.onEndedListeners.add(cb);
    return () => this.onEndedListeners.delete(cb);
  }

  onParticipantJoined(cb: CallStatusCallback): () => void {
    this.onParticipantJoinedListeners.add(cb);
    return () => this.onParticipantJoinedListeners.delete(cb);
  }

  onParticipantLeft(cb: CallStatusCallback): () => void {
    this.onParticipantLeftListeners.add(cb);
    return () => this.onParticipantLeftListeners.delete(cb);
  }
}

export const signalRService = new SignalRService();
