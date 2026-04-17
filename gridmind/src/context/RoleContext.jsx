/**
 * RoleContext.jsx
 * NEW ADDITION — Does not modify any existing context or state.
 * Provides: role, setRole, auditLog, addAuditEntry
 * Role is persisted in localStorage under 'gm_role'.
 */
import { createContext, useContext, useState, useCallback } from 'react';

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  // Load persisted role from localStorage (safe — key is unique to this feature)
  const [role, setRoleState] = useState(() => {
    return localStorage.getItem('gm_role') || null; // null = not logged in
  });

  // Audit log: array of { timestamp, action, decision, zone? }
  const [auditLog, setAuditLog] = useState([]);

  const setRole = useCallback((newRole) => {
    if (newRole) {
      localStorage.setItem('gm_role', newRole);
    } else {
      localStorage.removeItem('gm_role');
    }
    setRoleState(newRole);
  }, []);

  const addAuditEntry = useCallback((entry) => {
    setAuditLog(prev => [
      {
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        ...entry
      },
      ...prev.slice(0, 49) // Keep last 50 entries max
    ]);
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole, auditLog, addAuditEntry }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}
