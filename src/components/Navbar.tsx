import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, Users, History, LogOut, Radio, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentTab: 'contacts' | 'history';
  onSelectTab: (tab: 'contacts' | 'history') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout, quickSwitchUser } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="glass-panel" style={{
      margin: '12px clamp(12px, 2.5vw, 24px)',
      padding: '10px clamp(12px, 2vw, 20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '12px',
      zIndex: 40,
      gap: '12px',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #10b981)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.45)',
          flexShrink: 0,
        }}>
          <Phone size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)',
              letterSpacing: '-0.03em',
            }}>
              LiveSwitch<span style={{ color: 'var(--accent-primary)' }}>Cloud</span>
            </span>
            <span className="hide-on-mobile" style={{
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.68rem',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              <Radio size={10} className="animate-pulse" /> SFU Active
            </span>
          </div>
          <p className="hide-on-mobile" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Real-Time WebRTC Calling
          </p>
        </div>
      </div>

      {/* Navigation Tabs (Desktop & Tablet) */}
      <nav className="hide-on-mobile" style={{
        display: 'flex',
        gap: '4px',
        background: 'rgba(0, 0, 0, 0.35)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}>
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
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            background: currentTab === 'contacts' ? 'var(--accent-primary)' : 'transparent',
            color: currentTab === 'contacts' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: currentTab === 'contacts' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none',
          }}
        >
          <Users size={16} /> Contacts
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
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            background: currentTab === 'history' ? 'var(--accent-primary)' : 'transparent',
            color: currentTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: currentTab === 'history' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none',
          }}
        >
          <History size={16} /> History
        </button>
      </nav>

      {/* User Info & Quick Switcher (Desktop) */}
      {user && (
        <div className="hide-on-mobile" style={{ alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--accent-primary)',
              }}
            />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.displayName}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                @{user.username}
              </div>
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            padding: '3px 6px',
            borderRadius: '8px',
          }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginRight: '2px' }}>Switch:</span>
            {['alice', 'bob', 'charlie'].map((uname) => (
              <button
                key={uname}
                onClick={() => quickSwitchUser(uname)}
                disabled={user.username === uname}
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: user.username === uname ? 'default' : 'pointer',
                  background: user.username === uname ? 'var(--accent-primary)' : 'transparent',
                  color: user.username === uname ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: user.username === uname ? 700 : 500,
                  transition: 'all 0.15s ease',
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
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--danger)',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      )}

      {/* Mobile Toggle Button */}
      <div className="show-on-mobile" style={{ alignItems: 'center', gap: '8px' }}>
        {user && (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--accent-primary)',
            }}
          />
        )}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-color)',
            color: '#ffffff',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Toggle navigation menu"
        >
          {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Dropdown Panel */}
      {showMobileMenu && (
        <div className="glass-panel" style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: 'rgba(12, 16, 26, 0.98)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
          zIndex: 50,
        }}>
          {/* Mobile Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => {
                onSelectTab('contacts');
                setShowMobileMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: currentTab === 'contacts' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: currentTab === 'contacts' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              <Users size={16} /> Contacts
            </button>
            <button
              onClick={() => {
                onSelectTab('history');
                setShowMobileMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: currentTab === 'history' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: currentTab === 'history' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              <History size={16} /> History
            </button>
          </div>

          {/* Quick Demo Switcher */}
          {user && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Login Demo Accounts:</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                {['alice', 'bob', 'charlie'].map((uname) => (
                  <button
                    key={uname}
                    onClick={() => {
                      quickSwitchUser(uname);
                      setShowMobileMenu(false);
                    }}
                    disabled={user.username === uname}
                    style={{
                      fontSize: '0.8rem',
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: user.username === uname ? 'default' : 'pointer',
                      background: user.username === uname ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
                      color: user.username === uname ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {uname.charAt(0).toUpperCase() + uname.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User Sign Out */}
          {user && (
            <button
              onClick={() => {
                logout();
                setShowMobileMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--danger)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} /> Sign Out ({user.displayName})
            </button>
          )}
        </div>
      )}
    </header>
  );
};
