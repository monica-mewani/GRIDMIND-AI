import { useState, useEffect } from 'react';
/* FIXED #5 crash: small summary top-bar still requires these recharts imports */
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import { Bell, Bot, X as XIcon, Activity, Sliders } from 'lucide-react';
import { alertsData } from '../data/kaggleData';
import '../styles/AIAlertsPage.css';
import '../styles/GridmindExtra.css';

/* NEW: Role context — read-only access, does not change existing logic */
import { useRole } from '../context/RoleContext';
/* FIXED #1: Crisis context to access simulated alerts dynamically */
import { useCrisis } from '../context/CrisisContext';

/* MSEDCL Zones Mapping — UNCHANGED */
const getZone = (hour) => {
  const zones = ['Bhatan', 'Somathne', 'Palaspe', 'Kalamboli'];
  return zones[hour % 4];
};

/* FIXED #5: WEEKLY_DATA removed — bar graph deleted */

/* NEW: Static alert metadata — confidence + reason fields.
   Layered on top; the existing alertsData structure is untouched.
   Keyed by alert id to avoid touching dynamic data. */
const ALERT_META = {
  'hc-1': {
    confidence: 0.93,
    reason: 'Cloud-cover sensor at Bhatan solar farm detected 74% occlusion. Historical pre-monsoon pattern match: 91% similarity to June 2025 event. Battery pre-charge prevents cascade failure.'
  },
  'hc-2': {
    confidence: 0.62,
    reason: 'Agricultural load spike pattern detected on Palaspe feeder. Kharif sowing correlation: 0.78. Low confidence due to irregular pump usage; operator review advised.'
  },
  'hc-3': {
    confidence: 0.96,
    reason: 'Load Forecaster predicts 4.2kW demand peak at 19:00 IST based on 30-day Bhatan residential patterns. Battery SoC of 67% is sufficient if tapering begins before 18:15.'
  },
};

// Assign confidence to dynamic alerts based on severity
const getDynMeta = (alertType, idx) => ({
  confidence: alertType === 'CRITICAL' ? 0.82 + (idx % 3) * 0.04 : 0.55 + (idx % 4) * 0.06,
  reason: alertType === 'CRITICAL'
    ? 'XGBoost Overload Detector flagged voltage deviation > 2σ from 50,000-reading baseline.'
    : 'Grid Stability Classifier returned WARNING with power-factor drop below 0.93 threshold.'
});

/* NEW: Confidence badge component */
function ConfidenceBadge({ value }) {
  const pct = Math.round(value * 100);
  const cls = value >= 0.8 ? 'high' : value >= 0.7 ? 'medium' : 'low';
  return (
    <span className={`gm-confidence ${cls}`}>
      AI Confidence: {pct}%
    </span>
  );
}

/* NEW: Modify Modal — minimal, isolated */
function ModifyModal({ alertId, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  const [battAdj, setBattAdj] = useState(50);
  const [loadRed, setLoadRed] = useState(20);

  return (
    <div className="gm-modal-overlay">
      <div className="gm-modal">
        <h3>✏ Modify AI Action</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', margin: '0 0 16px' }}>
          Alert: <strong>{alertId}</strong> · Edit parameters below
        </p>

        {/* Battery Override */}
        <div className="gm-modal-field">
          <label>Battery Pre-charge Target: {battAdj}%</label>
          <input type="range" min={20} max={100} value={battAdj}
            onChange={e => setBattAdj(Number(e.target.value))} />
        </div>

        {/* Load Reduction */}
        <div className="gm-modal-field">
          <label>Load Reduction %: {loadRed}%</label>
          <input type="range" min={0} max={80} value={loadRed}
            onChange={e => setLoadRed(Number(e.target.value))} />
        </div>

        {/* Operator Note */}
        <div className="gm-modal-field">
          <label>Operator Note (optional)</label>
          <textarea
            rows={2}
            placeholder="Reason for modification..."
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="gm-modal-actions">
          <button className="gm-btn gm-btn-reject" onClick={onClose}>Cancel</button>
          <button className="gm-btn gm-btn-agree" onClick={() => onConfirm({ battAdj, loadRed, note })}>
            ✔ Confirm Modified Action
          </button>
        </div>
      </div>
    </div>
  );
}

/* NEW: Manual Override Panel */
function ManualOverridePanel({ onApply }) {
  const [battLevel, setBattLevel] = useState(50);
  const [loadRed, setLoadRed] = useState(0);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    setApplied(true);
    onApply?.({ battLevel, loadRed });
    setTimeout(() => setApplied(false), 3000);
  };

  return (
    <div className="gm-override-panel">
      <h4><Sliders size={16} /> Manual Override Controls</h4>
      <div className="gm-override-row">
        <label>Battery Level Target</label>
        <input type="range" min={10} max={100} value={battLevel}
          onChange={e => setBattLevel(Number(e.target.value))} />
        <span className="gm-override-value">{battLevel}%</span>
      </div>
      <div className="gm-override-row">
        <label>Load Reduction %</label>
        <input type="range" min={0} max={60} value={loadRed}
          onChange={e => setLoadRed(Number(e.target.value))} />
        <span className="gm-override-value">{loadRed}%</span>
      </div>
      <button
        className="gm-btn gm-btn-modify"
        onClick={handleApply}
        style={{ marginTop: 4 }}
        disabled={applied}
      >
        {applied ? '✅ Override Applied (Simulated)' : '⚡ Apply Override'}
      </button>
    </div>
  );
}

/* FIXED #6 & #7: Now receives alertCount + setAlertCount from App.jsx for dynamic sidebar badge */
export default function AIAlertsPage({ alertCount, setAlertCount }) {
  const [animIn, setAnimIn] = useState(false);
  
  /* NEW: Access role context — read only, no side effects on existing logic */
  const { role, addAuditEntry } = useRole();
  const canAct = role === 'admin' || role === 'operator';

  const initialCritical = alertsData.filter(a => a.alert_type === 'CRITICAL').length + 1;
  const initialWarning = alertsData.filter(a => a.alert_type === 'WARNING').length + 2;
  
  /* FIXED #1: Retrieve simulated alerts from global crisis context */
  const { simulatedAlerts } = useCrisis();

  const [counts, setCounts] = useState({
    critical: initialCritical,
    warning: initialWarning,
    info: 3
  });

  /* FIXED #5: dynamically update counts when simulated alert is added */
  const [prevSimCount, setPrevSimCount] = useState(0);
  useEffect(() => {
    if (simulatedAlerts && simulatedAlerts.length > prevSimCount) {
      setCounts(prev => ({ ...prev, critical: prev.critical + (simulatedAlerts.length - prevSimCount) }));
      setPrevSimCount(simulatedAlerts.length);
    }
  }, [simulatedAlerts?.length, prevSimCount]);

  const [alertsState, setAlertsState] = useState({});

  /* NEW: Modal + override panel state — isolated */
  const [modifyTarget, setModifyTarget] = useState(null);
  const [showOverride, setShowOverride] = useState(false);

  /* ADDED #6: Local operator logs — no backend required, isolated state */
  const [operatorLogs, setOperatorLogs] = useState([]);

  const addLog = (action, details, decision) => {
    setOperatorLogs(prev => [
      {
        time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        action,
        details,
        decision,
      },
      ...prev.slice(0, 29), // keep last 30
    ]);
  };

  useEffect(() => {
    setAnimIn(true);
  }, []);

  /* handleAction — FIXED #7: calls setAlertCount + ADDED #6: logs every action */
  const handleAction = (id, actionType, severityClass, zone = '') => {
    if (actionType === 'accept') {
      setAlertsState(prev => ({ ...prev, [id]: 'executing' }));
      addAuditEntry({ action: `Alert ${id} — Agree`, decision: 'agree', zone });
      addLog('Agree', `Alert ${id} — applied AI action`, 'agree');
      setTimeout(() => {
        setAlertsState(prev => ({ ...prev, [id]: 'completed_accept' }));
        setCounts(prev => {
          if (severityClass === 'CRITICAL') return { ...prev, critical: Math.max(0, prev.critical - 1) };
          if (severityClass === 'WARNING')  return { ...prev, warning:  Math.max(0, prev.warning  - 1) };
          return { ...prev, info: Math.max(0, prev.info - 1) };
        });
        setAlertCount?.(prev => Math.max(0, (prev ?? 0) - 1));
      }, 1500);
    } else if (actionType === 'dismiss') {
      setAlertsState(prev => ({ ...prev, [id]: 'dismissing' }));
      addAuditEntry({ action: `Alert ${id} — Reject`, decision: 'reject', zone });
      addLog('Reject', `Alert ${id} — dismissed, no action taken`, 'reject');
      setTimeout(() => {
        setAlertsState(prev => ({ ...prev, [id]: 'dismissed' }));
        setCounts(prev => {
          if (severityClass === 'CRITICAL') return { ...prev, critical: Math.max(0, prev.critical - 1) };
          if (severityClass === 'WARNING')  return { ...prev, warning:  Math.max(0, prev.warning  - 1) };
          return { ...prev, info: Math.max(0, prev.info - 1) };
        });
        setAlertCount?.(prev => Math.max(0, (prev ?? 0) - 1));
      }, 600);
    }
  };

  /* EXISTING getAlertClasses — UNCHANGED */
  const getAlertClasses = (id, defaultBorder) => {
    const state = alertsState[id];
    let classes = `glass-card al-card `;
    if (defaultBorder === 'CRITICAL') classes += 'al-border-critical al-pulse ';
    if (defaultBorder === 'WARNING') classes += 'al-border-warning ';
    if (defaultBorder === 'INFO') classes += 'al-border-info ';
    
    if (state === 'executing') classes += 'al-executing ';
    if (state === 'completed_accept') classes += 'al-completed ';
    if (state === 'dismissing') classes += 'al-dismissing ';
    if (state === 'dismissed') classes += 'al-hidden ';
    
    return classes;
  };

  /* NEW: Render action bar with Agree / Modify / Reject (replaces old Accept/Dismiss for acting roles) */
  const renderActionBar = (id, severity, zone = '') => {
    const state = alertsState[id];
    const meta = ALERT_META[id] || getDynMeta(severity, 0);

    if (state === 'executing') {
      return (
        <div className="al-actions" style={{justifyContent: 'center', color: 'var(--text-secondary)'}}>
          <Activity size={16} className="al-spin" /> ⏳ Executing...
        </div>
      );
    }
    if (state === 'completed_accept') {
      return (
        <div className="al-actions" style={{justifyContent: 'center', color: 'var(--primary)'}}>
          ✅ Action Complete
        </div>
      );
    }

    /* viewer: read-only note */
    if (!canAct) {
      return (
        <div className="gm-action-bar">
          <span className="gm-viewer-note">👁 Viewer mode — actions disabled</span>
        </div>
      );
    }

    return (
      <div className="gm-action-bar">
        {/* ✔ Agree → same as old Accept */}
        <button className="gm-btn gm-btn-agree"
          onClick={() => handleAction(id, 'accept', severity, zone)}>
          ✔ Agree
        </button>
        {/* ✏ Modify → open modal */}
        <button className="gm-btn gm-btn-modify"
          onClick={() => setModifyTarget({ id, zone, severity })}>
          ✏ Modify
        </button>
        {/* ❌ Reject → same as old Dismiss */}
        <button className="gm-btn gm-btn-reject"
          onClick={() => handleAction(id, 'dismiss', severity, zone)}>
          ❌ Reject
        </button>
      </div>
    );
  };

  /* NEW: Rendered inside each alert card — confidence + reason + intervention warning */
  const renderAIEnhancements = (id, severity, dynIdx = null) => {
    const meta = id in ALERT_META ? ALERT_META[id] : getDynMeta(severity, dynIdx ?? 0);
    return (
      <>
        {/* Confidence badge */}
        <div style={{ marginTop: 8, marginBottom: 6 }}>
          <ConfidenceBadge value={meta.confidence} />
        </div>
        {/* Intervention warning if confidence < 0.7 */}
        {meta.confidence < 0.7 && (
          <div className="gm-intervention-warn">
            ⚠ Operator Intervention Recommended — AI confidence below threshold
          </div>
        )}
        {/* Explainability reason */}
        <div className="gm-reason-box">
          <strong style={{ color: 'var(--primary)' }}>Explainability:</strong> {meta.reason}
        </div>
      </>
    );
  };

  const dynamicAlerts = alertsData.slice(0, 5);

  return (
    <div className={`al-page ${animIn ? 'al-anim' : ''}`}>
      {/* ── Modify Modal — NEW, shown on top, isolated ── */}
      {modifyTarget && (
        <ModifyModal
          alertId={modifyTarget.id}
          onClose={() => setModifyTarget(null)}
          onConfirm={(params) => {
            // ADDED #6: Log the modify action locally
            addLog(
              'Modify',
              `Alert ${modifyTarget.id} — Battery: ${params.battAdj}%, Load ↓: ${params.loadRed}%${params.note ? ` · Note: ${params.note}` : ''}`,
              'modify'
            );
            addAuditEntry({
              action: `Alert ${modifyTarget.id} — Modified (Battery: ${params.battAdj}%, Load: ${params.loadRed}%)`,
              decision: 'modify',
              zone: modifyTarget.zone
            });
            setAlertsState(prev => ({ ...prev, [modifyTarget.id]: 'executing' }));
            setTimeout(() => {
              setAlertsState(prev => ({ ...prev, [modifyTarget.id]: 'completed_accept' }));
              setCounts(prev => {
                if (modifyTarget.severity === 'CRITICAL') return { ...prev, critical: Math.max(0, prev.critical - 1) };
                return { ...prev, warning: Math.max(0, prev.warning - 1) };
              });
              setAlertCount?.(prev => Math.max(0, (prev ?? 0) - 1));
            }, 1500);
            setModifyTarget(null);
          }}
        />
      )}

      {/* ── Page Header — UNCHANGED ── */}
      <div className="al-header">
        <div className="al-header-left">
          <Bell size={24} color="var(--primary)" />
          <div>
            <h1>AI Alerts &amp; Interventions</h1>
            <p>Overload/Fault Detector · XGBoost · Real-time grid event monitoring</p>
          </div>
        </div>
        {/* NEW: Manual override toggle — admin/operator only */}
        {canAct && (
          <button
            className="gm-btn gm-btn-modify"
            onClick={() => setShowOverride(v => !v)}
            style={{ marginLeft: 'auto' }}
          >
            <Sliders size={15} /> {showOverride ? 'Hide' : 'Manual Override'}
          </button>
        )}
      </div>

      {/* NEW: Manual Override Panel — admin/operator, conditionally shown */}
      {showOverride && canAct && (
        <ManualOverridePanel
          onApply={(params) => {
            addAuditEntry({
              action: `Manual Override applied — Battery: ${params.battLevel}%, Load reduction: ${params.loadRed}%`,
              decision: 'modify',
              zone: 'All Zones'
            });
          }}
        />
      )}

      {/* ── TOP SUMMARY BAR — UNCHANGED ── */}
      <div className="glass-card al-summary-bar">
        <div className="al-summary-stats">
          <div className="al-stat-pill" style={{color: 'var(--danger)', background: 'var(--danger-dim)'}}>
            <strong style={{fontSize: '1.5rem'}}>{counts.critical}</strong> Critical Today
          </div>
          <div className="al-stat-pill" style={{color: 'var(--warning)', background: 'var(--warning-dim)'}}>
            <strong style={{fontSize: '1.5rem'}}>{counts.warning}</strong> Warning Today
          </div>
          <div className="al-stat-pill" style={{color: 'var(--info)', background: 'var(--info-dim)'}}>
            <strong style={{fontSize: '1.5rem'}}>{counts.info}</strong> Info Today
          </div>
        </div>
        <div className="al-summary-chart">
          <ResponsiveContainer width={150} height={60}>
            <BarChart data={[{name: 'Alerts', critical: counts.critical, warning: counts.warning, info: counts.info}]} layout="vertical" barSize={12}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <Bar dataKey="critical" stackId="a" fill="var(--danger)" radius={[4, 0, 0, 4]} />
              <Bar dataKey="warning" stackId="a" fill="var(--warning)" />
              <Bar dataKey="info" stackId="a" fill="var(--info)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ALERT FEED ── */}
      <div className="al-feed">
        
        {/* FIXED #1: Render simulated alerts dynamically at the very top */}
        {simulatedAlerts?.map(alert => {
          return (
            <div key={alert.id} className={getAlertClasses(alert.id, alert.type)}>
              <div className="al-card-header">
                <span className="al-time">Just now</span>
                <span className={`al-zone al-zone-critical`}>{alert.zone}</span>
              </div>
              <div className="al-msg">
                {alert.message}
              </div>
              <div className="al-ai-box">
                <div className="al-ai-title"><Bot size={16} /> 🤖 AI Crisis Response:</div>
                <div>Condition: <span style={{color: 'var(--danger)', fontWeight: 600}}>{alert.type} SIMULATION</span></div>
                <div>Action: <strong style={{color: 'var(--text-base)'}}>{alert.action}</strong></div>
                {/* Embedded explainability */}
                <div style={{ marginTop: 8, marginBottom: 6 }}>
                  <ConfidenceBadge value={alert.confidence} />
                </div>
                <div className="gm-reason-box">
                  <strong style={{ color: 'var(--primary)' }}>Explainability:</strong> {alert.reason}
                </div>
              </div>
              {renderActionBar(alert.id, alert.type, alert.zone)}
            </div>
          );
        })}

        {/* Hardcoded 1: CRITICAL — UNCHANGED structure, NEW enhancements added below ai-box */}
        <div className={getAlertClasses('hc-1', 'CRITICAL')}>
          <div className="al-card-header">
            <span className="al-time">2 mins ago</span>
            <span className="al-zone al-zone-critical">Somathne PHC</span>
          </div>
          <div className="al-msg">
            Pre-monsoon cloud front approaching Raigad in 2 hours. Solar output will drop from 8.4kW to ~3.1kW. Overload Detector activated. Recommend: Activate full battery reserve now.
          </div>
          <div className="al-ai-box">
            <div className="al-ai-title"><Bot size={16} /> 🤖 XGBoost Overload Detector:</div>
            <div>Probability of overload: <span style={{color: 'var(--danger)', fontWeight: 600}}>87.3%</span></div>
            <div>Action: <strong style={{color: 'var(--text-base)'}}>Pre-charge battery to 95%</strong></div>
            <div>Protect: Somathne PHC priority lock</div>
            {/* NEW: confidence + reason + intervention warning */}
            {renderAIEnhancements('hc-1', 'CRITICAL')}
          </div>
          {renderActionBar('hc-1', 'CRITICAL', 'Somathne PHC')}
        </div>

        {/* Hardcoded 2: WARNING */}
        <div className={getAlertClasses('hc-2', 'WARNING')}>
          <div className="al-card-header">
            <span className="al-time">14 mins ago</span>
            <span className="al-zone al-zone-warning">Palaspe</span>
          </div>
          <div className="al-msg">
            Agricultural pumps drawing 340% above scheduled load. Kharif sowing season detected. Fault rate elevated: 2.5%
          </div>
          <div className="al-ai-box">
            <div className="al-ai-title"><Bot size={16} /> 🤖 Grid Stability Classifier:</div>
            <div>Current label: <span style={{color: 'var(--warning)', fontWeight: 600}}>WARNING (score: 58/100)</span></div>
            <div>Action: <strong style={{color: 'var(--text-base)'}}>Extend pump window to 4-6 AM</strong></div>
            <div>Avoid peak conflict with residential</div>
            {renderAIEnhancements('hc-2', 'WARNING')}
          </div>
          {renderActionBar('hc-2', 'WARNING', 'Palaspe')}
        </div>

        {/* Hardcoded 3: WARNING */}
        <div className={getAlertClasses('hc-3', 'WARNING')}>
          <div className="al-card-header">
            <span className="al-time">31 mins ago</span>
            <span className="al-zone al-zone-info">Bhatan</span>
          </div>
          <div className="al-msg">
            Evening peak load approaching. Bhatan residential needs 4.2kW in 45 mins. Battery at 67%.
          </div>
          <div className="al-ai-box">
            <div className="al-ai-title"><Bot size={16} /> 🤖 Load Forecaster:</div>
            <div>Predicted: <span style={{color: 'var(--warning)', fontWeight: 600}}>HIGH demand at 7PM</span></div>
            <div>Confidence: 96.1%</div>
            <div>Action: <strong style={{color: 'var(--text-base)'}}>Begin load tapering in Kalamboli market now</strong></div>
            {renderAIEnhancements('hc-3', 'WARNING')}
          </div>
          {renderActionBar('hc-3', 'WARNING', 'Bhatan')}
        </div>

        {/* Dynamic Alerts — UNCHANGED structure, NEW enhancements added */}
        {dynamicAlerts.map((alert, idx) => {
          const id = `dyn-${idx}`;
          const severity = alert.alert_type;
          const zone = getZone(alert.hour);
          return (
            <div key={id} className={getAlertClasses(id, severity)}>
              <div className="al-card-header">
                <span className="al-time">{Math.max(1, alert.hour)} hr ago</span>
                <span className={`al-zone ${severity === 'CRITICAL' ? 'al-zone-critical' : 'al-zone-warning'}`}>{zone}</span>
              </div>
              <div className="al-msg">
                {alert.alert_message}
              </div>
              <div className="al-ai-box">
                <div className="al-ai-title"><Bot size={16} /> 🤖 Automated ML Response:</div>
                <div>Condition: <span style={{fontWeight: 600, color: severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'}}>{severity}</span></div>
                <div>Action: <strong>{severity === 'CRITICAL' ? 'Isolate sub-station limits' : 'Re-route non-essential load'}</strong></div>
                {renderAIEnhancements(id, severity, idx)}
              </div>
              {renderActionBar(id, severity, zone)}
            </div>
          );
        })}
      </div>

      {/* FIXED #5: Bar graph REMOVED as requested */}

      {/* ADDED #6: Operator Logs Panel — inline, no backend, visible only when logs exist */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14
        }}>
          <h3 style={{
            margin: 0, fontFamily: 'var(--font-head)',
            fontSize: '0.95rem', color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            📋 Operator Action Log
          </h3>
          {operatorLogs.length > 0 && (
            <button
              onClick={() => setOperatorLogs([])}
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 10px',
                fontSize: '0.75rem', color: 'var(--text-muted)',
                cursor: 'pointer', fontFamily: 'var(--font-mono)'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {operatorLogs.length === 0 ? (
          <div style={{
            padding: '20px', textAlign: 'center',
            color: 'var(--text-muted)', fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            border: '1px dashed var(--border)', borderRadius: 8,
          }}>
            No operator actions yet · Agree, Modify, or Reject an alert to create a log entry
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {operatorLogs.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '9px 14px', borderRadius: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                fontSize: '0.82rem', fontFamily: 'var(--font-mono)',
              }}>
                <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: 64 }}>{entry.time}</span>
                <span style={{
                  fontWeight: 700, textTransform: 'uppercase', minWidth: 52,
                  color: entry.decision === 'agree'  ? 'var(--primary)'
                       : entry.decision === 'reject' ? 'var(--danger)'
                       : 'var(--warning)'
                }}>{entry.action}</span>
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{entry.details}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
