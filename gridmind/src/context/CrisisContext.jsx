import { createContext, useState, useEffect, useContext } from 'react';

const CrisisContext = createContext();

export function CrisisProvider({ children }) {
  const [crisisStep, setCrisisStep] = useState(-1);
  const isCrisisActive = crisisStep >= 0;

  /* FIXED: simulate crisis - global simulated alerts state */
  const [simulatedAlerts, setSimulatedAlerts] = useState([]);

  useEffect(() => {
    let id;
    if (isCrisisActive && crisisStep < 2) { // just a short visual flash, no auto-resolve
      id = setTimeout(() => {
        setCrisisStep(c => c + 1);
      }, 1000);
    }
    return () => clearTimeout(id);
  }, [crisisStep, isCrisisActive]);

  const triggerCrisis = () => {
    if (!isCrisisActive) {
      setCrisisStep(0);
      /* FIXED: simulate crisis - Add real alert into state */
      const newAlert = {
        id: `sim-${Date.now()}`,
        type: "CRITICAL",
        message: "Grid instability detected due to solar drop and demand surge",
        action: "Pre-charge battery and reduce non-essential loads",
        confidence: 0.92,
        reason: "Solar output dropped while demand increased",
        simulated: true,
        zone: "All Zones"
      };
      setSimulatedAlerts(prev => [newAlert, ...(prev || [])]);
    }
  };

  return (
    <CrisisContext.Provider value={{ crisisStep, isCrisisActive, triggerCrisis, simulatedAlerts }}>
      {children}
    </CrisisContext.Provider>
  );
}

export const useCrisis = () => useContext(CrisisContext);
