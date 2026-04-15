import pandas as pd
import numpy as np
import json
import os
import warnings
warnings.filterwarnings('ignore')

print('✅ Libraries loaded')

# Output dir for JSON files
OUT_DIR = os.path.join(os.path.dirname(__file__), 'clean_datasets')
os.makedirs(OUT_DIR, exist_ok=True)

def out(filename):
    return os.path.join(OUT_DIR, filename)

# ============================================================
# DATASET 1 — Renewable Energy Dataset
# ============================================================
print('\n--- DATASET 1: Renewable Energy ---')
re = pd.read_csv(os.path.join(OUT_DIR, 'renewable_energy_dataset.csv'))
print(f'Shape: {re.shape}')
print(f'Columns: {list(re.columns)}')

print('\nMissing values:')
print(re.isnull().sum())
print('\nData types:')
print(re.dtypes)

# ── CLEAN ─────────────────────────────────────────────
re['Timestamp'] = pd.to_datetime(re['Timestamp'])
re['hour'] = re['Timestamp'].dt.hour
re['date'] = re['Timestamp'].dt.date

re = re.drop_duplicates()
re = re.ffill()

solar_max = re['Solar_Power_Generated'].max()
re['Solar_kW'] = (re['Solar_Power_Generated'] / solar_max * 10).round(2)
re['Forecasted_Solar_kW'] = (re['Forecasted_Solar'] / solar_max * 10).round(2)

batt_max = re['Battery_Level'].max()
re['Battery_Pct'] = (re['Battery_Level'] / batt_max * 100).round(1)

load_max = re['Load_Demand'].max()
re['Load_kW'] = (re['Load_Demand'] / load_max * 12).round(2)
re['Forecasted_Load_kW'] = (re['Forecasted_Load'] / load_max * 12).round(2)

re['Energy_Cost_INR'] = (re['Energy_Cost'] * 83).round(2)
re['Grid_Frequency_Hz'] = re['Grid_Frequency'].round(3)

print(f'\n✅ Cleaned shape: {re.shape}')
print(re[['hour', 'Solar_kW', 'Forecasted_Solar_kW', 'Battery_Pct', 'Load_kW', 'Grid_Frequency_Hz']].head(5))

# ── EXPORT 1: Hourly Solar Profile ──
solar_hourly = re.groupby('hour').agg(
    avg_solar_kw=('Solar_kW', 'mean'),
    avg_forecast_kw=('Forecasted_Solar_kW', 'mean'),
    avg_irradiance=('Solar_Irradiance', 'mean'),
    avg_temp=('Temperature', 'mean'),
    avg_humidity=('Humidity', 'mean'),
    avg_rainfall=('Rainfall', 'mean')
).round(2).reset_index()

solar_hourly['time_label'] = solar_hourly['hour'].apply(
    lambda h: f"{h%12 or 12}{'AM' if h<12 else 'PM'}"
)

def weather_condition(row):
    if row['avg_rainfall'] > 0.5:
        return 'Rainy'
    elif row['avg_humidity'] > 70:
        return 'Cloudy'
    elif row['avg_humidity'] > 50:
        return 'Partly Cloudy'
    else:
        return 'Clear'

solar_hourly['weather'] = solar_hourly.apply(weather_condition, axis=1)

def ai_action(row):
    if row['avg_solar_kw'] > 6:
        return 'STORE EXCESS'
    elif row['avg_solar_kw'] > 3:
        return 'BALANCED'
    else:
        return 'REDUCE LOAD'

solar_hourly['ai_action'] = solar_hourly.apply(ai_action, axis=1)

solar_hourly.to_json(out('solar_hourly_profile.json'), orient='records', indent=2)
print('✅ Saved: solar_hourly_profile.json')
print(solar_hourly)

# ── EXPORT 2: Battery Profile ──
battery_hourly = re.groupby('hour').agg(
    avg_battery_pct=('Battery_Pct', 'mean'),
    avg_input_output=('Battery_Input_Output', 'mean'),
).round(2).reset_index()

battery_hourly['status'] = battery_hourly['avg_input_output'].apply(
    lambda x: 'Charging' if x > 0 else 'Discharging'
)

battery_hourly.to_json(out('battery_hourly_profile.json'), orient='records', indent=2)
print('✅ Saved: battery_hourly_profile.json')
print(battery_hourly)

# ── EXPORT 3: Load Demand Profile ──
load_hourly = re.groupby('hour').agg(
    avg_load_kw=('Load_kW', 'mean'),
    avg_forecast_kw=('Forecasted_Load_kW', 'mean'),
    avg_cost_inr=('Energy_Cost_INR', 'mean')
).round(2).reset_index()

load_hourly['bhatan_kw']    = (load_hourly['avg_load_kw'] * 0.35).round(2)
load_hourly['palaspe_kw']   = (load_hourly['avg_load_kw'] * 0.25).round(2)
load_hourly['somathne_kw']  = (load_hourly['avg_load_kw'] * 0.20).round(2)
load_hourly['kalamboli_kw'] = (load_hourly['avg_load_kw'] * 0.20).round(2)

load_hourly.to_json(out('load_hourly_profile.json'), orient='records', indent=2)
print('✅ Saved: load_hourly_profile.json')
print(load_hourly)

# ============================================================
# DATASET 2 — Smart Grid Dataset
# ============================================================
print('\n--- DATASET 2: Smart Grid ---')
sg = pd.read_csv(os.path.join(OUT_DIR, 'smart_grid_dataset.csv'))
print(f'Shape: {sg.shape}')
print(f'Columns: {list(sg.columns)}')

print('\nMissing values:')
print(sg.isnull().sum())
print('Overload events:', sg['Overload Condition'].sum())
print('Transformer faults:', sg['Transformer Fault'].sum())
print('Voltage range:', sg['Voltage (V)'].min(), '-', sg['Voltage (V)'].max(), 'V')
print('Power Factor range:', sg['Power Factor'].min(), '-', sg['Power Factor'].max())

# ── CLEAN ─────────────────────────────────────────────
sg['Timestamp'] = pd.to_datetime(sg['Timestamp'])
sg['hour'] = sg['Timestamp'].dt.hour
sg['minute'] = sg['Timestamp'].dt.minute

sg = sg.drop_duplicates()
sg = sg.ffill()

sg['Voltage_Deviation_Pct'] = ((sg['Voltage (V)'] - 230) / 230 * 100).round(2)

sg['Stability_Score'] = (
    (sg['Power Factor'] * 40) +
    (np.clip(10 - abs(sg['Voltage Fluctuation (%)']), 0, 10) * 3) +
    ((1 - sg['Overload Condition']) * 15) +
    ((1 - sg['Transformer Fault']) * 15)
).clip(0, 100).round(1)

def stability_label(score):
    if score >= 70: return 'STABLE'
    elif score >= 40: return 'WARNING'
    else: return 'CRITICAL'

sg['Stability_Label'] = sg['Stability_Score'].apply(stability_label)

print(f'\n✅ Cleaned shape: {sg.shape}')
print('Stability distribution:')
print(sg['Stability_Label'].value_counts())
print(sg[['hour', 'Voltage (V)', 'Power Factor', 'Stability_Score', 'Stability_Label']].head(5))

# ── EXPORT 4: Hourly Grid Stability ──
stability_hourly = sg.groupby('hour').agg(
    avg_stability=('Stability_Score', 'mean'),
    avg_voltage=('Voltage (V)', 'mean'),
    avg_power_factor=('Power Factor', 'mean'),
    avg_voltage_fluctuation=('Voltage Fluctuation (%)', lambda x: abs(x).mean()),
    overload_rate=('Overload Condition', 'mean'),
    fault_rate=('Transformer Fault', 'mean'),
    avg_solar_kw=('Solar Power (kW)', 'mean'),
    avg_predicted_load=('Predicted Load (kW)', 'mean')
).round(3).reset_index()

stability_hourly['stability_label'] = stability_hourly['avg_stability'].apply(stability_label)

stability_hourly.to_json(out('grid_stability_hourly.json'), orient='records', indent=2)
print('✅ Saved: grid_stability_hourly.json')
print(stability_hourly)

# ── EXPORT 5: Alert Events ──
alerts_raw = sg[
    (sg['Overload Condition'] == 1) |
    (sg['Transformer Fault'] == 1) |
    (sg['Stability_Score'] < 40)
].copy()

alerts_sample = alerts_raw.sample(min(50, len(alerts_raw)), random_state=42)

def alert_type(row):
    if row['Transformer Fault'] == 1:
        return 'CRITICAL'
    else:
        return 'WARNING'

def alert_message(row):
    if row['Transformer Fault'] == 1:
        return f"Transformer fault detected. Voltage: {row['Voltage (V)']:.1f}V. Switching to battery backup."
    elif row['Overload Condition'] == 1:
        return f"Overload in grid. Load: {row['Power Consumption (kW)']:.1f}kW. AI initiating load shedding."
    else:
        return f"Grid stability dropped to {row['Stability_Score']:.0f}. Voltage fluctuation: {row['Voltage Fluctuation (%)']:.1f}%."

alerts_sample['alert_type'] = alerts_sample.apply(alert_type, axis=1)
alerts_sample['alert_message'] = alerts_sample.apply(alert_message, axis=1)

alerts_export = alerts_sample[[
    'hour', 'Voltage (V)', 'Stability_Score',
    'Overload Condition', 'Transformer Fault',
    'alert_type', 'alert_message'
]].rename(columns={
    'Voltage (V)': 'voltage',
    'Stability_Score': 'stability_score',
    'Overload Condition': 'overload',
    'Transformer Fault': 'fault'
})

alerts_export.to_json(out('grid_alerts.json'), orient='records', indent=2)
print(f'✅ Saved: grid_alerts.json ({len(alerts_export)} alert events)')

# ── EXPORT 6: Master Summary JSON ──
solar_data     = json.load(open(out('solar_hourly_profile.json')))
battery_data   = json.load(open(out('battery_hourly_profile.json')))
load_data      = json.load(open(out('load_hourly_profile.json')))
stability_data = json.load(open(out('grid_stability_hourly.json')))
alerts_data    = json.load(open(out('grid_alerts.json')))

master = {
    'meta': {
        'project': 'GRIDMIND AI',
        'location': 'Raigad District, Maharashtra, India',
        'villages': ['Bhatan', 'Somathne', 'Palaspe', 'Kalamboli'],
        'total_residents': 2400,
        'system_capacity_kw': 10,
        'battery_capacity_kwh': 20,
        'data_source': 'Kaggle - Renewable Energy & Smart Grid Datasets',
        'generated_at': pd.Timestamp.now().isoformat()
    },
    'solar_hourly': solar_data,
    'battery_hourly': battery_data,
    'load_hourly': load_data,
    'grid_stability_hourly': stability_data,
    'alert_events': alerts_data[:20],
    'summary_stats': {
        'peak_solar_kw': round(re['Solar_kW'].max(), 2),
        'avg_solar_kw': round(re['Solar_kW'].mean(), 2),
        'avg_battery_pct': round(re['Battery_Pct'].mean(), 1),
        'avg_load_kw': round(re['Load_kW'].mean(), 2),
        'avg_grid_frequency': round(re['Grid_Frequency_Hz'].mean(), 3),
        'avg_stability_score': round(sg['Stability_Score'].mean(), 1),
        'total_overload_events': int(sg['Overload Condition'].sum()),
        'total_fault_events': int(sg['Transformer Fault'].sum()),
        'avg_voltage': round(sg['Voltage (V)'].mean(), 1),
        'avg_power_factor': round(sg['Power Factor'].mean(), 3)
    }
}

with open(out('gridmind_data.json'), 'w') as f:
    json.dump(master, f, indent=2)

print('✅ Saved: gridmind_data.json (MASTER FILE)')
print('\n📊 Summary Stats:')
for k, v in master['summary_stats'].items():
    print(f'  {k}: {v}')

# ── FINAL CHECKLIST ──
files = [
    'solar_hourly_profile.json',
    'battery_hourly_profile.json',
    'load_hourly_profile.json',
    'grid_stability_hourly.json',
    'grid_alerts.json',
    'gridmind_data.json'
]
print('\n📁 Output files:')
for fname in files:
    path = out(fname)
    size = os.path.getsize(path) / 1024
    print(f'  ✅ {fname} ({size:.1f} KB)')

print('\n🚀 Next step: Copy gridmind_data.json into your React app')
print('   Import it as: import gridData from "./gridmind_data.json"')
print('   Then replace hardcoded values with gridData.solar_hourly etc.')
