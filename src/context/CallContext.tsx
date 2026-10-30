import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Call, CallType } from '../types';
import { api } from '../services/api';
import { signalRService } from '../services/signalrService';
import { useAuth } from './AuthContext';

interface CallContextType {
  activeCall: Call | null;
  incomingCall: Call | null;
  startCall: (title: string, callType: CallType, participantIds: string[]) => Promise<Call>;
  answerCall: (call: Call) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  hangUp: () => Promise<void>;
  setActiveCall: (call: Call | null) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  // Web Audio Ringtone Generator
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);

  const startRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      audioContextRef.current = new AudioCtx();

      const playTone = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        const osc1 = audioContextRef.current.createOscillator();
        const osc2 = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, audioContextRef.current.currentTime); // A4
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, audioContextRef.current.currentTime); // B4

        gain.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContextRef.current.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioContextRef.current.currentTime + 1.2);
        osc2.stop(audioContextRef.current.currentTime + 1.2);
      };

      playTone();
      ringtoneIntervalRef.current = window.setInterval(playTone, 3000);
    } catch {
      // Audio playback may require initial user gesture
    }
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    if (!user) {
      setActiveCall(null);
      setIncomingCall(null);
      stopRingtone();
      return;
    }

    // Subscribe to SignalR events
    const unsubInvitation = signalRService.onInvitation((call) => {
      // If we are already on an active call, ignore or show
      if (!activeCall) {
        setIncomingCall(call);
        startRingtone();
      }
    });

    const unsubAccepted = signalRService.onAccepted((data) => {
      const incomingId = data.callId || (data.call as any)?.id;
      if (activeCall && (activeCall.id === incomingId || activeCall.id === data.callId)) {
        setActiveCall((prev) => (prev ? { ...prev, status: 'InProgress' } : null));
      }
    });

    const unsubRejected = signalRService.onRejected((data) => {
      const incomingId = data.callId || (data.call as any)?.id;
      if (activeCall && (activeCall.id === incomingId || activeCall.id === data.callId) && activeCall.callType !== 'Group') {
        alert('The recipient declined the call.');
        setActiveCall(null);
      }
    });

    const unsubEnded = signalRService.onEnded((call) => {
      if (activeCall && activeCall.id === call.id) {
        setActiveCall(null);
      }
      if (incomingCall && incomingCall.id === call.id) {
        setIncomingCall(null);
        stopRingtone();
      }
    });

    const unsubJoined = signalRService.onParticipantJoined((data) => {
      const incomingId = data.callId || (data.call as any)?.id;
      if (activeCall && (activeCall.id === incomingId || activeCall.id === data.callId)) {
        setActiveCall(data.call);
      }
    });

    const unsubLeft = signalRService.onParticipantLeft((data) => {
      const incomingId = data.callId || (data.call as any)?.id;
      if (activeCall && (activeCall.id === incomingId || activeCall.id === data.callId)) {
        setActiveCall(data.call);
      }
    });

    return () => {
      unsubInvitation();
      unsubAccepted();
      unsubRejected();
      unsubEnded();
      unsubJoined();
      unsubLeft();
      stopRingtone();
    };
  }, [user, activeCall, incomingCall]);

  const startCall = async (title: string, callType: CallType, participantIds: string[]): Promise<Call> => {
    const call = await api.createCall(title, callType, participantIds);
    await signalRService.joinRoom(call.id);
    setActiveCall(call);
    return call;
  };

  const answerCall = async (call: Call): Promise<void> => {
    stopRingtone();
    setIncomingCall(null);
    const updatedCall = await api.joinCall(call.id);
    await signalRService.joinRoom(call.id);
    setActiveCall(updatedCall);
  };

  const rejectCall = async (callId: string): Promise<void> => {
    stopRingtone();
    setIncomingCall(null);
    try {
      await api.rejectCall(callId);
    } catch (err) {
      console.error('Error rejecting call:', err);
    }
  };

  const hangUp = async (): Promise<void> => {
    if (activeCall) {
      const callId = activeCall.id;
      try {
        await api.leaveCall(callId);
        await signalRService.leaveRoom(callId);
      } catch (err) {
        console.error('Error leaving call:', err);
      }
      setActiveCall(null);
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        startCall,
        answerCall,
        rejectCall,
        hangUp,
        setActiveCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
