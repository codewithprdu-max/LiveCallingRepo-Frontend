import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider, useCall } from './context/CallContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CallHistoryView } from './components/CallHistoryView';
import { LoginView } from './components/LoginView';
import { IncomingCallModal } from './components/IncomingCallModal';
import { PreCallLobby } from './components/PreCallLobby';
import { CallRoomView } from './components/CallRoomView';
import type { Call, CallType } from './types';
import { Loader2 } from 'lucide-react';

const MainApplication: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { activeCall, startCall, answerCall, hangUp } = useCall();
  const [currentTab, setCurrentTab] = useState<'contacts' | 'history'>('contacts');

  // Pre-call lobby state
  const [inLobby, setInLobby] = useState(false);
  const [inCallRoom, setInCallRoom] = useState(false);
  const [initialAudio, setInitialAudio] = useState(true);
  const [initialVideo, setInitialVideo] = useState(true);

  // Automatically reset lobby and room state if active call is cleared or hung up
  useEffect(() => {
    if (!activeCall) {
      setInLobby(false);
      setInCallRoom(false);
    }
  }, [activeCall]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--accent-primary)',
      }}>
        <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleInitiateCall = async (title: string, type: CallType, participantIds: string[]) => {
    try {
      await startCall(title, type, participantIds);
      setInLobby(true);
    } catch (err: any) {
      alert(err.message || 'Failed to initiate call');
    }
  };

  const handleJoinFromLobby = (audioEnabled: boolean, videoEnabled: boolean) => {
    setInitialAudio(audioEnabled);
    setInitialVideo(videoEnabled);
    setInLobby(false);
    setInCallRoom(true);
  };

  const handleAnswerIncomingCall = async (incoming: Call) => {
    try {
      const isAudio = incoming.callType === 'Audio';
      setInitialAudio(true);
      setInitialVideo(!isAudio);
      setInLobby(false);
      setInCallRoom(true);
      await answerCall(incoming);
    } catch (err: any) {
      alert(err.message || 'Failed to answer incoming call');
      setInCallRoom(false);
    }
  };

  const handleCancelLobby = async () => {
    setInLobby(false);
    await hangUp();
  };

  const handleLeaveCallRoom = async () => {
    setInCallRoom(false);
    await hangUp();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Views */}
      <main style={{ flex: 1, paddingTop: '16px' }}>
        {currentTab === 'contacts' ? (
          <DashboardView onInitiateCall={handleInitiateCall} />
        ) : (
          <CallHistoryView />
        )}
      </main>

      {/* Incoming Call Notification Modal */}
      <IncomingCallModal onAnswer={handleAnswerIncomingCall} />

      {/* Pre-Call Media Lobby */}
      {inLobby && activeCall && (
        <PreCallLobby
          call={activeCall}
          onJoin={handleJoinFromLobby}
          onCancel={handleCancelLobby}
        />
      )}

      {/* Active In-Call Room */}
      {inCallRoom && activeCall && (
        <CallRoomView
          call={activeCall}
          currentUserId={user.id}
          initialAudioEnabled={initialAudio}
          initialVideoEnabled={initialVideo}
          onLeaveCall={handleLeaveCallRoom}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <CallProvider>
        <MainApplication />
      </CallProvider>
    </AuthProvider>
  );
}

export default App;
