import { useCallback, useEffect, useRef, useState } from 'react';
import type { Call, ConnectionState, RemoteParticipantMedia } from '../types';
import { api } from '../services/api';
import { LiveSwitchService } from '../services/liveSwitchService';

interface UseLiveSwitchCallProps {
  call: Call | null;
  currentUserId: string;
  initialAudioEnabled?: boolean;
  initialVideoEnabled?: boolean;
  onCallEnded?: () => void;
}

export function useLiveSwitchCall({
  call,
  currentUserId,
  initialAudioEnabled = true,
  initialVideoEnabled = true,
  onCallEnded,
}: UseLiveSwitchCallProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isAudioMuted, setIsAudioMuted] = useState(!initialAudioEnabled);
  const [isVideoMuted, setIsVideoMuted] = useState(!initialVideoEnabled);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipantMedia[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const serviceRef = useRef<LiveSwitchService | null>(null);
  const isJoinedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const [localMediaView, setLocalMediaView] = useState<HTMLElement | null>(null);

  // Keep local video preview container synchronized with localMediaView
  useEffect(() => {
    if (localVideoContainerRef.current && localMediaView) {
      localVideoContainerRef.current.innerHTML = '';
      localVideoContainerRef.current.appendChild(localMediaView);
    }
  }, [localMediaView]);

  // Initialize and join call
  const startCall = useCallback(async () => {
    if (!call || isJoinedRef.current || isCancelledRef.current) return;
    isJoinedRef.current = true;

    setErrorMessage(null);
    setConnectionState('registering');
    setStatusMessage('Connecting to LiveSwitch Cloud...');

    const isAudioOnly = call.callType === 'Audio';
    const wantVideo = !isAudioOnly && initialVideoEnabled;
    const wantAudio = initialAudioEnabled;

    try {
      // 1. Create LiveSwitch service
      const service = new LiveSwitchService({
        onConnectionStateChange: (state, msg) => {
          if (isCancelledRef.current) return;
          setConnectionState(state);
          if (msg) setStatusMessage(msg);
        },
        onRemoteParticipantAdded: (participant) => {
          if (isCancelledRef.current) return;
          setRemoteParticipants((prev) => {
            const filtered = prev.filter((p) => p.id !== participant.id);
            return [...filtered, participant];
          });
        },
        onRemoteParticipantRemoved: (participantId) => {
          if (isCancelledRef.current) return;
          setRemoteParticipants((prev) => prev.filter((p) => p.id !== participantId));
        },
        onError: (err) => {
          if (isCancelledRef.current) return;
          setErrorMessage(err.message);
          setConnectionState('failed');
        },
      });

      serviceRef.current = service;

      // 2. Fetch LiveSwitch registration token from backend (.NET 10 API)
      const registerRes = await api.getRegisterToken(service.getDeviceId(), service.getClientId());
      if (isCancelledRef.current) return;

      // 3. Register client with gateway
      await service.initializeAndRegister(
        registerRes.gatewayUrl,
        registerRes.applicationId,
        currentUserId,
        registerRes.token
      );
      if (isCancelledRef.current) return;

      // 4. Fetch authorized channel join token from backend
      const joinRes = await api.getJoinToken(call.id, service.getDeviceId(), service.getClientId());
      if (isCancelledRef.current) return;

      // 5. Join channel
      await service.joinChannel(call.channelId, joinRes.token);
      if (isCancelledRef.current) return;

      // 6. Start local media (Camera/Mic)
      // IMPORTANT: If audio-only call, do NOT request video/camera!
      const localView = await service.startLocalMedia(wantAudio, wantVideo);
      if (isCancelledRef.current) return;

      if (localView) {
        setLocalMediaView(localView);
        if (localVideoContainerRef.current) {
          localVideoContainerRef.current.innerHTML = '';
          localVideoContainerRef.current.appendChild(localView);
        }
      }

      // Apply initial mute states
      if (!initialAudioEnabled) {
        service.setAudioMuted(true);
        setIsAudioMuted(true);
      }
      if (!initialVideoEnabled && !isAudioOnly) {
        service.setVideoMuted(true);
        setIsVideoMuted(true);
      }

      // 7. Open SFU Upstream Connection
      await service.openUpstreamConnection(wantAudio, wantVideo);
      if (isCancelledRef.current) return;

      setConnectionState('connected');
      setStatusMessage('Connected to call');
    } catch (err: any) {
      if (isCancelledRef.current) return;
      console.error('Call connection error:', err);
      setConnectionState('failed');
      setErrorMessage(err.message || 'Failed to connect to LiveSwitch session');
    }
  }, [call?.id, call?.channelId, call?.callType, currentUserId, initialAudioEnabled, initialVideoEnabled]);

  // Toggle Audio Mute
  const toggleAudio = useCallback(() => {
    if (!serviceRef.current) return;
    const current = isAudioMuted;
    serviceRef.current.setAudioMuted(!current);
    setIsAudioMuted(!current);
  }, [isAudioMuted]);

  // Toggle Video Mute
  const toggleVideo = useCallback(() => {
    if (!serviceRef.current || call?.callType === 'Audio') return;
    const current = isVideoMuted;
    serviceRef.current.setVideoMuted(!current);
    setIsVideoMuted(!current);
  }, [isVideoMuted, call]);

  // End and Clean up
  const endCall = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.leaveAndCleanUp();
      serviceRef.current = null;
    }

    if (localVideoContainerRef.current) {
      localVideoContainerRef.current.innerHTML = '';
    }

    setRemoteParticipants([]);
    setConnectionState('disconnected');
    isJoinedRef.current = false;

    if (onCallEnded) {
      onCallEnded();
    }
  }, [onCallEnded]);

  // Clean up on component unmount
  useEffect(() => {
    isCancelledRef.current = false;
    return () => {
      isCancelledRef.current = true;
      if (serviceRef.current) {
        serviceRef.current.leaveAndCleanUp().catch(console.error);
        serviceRef.current = null;
      }
      isJoinedRef.current = false;
    };
  }, []);

  return {
    connectionState,
    statusMessage,
    isAudioMuted,
    isVideoMuted,
    remoteParticipants,
    errorMessage,
    localVideoContainerRef,
    startCall,
    toggleAudio,
    toggleVideo,
    endCall,
  };
}
