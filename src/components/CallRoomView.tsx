import React, { useEffect, useState, useRef } from 'react';
import type { Call, RemoteParticipantMedia } from '../types';
import { useLiveSwitchCall } from '../hooks/useLiveSwitchCall';
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
  Volume2
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

  const {
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        </div>

        {/* Timer & Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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

          <button
            onClick={() => setShowParticipantsDrawer(!showParticipantsDrawer)}
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
                    position: 'relative',
                  }}>
                    <Volume2 size={48} color="var(--accent-primary)" />
                    {isAudioMuted && (
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        background: 'var(--danger)',
                        borderRadius: '50%',
                        padding: '6px',
                        display: 'flex',
                      }}>
                        <MicOff size={16} color="#ffffff" />
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600 }}>You (Host)</div>
                    <div style={{ fontSize: '0.8rem', color: isAudioMuted ? 'var(--danger)' : 'var(--success)' }}>
                      {isAudioMuted ? 'Muted' : 'Speaking'}
                    </div>
                  </div>
                </div>

                {/* Remote Participants in Audio Call */}
                {call.participants
                  .filter((p) => p.userId !== currentUserId)
                  .map((p) => (
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
                        border: '3px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                      }}>
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Users size={48} color="var(--text-secondary)" />
                        )}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 600 }}>{p.displayName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {p.status}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Animated Audio Visualizer Bars */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: '40px',
                padding: '0 24px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '999px',
                border: '1px solid var(--border-color)',
              }}>
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '12px' }}>
                  LiveSwitch SFU Audio Stream Active
                </span>
              </div>
            </div>
          )}

          {/* VIDEO CALL MODE (1:1 and Group) */}
          {!isAudioOnly && (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              {/* Group Video Grid (or 1:1 Remote Full Container) */}
              <div style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateColumns: isOneOnOne
                  ? '1fr'
                  : remoteParticipants.length <= 1
                  ? '1fr'
                  : 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '16px',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* Remote Participants */}
                {remoteParticipants.length > 0 ? (
                  remoteParticipants.map((participant) => (
                    <RemoteParticipantTile
                      key={participant.id}
                      participant={participant}
                      call={call}
                    />
                  ))
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(18, 23, 34, 0.4)',
                    borderRadius: '16px',
                    border: '1px dashed var(--border-color)',
                  }}>
                    <Loader2 size={40} className="animate-spin" color="var(--accent-primary)" />
                    <h3 style={{ marginTop: '16px', fontWeight: 600 }}>Waiting for participants to join...</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                      Share this call with your team. LiveSwitch SFU downstream is ready.
                    </p>
                  </div>
                )}
              </div>

              {/* Local Participant Preview Card (Floating PiP in 1:1, or docked) */}
              <div style={{
                position: isOneOnOne ? 'absolute' : 'relative',
                bottom: isOneOnOne ? '24px' : 'auto',
                right: isOneOnOne ? '24px' : 'auto',
                width: isOneOnOne ? '240px' : '100%',
                height: isOneOnOne ? '150px' : '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#121722',
                border: '2px solid var(--accent-primary)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                zIndex: 25,
              }}>
                {/* Local Video Render Mount */}
                <div
                  ref={localVideoContainerRef}
                  className="video-container local-video-preview"
                  style={{ width: '100%', height: '100%' }}
                />

                {isVideoMuted && (
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
                  gap: '4px',
                }}>
                  <span>You</span>
                  {isAudioMuted && <MicOff size={12} color="var(--danger)" />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Participants Drawer */}
        {showParticipantsDrawer && (
          <div style={{
            width: '300px',
            borderLeft: '1px solid var(--border-color)',
            background: 'rgba(18, 23, 34, 0.95)',
            backdropFilter: 'blur(16px)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 35,
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              In This Room ({call.participants.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
              {call.participants.map((p) => (
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
              ))}
            </div>
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
        gap: '20px',
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
    </div>
  );
};

// Subcomponent to safely attach RemoteMedia view element into DOM
const RemoteParticipantTile: React.FC<{
  participant: RemoteParticipantMedia;
  call: Call;
}> = ({ participant, call }) => {
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

  // Lookup participant display name from call object
  const participantInfo = call.participants.find((p) => p.userId === participant.userId);
  const name = participantInfo?.displayName || `User ${participant.userId.substring(0, 8)}`;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '280px',
      borderRadius: '16px',
      overflow: 'hidden',
      background: '#121722',
      border: '1px solid var(--border-color)',
      position: 'relative',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
    }}>
      <div
        ref={containerRef}
        className="video-container"
        style={{ width: '100%', height: '100%' }}
      />

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
        <span>{name}</span>
        {participant.hasAudio && <Volume2 size={14} color="var(--success)" />}
      </div>
    </div>
  );
};
