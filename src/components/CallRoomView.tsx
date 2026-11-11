import React, { useEffect, useState, useRef } from 'react';
import type { Call, ChatMessage, MediaDeviceInfoOption, RemoteParticipantMedia } from '../types';
import { useLiveSwitchCall } from '../hooks/useLiveSwitchCall';
import { signalRService } from '../services/signalrService';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Volume2,
  ScreenShare,
  ScreenShareOff,
  MessageSquare,
  Send,
  Settings,
  X
} from 'lucide-react';

interface CallRoomViewProps {
  call: Call;
  currentUserId: string;
  initialAudioEnabled: boolean;
  initialVideoEnabled: boolean;
  onLeaveCall: () => void;
}

export const CallRoomView: React.FC<CallRoomViewProps> = ({
  call,
  currentUserId,
  initialAudioEnabled,
  initialVideoEnabled,
  onLeaveCall,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // In-Call Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Remote Media States (mute/video/screen sharing)
  const [remoteMediaStates, setRemoteMediaStates] = useState<
    Record<string, { isAudioMuted: boolean; isVideoMuted: boolean; isScreenSharing: boolean }>
  >({});

  // Device settings
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfoOption[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfoOption[]>([]);
  const [activeAudioDeviceId, setActiveAudioDeviceId] = useState('');
  const [activeVideoDeviceId, setActiveVideoDeviceId] = useState('');

  const {
    connectionState,
    statusMessage,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    remoteParticipants,
    errorMessage,
    localVideoContainerRef,
    startCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    switchAudioDevice,
    switchVideoDevice,
    endCall,
  } = useLiveSwitchCall({
    call,
    currentUserId,
    initialAudioEnabled,
    initialVideoEnabled,
    onCallEnded: onLeaveCall,
  });

  // Start call on component mount
  useEffect(() => {
    startCall();
  }, [startCall]);

  // Duration timer
  useEffect(() => {
    let timer: number | null = null;
    if (connectionState === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connectionState]);

  // Listen to SignalR in-call chat messages & media state changes
  useEffect(() => {
    const unsubMessage = signalRService.onCallMessage((msg) => {
      if (msg.callId === call.id) {
        setChatMessages((prev) => [...prev, msg]);
        if (!showChatDrawer) {
          setUnreadChatCount((count) => count + 1);
        }
      }
    });

    const unsubMedia = signalRService.onMediaStateChanged((data) => {
      setRemoteMediaStates((prev) => ({
        ...prev,
        [data.userId]: {
          isAudioMuted: data.isAudioMuted,
          isVideoMuted: data.isVideoMuted,
          isScreenSharing: data.isScreenSharing,
        },
      }));
    });

    return () => {
      unsubMessage();
      unsubMedia();
    };
  }, [call.id, showChatDrawer]);

  // Auto-scroll chat drawer
  useEffect(() => {
    if (showChatDrawer && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatDrawer]);

  // Load available devices when settings modal opens
  const openSettingsModal = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioIns = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }));
      const videoIns = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));

      setAudioDevices(audioIns);
      setVideoDevices(videoIns);
    } catch (err) {
      console.warn('Error loading media devices:', err);
    }
    setShowSettingsModal(true);
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      await signalRService.sendCallMessage(call.id, chatInput.trim());
      setChatInput('');
    } catch (err) {
      console.error('Error sending chat message:', err);
    }
  };

  const handleSelectAudioDevice = async (deviceId: string) => {
    setActiveAudioDeviceId(deviceId);
    try {
      await switchAudioDevice(deviceId);
    } catch (err) {
      console.error('Failed to switch audio device:', err);
    }
  };

  const handleSelectVideoDevice = async (deviceId: string) => {
    setActiveVideoDeviceId(deviceId);
    try {
      await switchVideoDevice(deviceId);
    } catch (err) {
      console.error('Failed to switch video device:', err);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isAudioOnly = call.callType === 'Audio';
  const isOneOnOne = call.callType !== 'Group';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#070a10',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Top Header Bar */}
      <div style={{
        height: '64px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(10, 13, 20, 0.8)',
        backdropFilter: 'blur(10px)',
      }}>
        {/* Title & Call Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {call.title}
          </h2>
          <span style={{
            padding: '3px 10px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: isAudioOnly ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: isAudioOnly ? 'var(--accent-primary)' : 'var(--success)',
            border: `1px solid ${isAudioOnly ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          }}>
            {call.callType} Call
          </span>
          {isScreenSharing && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.2)',
              color: 'var(--success)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
            }}>
              <ScreenShare size={12} />
              <span>You are Sharing Screen</span>
            </span>
          )}
        </div>

        {/* Timer & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {connectionState === 'connected' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'monospace',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
              {formatDuration(callDuration)}
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '999px',
            background: connectionState === 'connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: connectionState === 'connected' ? 'var(--success)' : 'var(--warning)',
            border: `1px solid ${connectionState === 'connected' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          }}>
            {connectionState === 'connected' && <ShieldCheck size={14} />}
            {connectionState !== 'connected' && connectionState !== 'failed' && <Loader2 size={14} className="animate-spin" />}
            {connectionState === 'failed' && <AlertCircle size={14} />}
            <span>{statusMessage || connectionState}</span>
          </div>

          {/* Chat Toggle Button */}
          <button
            onClick={() => {
              setShowChatDrawer(!showChatDrawer);
              setShowParticipantsDrawer(false);
              setUnreadChatCount(0);
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showChatDrawer ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
            title="Open In-Call Chat"
          >
            <MessageSquare size={16} />
            <span>Chat</span>
            {unreadChatCount > 0 && !showChatDrawer && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--danger)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants Toggle Button */}
          <button
            onClick={() => {
              setShowParticipantsDrawer(!showParticipantsDrawer);
              setShowChatDrawer(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showParticipantsDrawer ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <Users size={16} />
            <span>Participants ({call.participants.length})</span>
          </button>

          {/* Settings / Device Selector Button */}
          <button
            onClick={openSettingsModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
            }}
            title="Audio & Video Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Video & Audio Stage */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        background: '#070a10',
      }}>
        {/* Stage Content */}
        <div style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          position: 'relative',
        }}>
          {/* Error Message Alert */}
          {errorMessage && (
            <div style={{
              position: 'absolute',
              top: '20px',
              zIndex: 30,
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            }}>
              <AlertCircle size={20} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* AUDIO ONLY CALL MODE */}
          {isAudioOnly && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              maxWidth: '600px',
              width: '100%',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '32px',
              }}>
                {/* Local user tile */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(16, 185, 129, 0.3))',
                    border: '3px solid var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    position: 'relative',
                  }}>
                    <Mic size={48} color="var(--accent-primary)" />
                    {isAudioMuted && (
                      <span style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        background: 'var(--danger)',
                        borderRadius: '50%',
                        padding: '6px',
                        display: 'flex',
                      }}>
                        <MicOff size={16} color="#ffffff" />
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>You</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {isAudioMuted ? 'Muted' : 'Speaking'}
                    </p>
                  </div>
                </div>

                {/* Remote Participants */}
                {call.participants
                  .filter((p) => p.userId !== currentUserId)
                  .map((p) => {
                    const state = remoteMediaStates[p.userId];
                    const isMuted = state?.isAudioMuted;
                    return (
                      <div key={p.userId} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                      }}>
                        <div style={{
                          width: '130px',
                          height: '130px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '2px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          <img
                            src={p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={p.displayName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {isMuted && (
                            <span style={{
                              position: 'absolute',
                              bottom: '4px',
                              right: '4px',
                              background: 'var(--danger)',
                              borderRadius: '50%',
                              padding: '6px',
                              display: 'flex',
                            }}>
                              <MicOff size={16} color="#ffffff" />
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{p.displayName}</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {isMuted ? 'Muted' : p.status === 'Joined' ? 'Connected' : p.status}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* VIDEO / GROUP CALL MODE */}
          {!isAudioOnly && (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              gap: '16px',
              gridTemplateColumns: isOneOnOne
                ? '1fr'
                : remoteParticipants.length <= 1
                ? '1fr 1fr'
                : 'repeat(auto-fit, minmax(320px, 1fr))',
              position: 'relative',
            }}>
              {/* Remote Participants */}
              {remoteParticipants.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  color: 'var(--text-secondary)',
                  width: '100%',
                  height: '100%',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}>
                  <Loader2 size={36} className="animate-spin" color="var(--accent-primary)" />
                  <p style={{ fontSize: '1.1rem' }}>Waiting for other participants to join...</p>
                </div>
              ) : (
                remoteParticipants.map((participant) => (
                  <RemoteParticipantTile
                    key={participant.id}
                    participant={participant}
                    call={call}
                    mediaState={remoteMediaStates[participant.userId]}
                  />
                ))
              )}

              {/* Local User PIP or Grid Card */}
              <div style={{
                position: isOneOnOne ? 'absolute' : 'relative',
                bottom: isOneOnOne ? '24px' : 'auto',
                right: isOneOnOne ? '24px' : 'auto',
                width: isOneOnOne ? '260px' : '100%',
                height: isOneOnOne ? '160px' : '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#121722',
                border: isScreenSharing ? '2px solid var(--success)' : '2px solid var(--accent-primary)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                zIndex: 25,
              }}>
                {/* Local Video Render Mount */}
                <div
                  ref={localVideoContainerRef}
                  className="video-container local-video-preview"
                  style={{ width: '100%', height: '100%' }}
                />

                {isVideoMuted && !isScreenSharing && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#121722',
                    color: 'var(--text-secondary)',
                    gap: '6px',
                  }}>
                    <VideoOff size={24} />
                    <span style={{ fontSize: '0.75rem' }}>Camera Off</span>
                  </div>
                )}

                {/* Local Tag */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span>You {isScreenSharing && '(Screen)'}</span>
                  {isAudioMuted && <MicOff size={12} color="var(--danger)" />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Participants Drawer */}
        {showParticipantsDrawer && (
          <div style={{
            width: '320px',
            borderLeft: '1px solid var(--border-color)',
            background: 'rgba(18, 23, 34, 0.95)',
            backdropFilter: 'blur(16px)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 35,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                In This Room ({call.participants.length})
              </h3>
              <button
                onClick={() => setShowParticipantsDrawer(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
              {call.participants.map((p) => {
                const state = remoteMediaStates[p.userId];
                const isMuted = p.userId === currentUserId ? isAudioMuted : state?.isAudioMuted;
                const isCamOff = p.userId === currentUserId ? isVideoMuted : state?.isVideoMuted;
                return (
                  <div key={p.userId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: p.userId === currentUserId ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={p.displayName}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {p.displayName} {p.userId === currentUserId && '(You)'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {p.role}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isMuted && <MicOff size={14} color="var(--danger)" />}
                      {isCamOff && <VideoOff size={14} color="var(--text-muted)" />}
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: p.status === 'Joined' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: p.status === 'Joined' ? 'var(--success)' : 'var(--warning)',
                      }}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Side In-Call Chat Drawer */}
        {showChatDrawer && (
          <div style={{
            width: '340px',
            borderLeft: '1px solid var(--border-color)',
            background: 'rgba(18, 23, 34, 0.95)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 35,
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>In-Call Chat</h3>
              </div>
              <button
                onClick={() => setShowChatDrawer(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Message Thread */}
            <div style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {chatMessages.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  gap: '8px',
                  padding: '20px',
                }}>
                  <MessageSquare size={32} opacity={0.4} />
                  <p style={{ fontSize: '0.85rem' }}>No messages yet.</p>
                  <p style={{ fontSize: '0.75rem' }}>Send a message to everyone in this call.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderUserId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        gap: '4px',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}>
                        <span>{isMe ? 'You' : msg.senderDisplayName}</span>
                        <span>•</span>
                        <span>{formatTimestamp(msg.timestamp)}</span>
                      </div>
                      <div style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                        background: isMe ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        borderBottomRightRadius: isMe ? '2px' : '12px',
                        borderBottomLeftRadius: isMe ? '12px' : '2px',
                      }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendChatMessage}
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                gap: '8px',
              }}
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                style={{
                  background: chatInput.trim() ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: chatInput.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Floating Control Dock */}
      <div style={{
        height: '84px',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(10, 13, 20, 0.9)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '0 24px',
      }}>
        {/* Toggle Mic */}
        <button
          onClick={toggleAudio}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: 'none',
            background: isAudioMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            color: isAudioMuted ? 'var(--danger)' : '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isAudioMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Toggle Camera (Disabled in audio-only) */}
        {!isAudioOnly && (
          <button
            onClick={toggleVideo}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              border: 'none',
              background: isVideoMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              color: isVideoMuted ? 'var(--danger)' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoMuted ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}

        {/* Screen Share Toggle */}
        {!isAudioOnly && (
          <button
            onClick={toggleScreenShare}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              border: 'none',
              background: isScreenSharing ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              color: isScreenSharing ? 'var(--success)' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: isScreenSharing ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none',
            }}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? <ScreenShareOff size={22} /> : <ScreenShare size={22} />}
          </button>
        )}

        {/* End Call / Leave Button */}
        <button
          onClick={endCall}
          style={{
            height: '52px',
            padding: '0 28px',
            borderRadius: '999px',
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <PhoneOff size={22} />
          <span>End Call</span>
        </button>
      </div>

      {/* Settings Modal (Hardware device switcher) */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Device Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Microphone Input
                </label>
                <select
                  value={activeAudioDeviceId}
                  onChange={(e) => handleSelectAudioDevice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#121722',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="">Default Microphone</option>
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {!isAudioOnly && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Camera Video Input
                  </label>
                  <select
                    value={activeVideoDeviceId}
                    onChange={(e) => handleSelectVideoDevice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#121722',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="">Default Camera</option>
                    {videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              style={{
                marginTop: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent to safely attach RemoteMedia view element into DOM
const RemoteParticipantTile: React.FC<{
  participant: RemoteParticipantMedia;
  call: Call;
  mediaState?: { isAudioMuted: boolean; isVideoMuted: boolean; isScreenSharing: boolean };
}> = ({ participant, call, mediaState }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current && participant.viewElement) {
      containerRef.current.innerHTML = '';
      participant.viewElement.style.width = '100%';
      participant.viewElement.style.height = '100%';
      participant.viewElement.style.position = 'absolute';
      participant.viewElement.style.top = '0';
      participant.viewElement.style.left = '0';
      containerRef.current.appendChild(participant.viewElement);

      const video = participant.viewElement.querySelector('video');
      if (video) {
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.autoplay = true;
        video.playsInline = true;
        video.play().catch((err) => console.warn('Remote video play error:', err));

        video.onloadedmetadata = () => {
          video.play().catch(() => {});
        };
      }
    }
  }, [participant.viewElement]);

  const participantInfo = call.participants.find((p) => p.userId === participant.userId);
  const name = participantInfo?.displayName || `User ${participant.userId.substring(0, 8)}`;
  const avatar = participantInfo?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  const isAudioMuted = mediaState?.isAudioMuted;
  const isVideoMuted = mediaState?.isVideoMuted;
  const isScreenSharing = mediaState?.isScreenSharing;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '280px',
      borderRadius: '16px',
      overflow: 'hidden',
      background: '#121722',
      border: isScreenSharing ? '2px solid var(--success)' : '1px solid var(--border-color)',
      position: 'relative',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
    }}>
      <div
        ref={containerRef}
        className="video-container"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Video Muted Overlay Placeholder */}
      {isVideoMuted && !isScreenSharing && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#121722',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          zIndex: 8,
        }}>
          <img
            src={avatar}
            alt={name}
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <VideoOff size={16} />
            <span>Camera is turned off</span>
          </div>
        </div>
      )}

      {/* Participant Info Tag */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        zIndex: 10,
      }}>
        <span>{isScreenSharing ? `${name}'s Screen` : name}</span>
        {isScreenSharing && <ScreenShare size={14} color="var(--success)" />}
        {isAudioMuted ? (
          <MicOff size={14} color="var(--danger)" />
        ) : (
          participant.hasAudio && <Volume2 size={14} color="var(--success)" />
        )}
      </div>
    </div>
  );
};
