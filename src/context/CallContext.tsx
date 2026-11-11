import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { normalizeCall, type Call, type CallType } from '../types';
import { api } from '../services/api';
import { signalRService } from '../services/signalrService';
import { soundService } from '../services/soundService';
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

  // Keep fresh references for SignalR callbacks to prevent stale closure issues
  const activeCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    if (!user) {
      setActiveCall(null);
      setIncomingCall(null);
      soundService.stopAll();
      return;
    }

    // 1. Incoming Call Invitation (Receiver side) -> Play Ringtone
    const unsubInvitation = signalRService.onInvitation((call) => {
      if (!activeCallRef.current) {
        const normalized = normalizeCall(call);
        setIncomingCall(normalized);
        soundService.playRingtone();
      }
    });

    // 2. Call Accepted -> Stop ringback/ringtone
    const unsubAccepted = signalRService.onAccepted((data) => {
      soundService.stopAll();
      const incomingId = data.callId || (data.call as any)?.id;
      if (activeCallRef.current && (activeCallRef.current.id === incomingId || activeCallRef.current.id === data.callId)) {
        setActiveCall((prev) => (prev ? { ...prev, status: 'InProgress' } : null));
      }
    });

    // 3. Call Rejected -> Stop dial tone and end
    const unsubRejected = signalRService.onRejected((data) => {
      soundService.stopAll();
      soundService.playCallEndedTone();
      const incomingId = data.callId || (data.call as any)?.id;
      if (
        activeCallRef.current &&
        (activeCallRef.current.id === incomingId || activeCallRef.current.id === data.callId) &&
        activeCallRef.current.callType !== 'Group'
      ) {
        alert('The recipient declined the call.');
        setActiveCall(null);
      }
    });

    // 4. Call Ended -> Either party clicked End Call
    const unsubEnded = signalRService.onEnded((call) => {
      const endedId = call?.id || (call as any)?.Id;
      console.log('SignalR CallEnded received for call:', endedId);
      soundService.stopAll();
      soundService.playCallEndedTone();

      if (activeCallRef.current && (!endedId || activeCallRef.current.id === endedId)) {
        setActiveCall(null);
      }
      if (incomingCallRef.current && (!endedId || incomingCallRef.current.id === endedId)) {
        setIncomingCall(null);
      }
    });

    // 5. Participant Joined
    const unsubJoined = signalRService.onParticipantJoined((data) => {
      soundService.stopAll();
      const incomingId = data.callId || (data.call as any)?.id;
      if (activeCallRef.current && (activeCallRef.current.id === incomingId || activeCallRef.current.id === data.callId)) {
        setActiveCall(normalizeCall(data.call));
      }
    });

    // 6. Participant Left (In 1-on-1 calls, if the other person leaves, automatically end the call for both!)
    const unsubLeft = signalRService.onParticipantLeft((data) => {
      const incomingId = data.callId || (data.call as any)?.id;
      const current = activeCallRef.current;

      if (current && (current.id === incomingId || current.id === data.callId)) {
        if (current.callType !== 'Group' && data.userId && data.userId !== user.id) {
          console.log('Other participant left the 1-on-1 call. Automatically ending call.');
          soundService.stopAll();
          soundService.playCallEndedTone();
          setActiveCall(null);
          return;
        }
        setActiveCall(normalizeCall(data.call));
      }
    });

    return () => {
      unsubInvitation();
      unsubAccepted();
      unsubRejected();
      unsubEnded();
      unsubJoined();
      unsubLeft();
      soundService.stopAll();
    };
  }, [user]);

  // Initiate outgoing call -> starts outgoing ringback tone
  const startCall = async (title: string, callType: CallType, participantIds: string[]): Promise<Call> => {
    const rawCall = await api.createCall(title, callType, participantIds);
    const call = normalizeCall(rawCall);
    await signalRService.joinRoom(call.id);
    setActiveCall(call);

    // Play outgoing phone dial/ringback tone for caller
    soundService.playOutgoingRingback();
    return call;
  };

  // Answer incoming call -> stops ringtone immediately
  const answerCall = async (call: Call): Promise<void> => {
    soundService.stopAll();
    setIncomingCall(null);
    const updatedCall = await api.joinCall(call.id);
    await signalRService.joinRoom(call.id);
    setActiveCall(normalizeCall(updatedCall));
  };

  // Reject incoming call -> stops ringtone and notifies caller
  const rejectCall = async (callId: string): Promise<void> => {
    soundService.stopAll();
    soundService.playCallEndedTone();
    setIncomingCall(null);
    try {
      await api.rejectCall(callId);
    } catch (err) {
      console.error('Error rejecting call:', err);
    }
  };

  // End call -> notifies both caller and receiver to hang up automatically!
  const hangUp = async (): Promise<void> => {
    const call = activeCallRef.current;
    if (call) {
      const callId = call.id;
      soundService.stopAll();
      soundService.playCallEndedTone();
      try {
        // Inform backend to end the call and broadcast CallEnded to all participants
        await api.endCall(callId);
      } catch (err) {
        console.warn('api.endCall failed, attempting api.leaveCall as fallback:', err);
        try {
          await api.leaveCall(callId);
        } catch {}
      } finally {
        try {
          await signalRService.leaveRoom(callId);
        } catch {}
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
