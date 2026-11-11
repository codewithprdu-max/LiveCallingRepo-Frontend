import React, { useEffect, useState } from 'react';
import type { CallType, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Phone,
  Video,
  Users,
  Search,
  CheckCircle2,
  Sparkles,
  Cloud,
  Loader2,
} from 'lucide-react';

interface DashboardViewProps {
  onInitiateCall: (title: string, type: CallType, participantIds: string[]) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onInitiateCall }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupCallType, setGroupCallType] = useState<CallType>('Group');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [liveSwitchConfig, setLiveSwitchConfig] = useState<{ applicationId: string; gatewayUrl: string } | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [users, config] = await Promise.all([
          api.getUsers(),
          api.getLiveSwitchConfig(),
        ]);
        setContacts(users);
        setLiveSwitchConfig(config);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const filteredContacts = contacts.filter((c) =>
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartDirectCall = (targetUser: User, type: CallType) => {
    const title = `${user?.displayName || 'User'} & ${targetUser.displayName}`;
    onInitiateCall(title, type, [targetUser.id]);
  };

  const handleCreateGroupCall = () => {
    if (selectedUserIds.length === 0) return;
    const title = groupTitle.trim() || `${user?.displayName}'s Group Discussion`;
    onInitiateCall(title, groupCallType, selectedUserIds);
    setShowGroupModal(false);
    setSelectedUserIds([]);
    setGroupTitle('');
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 clamp(14px, 3vw, 24px) 60px clamp(14px, 3vw, 24px)',
    }}>
      {/* Hero Banner */}
      <div className="glass-panel" style={{
        padding: 'clamp(24px, 4vw, 36px)',
        marginBottom: 'clamp(20px, 3vw, 32px)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(20, 27, 44, 0.8) 0%, rgba(14, 19, 31, 0.9) 100%)',
      }}>
        {/* Glow ambient background element */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '20%',
          width: '260px',
          height: '260px',
          background: 'rgba(99, 102, 241, 0.15)',
          borderRadius: '50%',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }} />

        <div style={{ zIndex: 2, flex: '1 1 360px', maxWidth: '650px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.18)',
            color: 'var(--accent-primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '12px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}>
            <Sparkles size={14} /> WebRTC & Selective Forwarding Unit (SFU)
          </div>
          <h1 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
            fontWeight: 800,
            marginBottom: '10px',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
          }}>
            Welcome back, {user?.displayName}
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(0.88rem, 1.8vw, 1rem)',
            lineHeight: 1.6,
          }}>
            Connect instantly with crystal-clear audio, HD video, real-time chat, screen sharing, and group conference calling powered by LiveSwitch Cloud and ASP.NET Core .NET 10.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowGroupModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.45)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Users size={18} />
              Start Group Call
            </button>
          </div>
        </div>

        {/* LiveSwitch Cloud Status Widget */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          flex: '1 1 280px',
          maxWidth: '360px',
          zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={18} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LiveSwitch Gateway
              </span>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              color: 'var(--success)',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '2px 8px',
              borderRadius: '999px',
            }}>
              <CheckCircle2 size={12} /> Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Gateway Host:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>
                {liveSwitchConfig?.gatewayUrl ? 'cloud.liveswitch.io' : 'cloud.liveswitch.io'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Signaling:</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>SignalR WebSockets</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Media Router:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>LiveSwitch SFU (Audio/Video)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Section Header with Responsive Search */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
      }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.45rem)', fontWeight: 700 }}>
            Available Contacts
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Start a 1:1 direct audio or video call with anyone online
          </p>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '8px 14px',
          width: '100%',
          maxWidth: '320px',
          flex: '1 1 240px',
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              width: '100%',
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" color="var(--accent-primary)" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No contacts found matching "{searchQuery}"
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="glass-panel"
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={contact.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={contact.displayName}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 255, 255, 0.12)',
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: '1px',
                    right: '1px',
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    border: '2px solid #07090e',
                  }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {contact.displayName}
                  </h4>
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    @{contact.username}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => handleStartDirectCall(contact, 'Audio')}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-primary)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Start Audio Call"
                >
                  <Phone size={17} />
                </button>

                <button
                  onClick={() => handleStartDirectCall(contact, 'Video')}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--success)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--success)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                    e.currentTarget.style.color = 'var(--success)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Start Video Call"
                >
                  <Video size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Call Creation Modal */}
      {showGroupModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 90,
          padding: '16px',
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 'clamp(20px, 3vw, 28px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            background: 'rgba(14, 19, 31, 0.98)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
          }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '4px' }}>
                Create Group Call
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Invite multiple users into a shared LiveSwitch video conference
              </p>
            </div>

            {/* Room Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Meeting Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Design Sprint or Weekly Catchup"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Call Type Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Call Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setGroupCallType('Group')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: groupCallType === 'Group' ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: groupCallType === 'Group' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: groupCallType === 'Group' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Video size={16} /> Video Conference
                </button>
                <button
                  type="button"
                  onClick={() => setGroupCallType('Audio')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: groupCallType === 'Audio' ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: groupCallType === 'Audio' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: groupCallType === 'Audio' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Phone size={16} /> Audio Only
                </button>
              </div>
            </div>

            {/* Select Participants */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Select Participants ({selectedUserIds.length} selected)
              </label>
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '4px',
              }}>
                {contacts.map((contact) => {
                  const isSelected = selectedUserIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleSelectUser(contact.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={contact.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={contact.displayName}
                          style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{contact.displayName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{contact.username}</div>
                        </div>
                      </div>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: isSelected ? 'none' : '2px solid var(--text-muted)',
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {isSelected && <CheckCircle2 size={16} color="#ffffff" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowGroupModal(false);
                  setSelectedUserIds([]);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroupCall}
                disabled={selectedUserIds.length === 0}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedUserIds.length > 0 ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: selectedUserIds.length > 0 ? 'pointer' : 'default',
                  boxShadow: selectedUserIds.length > 0 ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
                }}
              >
                Start Call ({selectedUserIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
