import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneCall, Settings } from 'lucide-react';
import type { Call, MediaDeviceInfoOption } from '../types';

interface PreCallLobbyProps {
  call: Call;
  onJoin: (audioEnabled: boolean, videoEnabled: boolean, audioDeviceId?: string, videoDeviceId?: string) => void;
  onCancel: () => void;
}

export const PreCallLobby: React.FC<PreCallLobbyProps> = ({ call, onJoin, onCancel }) => {
  const isAudioOnly = call.callType === 'Audio';
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(!isAudioOnly);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfoOption[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfoOption[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate devices once access is permitted
  const enumerateMediaDevices = async () => {
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

      if (audioIns.length > 0 && !selectedAudioId) {
        setSelectedAudioId(audioIns[0].deviceId);
      }
      if (videoIns.length > 0 && !selectedVideoId) {
        setSelectedVideoId(videoIns[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate media devices:', err);
    }
  };

  useEffect(() => {
    let active = true;

    const startLocalPreview = async () => {
      // Do not request video for audio-only calls!
      if (isAudioOnly) return;

      try {
        const constraints: MediaStreamConstraints = {
          video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
          audio: false, // audio preview not played back locally to avoid feedback
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }

        await enumerateMediaDevices();
      } catch (err: any) {
        if (active) {
          setPermissionError('Camera access was not granted or device is in use.');
        }
      }
    };

    if (videoEnabled && !isAudioOnly) {
      startLocalPreview();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
      }
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [videoEnabled, isAudioOnly, selectedVideoId]);

  const handleJoin = () => {
    // Release preview stream before handing over to LiveSwitch
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onJoin(audioEnabled, videoEnabled, selectedAudioId, selectedVideoId);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 80,
      padding: '20px',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '540px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>
            Ready to Join?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {call.title} ({call.callType} Call)
          </p>
        </div>

        {/* Video Preview or Audio Wave Card */}
        <div style={{
          width: '100%',
          height: '240px',
          borderRadius: '16px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {!isAudioOnly && videoEnabled ? (
            <video
              ref={previewVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Mirror preview
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: 'var(--accent-primary)',
              }}>
                <Mic size={32} />
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>
                {isAudioOnly ? 'Audio Only Mode' : 'Camera is Disabled'}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {audioEnabled ? 'Your microphone is ready and active' : 'Microphone is currently muted'}
              </p>
            </div>
          )}

          {permissionError && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              textAlign: 'center',
            }}>
              {permissionError}
            </div>
          )}
        </div>

        {/* Device Quick Toggles */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: audioEnabled ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: audioEnabled ? 'var(--accent-primary)' : 'var(--danger)',
              transition: 'all 0.2s',
            }}
          >
            {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            {audioEnabled ? 'Mic Active' : 'Mic Muted'}
          </button>

          {!isAudioOnly && (
            <button
              onClick={() => setVideoEnabled(!videoEnabled)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: videoEnabled ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: videoEnabled ? 'var(--accent-primary)' : 'var(--danger)',
                transition: 'all 0.2s',
              }}
            >
              {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
              {videoEnabled ? 'Camera On' : 'Camera Off'}
            </button>
          )}
        </div>

        {/* Hardware Device Selectors */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Settings size={14} />
            <span>Select Media Devices</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: !isAudioOnly ? '1fr 1fr' : '1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Microphone
              </label>
              <select
                value={selectedAudioId}
                onChange={(e) => setSelectedAudioId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#121722',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              >
                {audioDevices.length === 0 && <option value="">Default Microphone</option>}
                {audioDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {!isAudioOnly && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Camera
                </label>
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#121722',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                >
                  {videoDevices.length === 0 && <option value="">Default Camera</option>}
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Join or Cancel buttons */}
        <div style={{ display: 'flex', width: '100%', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleJoin}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
          >
            <PhoneCall size={18} />
            Join Call Now
          </button>
        </div>
      </div>
    </div>
  );
};
