import React, { useEffect, useState } from 'react';
import type { Call } from '../types';
import { api } from '../services/api';
import {
  History,
  Phone,
  Video,
  Users,
  Clock,
  Calendar,
  Loader2
} from 'lucide-react';

export const CallHistoryView: React.FC = () => {
  const [history, setHistory] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const calls = await api.getCallHistory();
        setHistory(calls);
      } catch (err) {
        console.error('Failed to load call history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDuration = (seconds?: number) => {
    if (!seconds && seconds !== 0) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 60px 24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'rgba(99, 102, 241, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
        }}>
          <History size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Call History</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Review past audio, video, and group calls
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={36} className="animate-spin" color="var(--accent-primary)" />
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <History size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h3>No calls logged yet</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Start an audio or video call to see history here.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                <th style={{ padding: '16px 20px' }}>Call Title & Type</th>
                <th style={{ padding: '16px 20px' }}>Participants</th>
                <th style={{ padding: '16px 20px' }}>Date</th>
                <th style={{ padding: '16px 20px' }}>Duration</th>
                <th style={{ padding: '16px 20px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((call) => {
                const isAudio = call.callType === 'Audio';
                const isGroup = call.callType === 'Group';

                return (
                  <tr
                    key={call.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Call Title & Type */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isAudio
                            ? 'rgba(99, 102, 241, 0.15)'
                            : isGroup
                            ? 'rgba(168, 85, 247, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                          color: isAudio
                            ? 'var(--accent-primary)'
                            : isGroup
                            ? '#a855f7'
                            : 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {isAudio && <Phone size={18} />}
                          {!isAudio && !isGroup && <Video size={18} />}
                          {isGroup && <Users size={18} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{call.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{call.callType} Call</div>
                        </div>
                      </div>
                    </td>

                    {/* Participants Avatars */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {call.participants.slice(0, 4).map((p, index) => (
                          <img
                            key={p.userId}
                            src={p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={p.displayName}
                            title={p.displayName}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #121722',
                              marginLeft: index > 0 ? '-8px' : 0,
                            }}
                          />
                        ))}
                        {call.participants.length > 4 && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginLeft: '6px',
                          }}>
                            +{call.participants.length - 4}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        <span>{formatDate(call.createdAt)}</span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td style={{ padding: '16px 20px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="var(--text-muted)" />
                        <span>{formatDuration(call.durationSeconds)}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: call.status === 'Ended'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : call.status === 'InProgress'
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                        color: call.status === 'Ended'
                          ? 'var(--success)'
                          : call.status === 'InProgress'
                          ? 'var(--accent-primary)'
                          : 'var(--danger)',
                      }}>
                        {call.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
