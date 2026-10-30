import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, Users, History, LogOut, Radio } from 'lucide-react';

interface NavbarProps {
  currentTab: 'contacts' | 'history';
  onSelectTab: (tab: 'contacts' | 'history') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout, quickSwitchUser } = useAuth();

  return (
    <header className="glass-panel" style={{
      margin: '16px 24px',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '16px',
      zIndex: 40
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1, #10b981)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
        }}>
          <Phone size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em' }}>
              LiveSwitch<span style={{ color: 'var(--accent-primary)' }}>Cloud</span>
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <Radio size={10} className="animate-pulse" /> SFU Online
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audio, Video & Group Calling</p>
        </div>
      </div>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: '8px', background: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '12px' }}>
        <button
          onClick={() => onSelectTab('contacts')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            background: currentTab === 'contacts' ? 'var(--accent-primary)' : 'transparent',
            color: currentTab === 'contacts' ? '#ffffff' : 'var(--text-secondary)',
          }}
        >
          <Users size={16} /> Contacts & Calling
        </button>

        <button
          onClick={() => onSelectTab('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            background: currentTab === 'history' ? 'var(--accent-primary)' : 'transparent',
            color: currentTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
          }}
        >
          <History size={16} /> Call History
        </button>
      </nav>

      {/* User Info & Quick Switcher */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--accent-primary)',
              }}
            />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.displayName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                @{user.username}
              </div>
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', padding: '3px 6px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '4px' }}>Switch:</span>
            {['alice', 'bob', 'charlie'].map((uname) => (
              <button
                key={uname}
                onClick={() => quickSwitchUser(uname)}
                disabled={user.username === uname}
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: user.username === uname ? 'default' : 'pointer',
                  background: user.username === uname ? 'var(--accent-primary)' : 'transparent',
                  color: user.username === uname ? '#ffffff' : 'var(--text-secondary)',
                  opacity: user.username === uname ? 1 : 0.7,
                }}
              >
                {uname.charAt(0).toUpperCase() + uname.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={logout}
            title="Log out"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--danger)',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
};
