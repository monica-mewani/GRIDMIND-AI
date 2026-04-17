/**
 * LoginScreen.jsx
 * FIXED: Operator login validation — accepts /^OPERATOR-[A-Z0-9]{4}$/ pattern
 * FIXED: Admin code fully hidden from UI (placeholder, error, legend)
 * FIXED: Logout accessible — role badge in App.jsx handles that
 */
import { useState } from 'react';
import { useRole } from '../context/RoleContext';

// Admin code kept INTERNAL only — never shown in UI
const ADMIN_CODE = 'GRID-ADMIN-999';

// FIXED: Accept any valid OPERATOR-XXXX pattern (4 alphanumeric chars after dash)
const OPERATOR_PATTERN = /^OPERATOR-[A-Z0-9]{4}$/;

export default function LoginScreen({ generatedOperatorCodes = [] }) {
  const { setRole } = useRole();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const trimmed = code.trim().toUpperCase();

      if (trimmed === ADMIN_CODE) {
        // Admin — internal only, no UI hint
        setRole('admin');
      } else if (OPERATOR_PATTERN.test(trimmed)) {
        // FIXED: Accept any matching OPERATOR-XXXX code (no backend required)
        setRole('operator');
      } else {
        // FIXED: Error message does NOT mention admin code
        setError('Invalid access code. Enter your authorized access code.');
      }
    }, 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Animated background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'repeating-linear-gradient(0deg, var(--primary) 0, var(--primary) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, var(--primary) 0, var(--primary) 1px, transparent 1px, transparent 40px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 420,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px', padding: '40px 36px',
        boxShadow: '0 0 60px rgba(0,255,136,0.08)',
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
          <h1 style={{
            fontFamily: 'var(--font-head)', fontSize: '1.6rem',
            color: 'var(--primary)', margin: 0, letterSpacing: '-1px'
          }}>GRIDMIND AI</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '6px 0 0' }}>
            Raigad District · Secure Access Portal
          </p>
        </div>

        {/* Code Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block', fontSize: '0.8rem', fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)', marginBottom: 8
          }}>ACCESS CODE</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            // FIXED: Placeholder does NOT expose admin code
            placeholder="Enter authorized access code"
            style={{
              width: '100%', padding: '12px 16px',
              background: 'var(--bg-card)',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: 8, color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)', fontSize: '1rem',
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
          />
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: '6px 0 0', fontFamily: 'var(--font-mono)' }}>
              ⚠ {error}
            </p>
          )}
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading || !code.trim()}
          style={{
            width: '100%', padding: '12px', marginBottom: 12,
            background: loading ? 'rgba(0,255,136,0.3)' : 'var(--primary)',
            color: 'var(--bg-base)', border: 'none', borderRadius: 8,
            fontSize: '0.95rem', fontWeight: 700,
            fontFamily: 'var(--font-head)', cursor: loading ? 'wait' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(0,255,136,0.3)',
          }}
        >
          {loading ? '🔐 Authenticating...' : '🔐 Enter System'}
        </button>

        {/* Viewer bypass */}
        <button
          onClick={() => setRole('viewer')}
          style={{
            width: '100%', padding: '10px',
            background: 'transparent', color: 'var(--text-muted)',
            border: '1px solid var(--border)', borderRadius: 8,
            fontSize: '0.85rem', fontFamily: 'var(--font-body)', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          👁 Continue as Viewer (Read Only)
        </button>

        {/* Role Legend — FIXED: admin code removed from display */}
        <div style={{
          marginTop: 28, padding: '14px', borderRadius: 8,
          background: 'rgba(0,255,136,0.04)', border: '1px dashed var(--border)',
          fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
          lineHeight: 1.8
        }}>
          <div>🟢 <strong style={{color:'var(--primary)'}}>Admin</strong> — Authorized personnel only · Full control</div>
          <div>🟡 <strong style={{color:'var(--warning)'}}>Operator</strong> — OPERATOR-XXXX code · Approve / Modify AI</div>
          <div>⚪ <strong style={{color:'var(--text-muted)'}}>Viewer</strong> — Read-only access</div>
        </div>
      </div>
    </div>
  );
}
