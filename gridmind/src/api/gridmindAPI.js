const BASE = 'http://localhost:8000/api'

export const fetchDashboard = () => 
  fetch(`${BASE}/dashboard`).then(r => r.json())

export const fetchStability = () =>
  fetch(`${BASE}/predict/stability`).then(r => r.json())

export const fetchSolarForecast = () =>
  fetch(`${BASE}/solar/forecast`).then(r => r.json())

export const fetchLoadPrediction = (hour) =>
  fetch(`${BASE}/predict/load/${hour}`).then(r => r.json())

export const fetchAlerts = () =>
  fetch(`${BASE}/alerts`).then(r => r.json())
