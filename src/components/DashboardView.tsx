import React, { useEffect, useState } from 'react';
import type { CallType, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import {
  Phone,
  Video,
  Users,
  Search,
  CheckCircle2,
  Sparkles,
  Cloud,
  Loader2,
  Plus
} from 'lucide-react';

interface DashboardViewProps {
  onInitiateCall: (title: string, type: CallType, participantIds: string[]) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onInitiateCall }) => {
  const { user } = useAuth();
  const { } = useCall();
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 60px 24px' }}>
      {/* Hero Banner */}
      <div className="glass-panel" style={{
        padding: '36px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ zIndex: 2, maxWidth: '650px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '12px',
          }}>
            <Sparkles size={14} /> WebRTC & Selective Forwarding Unit (SFU)
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', lineHeight: 1.2 }}>
            Welcome back, {user?.displayName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
            Connect instantly with crystal-clear audio, HD video, and group conference calling powered by LiveSwitch Cloud and ASP.NET Core .NET 10.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={() => setShowGroupModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.15s ease',
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
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          minWidth: '280px',
          zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Cloud size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              LiveSwitch Cloud
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Gateway:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                {liveSwitchConfig?.gatewayUrl || 'cloud.liveswitch.io'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Application:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                {liveSwitchConfig?.applicationId || 'liveswitch-app'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <CheckCircle2 size={12} /> Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Section */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Available Contacts</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Select a contact below to start a 1:1 audio or video call
          </p>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '8px 14px',
          width: '280px',
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="glass-panel"
              style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={contact.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={contact.displayName}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{contact.displayName}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{contact.username}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
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
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  title="Start Audio Call"
                >
                  <Phone size={18} />
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
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                    e.currentTarget.style.color = 'var(--success)';
                  }}
                  title="Start Video Call"
                >
                  <Video size={18} />
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 90,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>Create Group Call</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Invite multiple participants into an SFU channel
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Call Topic / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Design Sprint Sync"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Media Mode
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setGroupCallType('Group')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    background: groupCallType === 'Group' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: groupCallType === 'Group' ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  Video & Audio Group
                </button>
                <button
                  type="button"
                  onClick={() => setGroupCallType('Audio')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    background: groupCallType === 'Audio' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: groupCallType === 'Audio' ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  Audio Only Conference
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                Select Participants ({selectedUserIds.length} selected)
              </label>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '6px',
              }}>
                {contacts.map((c) => {
                  const isSelected = selectedUserIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleSelectUser(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={c.avatarUrl}
                          alt={c.displayName}
                          style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                        />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{c.displayName}</span>
                      </div>

                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}>
                        {isSelected && <CheckCircle2 size={14} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
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
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroupCall}
                disabled={selectedUserIds.length === 0}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedUserIds.length > 0 ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  cursor: selectedUserIds.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={16} />
                Start Group ({selectedUserIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
