/**
 * AdminPanel.jsx
 * NEW COMPONENT — Visible only to admin role.
 * Features: Generate operator code, display operator codes, audit log.
 * Completely isolated — no existing logic touched.
 */
import { useState } from 'react';
import { useRole } from '../context/RoleContext';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'OPERATOR-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function AdminPanel({ onClose, onNewCode }) {
  const { role, setRole, auditLog } = useRole();
  const [codes, setCodes] = useState([]);

  if (role !== 'admin') return null; // Safety: only render for admin

  const handleGenerate = () => {
    const code = generateCode();
    setCodes(prev => [code, ...prev]);
    onNewCode?.(code);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 8888,
      background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 32, width: '100%', maxWidth: 560,
        maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 0 60px rgba(0,255,136,0.1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-head)', color: 'var(--primary)', fontSize: '1.3rem' }}>
              🛡 Admin Panel
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              GRIDMIND AI · Operator Management
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)', cursor: 'pointer',
          }}>✕ Close</button>
        </div>

        {/* Generate Code */}
        <div style={{
          background: 'rgba(0,255,136,0.04)', border: '1px dashed rgba(0,255,136,0.3)',
          borderRadius: 10, padding: 20, marginBottom: 24,
        }}>
          <h4 style={{ margin: '0 0 12px', fontFamily: 'var(--font-head)', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            Generate Operator Access Code
          </h4>
          <button
            onClick={handleGenerate}
            style={{
              background: 'var(--primary)', color: 'var(--bg-base)',
              border: 'none', borderRadius: 8, padding: '10px 20px',
              fontFamily: 'var(--font-head)', fontWeight: 700, cursor: 'pointer',
              fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(0,255,136,0.25)',
            }}
          >
            + Generate Operator Code
          </button>

          {codes.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Generated codes (share privately):
              </p>
              {codes.map((c, i) => (
                <div key={i} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
                  color: 'var(--warning)', letterSpacing: '0.1em',
                  padding: '4px 12px', background: 'rgba(255,196,0,0.08)',
                  borderRadius: 6, marginBottom: 4, display: 'inline-block', marginRight: 8,
                }}>
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontFamily: 'var(--font-head)', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            📋 Operator Audit Log
          </h4>
          {auditLog.length === 0 ? (
            <div style={{
              padding: '20px', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
              border: '1px dashed var(--border)', borderRadius: 8,
            }}>
              No operator actions logged yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {auditLog.map((entry, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  fontSize: '0.82rem', fontFamily: 'var(--font-mono)',
                }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{entry.timestamp}</span>
                  <span style={{
                    color: entry.decision === 'agree' ? 'var(--primary)'
                      : entry.decision === 'reject' ? 'var(--danger)'
                      : 'var(--warning)',
                    fontWeight: 700, textTransform: 'uppercase', minWidth: 52,
                  }}>{entry.decision}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{entry.action}</span>
                  {entry.zone && <span style={{ color: 'var(--text-muted)' }}>· {entry.zone}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button
            onClick={() => { setRole(null); onClose?.(); }}
            style={{
              background: 'rgba(255,45,85,0.1)', border: '1px solid var(--danger)',
              color: 'var(--danger)', borderRadius: 8, padding: '8px 18px',
              fontSize: '0.85rem', fontFamily: 'var(--font-head)', cursor: 'pointer',
            }}
          >
            🔓 Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
