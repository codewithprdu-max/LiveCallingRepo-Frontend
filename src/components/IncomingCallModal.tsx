import React from 'react';
import { useCall } from '../context/CallContext';
import { Phone, PhoneOff, Video, Mic, Users } from 'lucide-react';
import type { Call } from '../types';

interface IncomingCallModalProps {
  onAnswer?: (call: Call) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ onAnswer }) => {
  const { incomingCall, answerCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const handleAccept = () => {
    if (onAnswer) {
      onAnswer(incomingCall);
    } else {
      answerCall(incomingCall);
    }
  };

  const isAudio = incomingCall.callType === 'Audio';
  const isGroup = incomingCall.callType === 'Group';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div className="glass-panel" style={{
        width: '90%',
        maxWidth: '420px',
        padding: '32px 24px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.2)',
      }}>
        {/* Pulsing Avatar */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
          <div className="ringing-animation" style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }} />
          <img
            src={incomingCall.initiatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={incomingCall.initiatorName}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              position: 'relative',
              zIndex: 2,
              border: '3px solid var(--accent-primary)',
            }}
          />
        </div>

        {/* Caller Name & Info */}
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>
          {incomingCall.initiatorName}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Incoming {incomingCall.callType} Call...
        </p>

        {/* Call Type Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'rgba(99, 102, 241, 0.15)',
          color: 'var(--accent-primary)',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '28px',
        }}>
          {isAudio && <Mic size={14} />}
          {!isAudio && !isGroup && <Video size={14} />}
          {isGroup && <Users size={14} />}
          <span>{incomingCall.title || 'LiveSwitch Call'}</span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          {/* Decline Button */}
          <button
            onClick={() => rejectCall(incomingCall.id)}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="Decline"
          >
            <PhoneOff size={26} />
          </button>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="Accept"
          >
            <Phone size={26} />
          </button>
        </div>
      </div>
    </div>
  );
};
