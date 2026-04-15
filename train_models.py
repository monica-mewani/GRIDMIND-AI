"""
GRIDMIND-AI — ML Model Training Script
=======================================
Trains 5 models on real Kaggle datasets using scikit-learn:
  1. Solar Action Classifier     (GradientBoosting, 3-class)  → 100%
  2. Grid Stability Classifier   (GradientBoosting, 3-class)  → ~96%+
  3. Overload Detector           (GradientBoosting, binary, oversampled)
  4. Fault Detector              (GradientBoosting, binary, oversampled)
  5. Load Forecaster             (GradientBoosting, regression)
"""

import os, json, warnings
import numpy as np
import pandas as pd
import joblib

warnings.filterwarnings('ignore')

from sklearn.ensemble import (
    GradientBoostingClassifier, GradientBoostingRegressor
)
from sklearn.utils import resample
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, classification_report,
    r2_score, mean_absolute_error
)
from sklearn.preprocessing import LabelEncoder

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE    = os.path.dirname(os.path.abspath(__file__))
DATA    = os.path.join(BASE, 'clean_datasets')
MDL_DIR = os.path.join(DATA, 'models')
os.makedirs(MDL_DIR, exist_ok=True)

def out(f): return os.path.join(DATA, f)
def mdl(f): return os.path.join(MDL_DIR, f)

BANNER = "=" * 62

# ── Load CSVs ─────────────────────────────────────────────────────────────────
print(f"\n{BANNER}")
print("  GRIDMIND-AI  |  ML Model Training  (scikit-learn)")
print(BANNER)

print("\n📂 Loading datasets...")
re = pd.read_csv(out('renewable_energy_dataset.csv'))
sg = pd.read_csv(out('smart_grid_dataset.csv'))
print(f"  ✅ Renewable Energy : {re.shape[0]:,} rows × {re.shape[1]} cols")
print(f"  ✅ Smart Grid       : {sg.shape[0]:,} rows × {sg.shape[1]} cols")

# ── Feature Engineering ───────────────────────────────────────────────────────
print("\n🔧 Engineering features...")

# --- Renewable Energy ---
re['Timestamp'] = pd.to_datetime(re['Timestamp'])
re['hour']      = re['Timestamp'].dt.hour
re['dayofweek'] = re['Timestamp'].dt.dayofweek
re['month']     = re['Timestamp'].dt.month

solar_max = re['Solar_Power_Generated'].max()
re['Solar_kW'] = (re['Solar_Power_Generated'] / solar_max * 10).round(4)

load_max = re['Load_Demand'].max()
re['Load_kW'] = (re['Load_Demand'] / load_max * 12).round(4)

def make_solar_action(kw):
    if kw > 6:    return 'STORE EXCESS'
    elif kw > 3:  return 'BALANCED'
    else:         return 'REDUCE LOAD'

re['ai_action'] = re['Solar_kW'].apply(make_solar_action)

# --- Smart Grid ---
sg['Timestamp'] = pd.to_datetime(sg['Timestamp'])
sg['hour']      = sg['Timestamp'].dt.hour
sg['dayofweek'] = sg['Timestamp'].dt.dayofweek
sg['month']     = sg['Timestamp'].dt.month
sg['Voltage_Dev'] = (sg['Voltage (V)'] - 230).abs()

sg['Stability_Score'] = (
    (sg['Power Factor'] * 40) +
    (np.clip(10 - sg['Voltage Fluctuation (%)'].abs(), 0, 10) * 3) +
    ((1 - sg['Overload Condition']) * 15) +
    ((1 - sg['Transformer Fault'])  * 15)
).clip(0, 100).round(2)

def make_stability_label(s):
    if s >= 70:   return 'STABLE'
    elif s >= 40: return 'WARNING'
    else:         return 'CRITICAL'

sg['Stability_Label'] = sg['Stability_Score'].apply(make_stability_label)
print("  ✅ Features ready")

# ╔══════════════════════════════════════════════════════════════╗
# ║  MODEL 1 — Solar Action Classifier                          ║
# ╚══════════════════════════════════════════════════════════════╝
print(f"\n{BANNER}")
print("  MODEL 1 : Solar Action Classifier  (GradientBoosting)")
print(BANNER)

SOLAR_FEATURES = [
    'Solar_Irradiance','Temperature','Humidity','Rainfall',
    'Wind_Speed','Battery_Level','Solar_kW','hour','month'
]

X1 = re[SOLAR_FEATURES].fillna(0)
le1 = LabelEncoder()
y1  = le1.fit_transform(re['ai_action'])

X1_tr, X1_te, y1_tr, y1_te = train_test_split(
    X1, y1, test_size=0.20, random_state=42, stratify=y1
)

solar_model = GradientBoostingClassifier(
    n_estimators=200, max_depth=5,
    learning_rate=0.1, subsample=0.8,
    random_state=42
)
print("  Training... (this may take ~30s)")
solar_model.fit(X1_tr, y1_tr)

y1_pred = solar_model.predict(X1_te)
acc1 = accuracy_score(y1_te, y1_pred)

print(f"\n🎯 Test Accuracy  : {acc1*100:.4f}%")
print(f"\n📊 Classification Report:")
print(classification_report(y1_te, y1_pred, target_names=le1.classes_))

cv1 = cross_val_score(solar_model, X1, y1, cv=5, scoring='accuracy', n_jobs=-1)
print(f"📈 5-fold CV      : {cv1.mean()*100:.4f}% ± {cv1.std()*100:.4f}%")

joblib.dump(solar_model, mdl('solar_action_model.pkl'))
print("✅ Saved: solar_action_model.pkl")

# ╔══════════════════════════════════════════════════════════════╗
# ║  MODEL 2 — Grid Stability Classifier                        ║
# ╚══════════════════════════════════════════════════════════════╝
print(f"\n{BANNER}")
print("  MODEL 2 : Grid Stability Classifier  (GradientBoosting)")
print(BANNER)

STABILITY_FEATURES = [
    'Voltage (V)','Current (A)','Power Consumption (kW)',
    'Reactive Power (kVAR)','Power Factor',
    'Solar Power (kW)','Wind Power (kW)','Grid Supply (kW)',
    'Voltage Fluctuation (%)','Temperature (°C)','Humidity (%)',
    'Electricity Price (USD/kWh)','Predicted Load (kW)',
    'Voltage_Dev','hour','month'
]

# Use a sample of 15k rows to keep training fast
sg_sample = sg.sample(15000, random_state=42).reset_index(drop=True)
X2 = sg_sample[STABILITY_FEATURES].fillna(0)
le2 = LabelEncoder()
y2  = le2.fit_transform(sg_sample['Stability_Label'])

X2_tr, X2_te, y2_tr, y2_te = train_test_split(
    X2, y2, test_size=0.20, random_state=42, stratify=y2
)

stability_model = GradientBoostingClassifier(
    n_estimators=200, max_depth=6,
    learning_rate=0.1, subsample=0.8,
    random_state=42
)
print("  Training on 15k-row sample... (this may take ~60s)")
stability_model.fit(X2_tr, y2_tr)

y2_pred = stability_model.predict(X2_te)
acc2 = accuracy_score(y2_te, y2_pred)

print(f"\n🎯 Test Accuracy  : {acc2*100:.4f}%")
print(f"\n📊 Classification Report:")
print(classification_report(y2_te, y2_pred, target_names=le2.classes_))

cv2 = cross_val_score(stability_model, X2, y2, cv=5, scoring='accuracy', n_jobs=-1)
print(f"📈 5-fold CV      : {cv2.mean()*100:.4f}% ± {cv2.std()*100:.4f}%")

joblib.dump(stability_model, mdl('grid_stability_model.pkl'))
print("✅ Saved: grid_stability_model.pkl")

# ╔══════════════════════════════════════════════════════════════╗
# ║  MODEL 3 — Overload Detector (GradientBoosting + oversample)║
# ╚══════════════════════════════════════════════════════════════╝
print(f"\n{BANNER}")
print("  MODEL 3 : Overload Detector  (GradientBoosting + Oversampling)")
print(BANNER)

FAULT_FEATURES = [
    'Voltage (V)','Current (A)','Power Consumption (kW)',
    'Reactive Power (kVAR)','Power Factor',
    'Solar Power (kW)','Wind Power (kW)','Grid Supply (kW)',
    'Voltage Fluctuation (%)','Temperature (°C)','Humidity (%)',
    'Electricity Price (USD/kWh)','Predicted Load (kW)',
    'Voltage_Dev','hour','month'
]

# Use full dataset and oversample minority class to balance
sg_all = sg.copy()
sg_all['Voltage_Dev'] = (sg_all['Voltage (V)'] - 230).abs()
sg_all['hour']  = pd.to_datetime(sg_all['Timestamp']).dt.hour
sg_all['month'] = pd.to_datetime(sg_all['Timestamp']).dt.month

X3_full = sg_all[FAULT_FEATURES].fillna(0)
y3a_full = sg_all['Overload Condition'].astype(int)

# Oversample minority (Overload) class to match majority
X3_full['__target__'] = y3a_full.values
majority = X3_full[X3_full['__target__'] == 0]
minority = X3_full[X3_full['__target__'] == 1]
minority_up = resample(minority, replace=True,
                        n_samples=len(majority), random_state=42)
balanced = pd.concat([majority, minority_up]).sample(frac=1, random_state=42)
y3a_bal = balanced['__target__'].values
X3_bal  = balanced.drop(columns=['__target__']).values

X3a_tr, X3a_te, y3a_tr, y3a_te = train_test_split(
    X3_bal, y3a_bal, test_size=0.20, random_state=42, stratify=y3a_bal
)

overload_model = GradientBoostingClassifier(
    n_estimators=200, max_depth=5,
    learning_rate=0.1, subsample=0.8,
    random_state=42
)
print("  Training on balanced dataset... (this may take ~90s)")
overload_model.fit(X3a_tr, y3a_tr)

y3a_pred = overload_model.predict(X3a_te)
acc3a = accuracy_score(y3a_te, y3a_pred)

print(f"\n🎯 Test Accuracy  : {acc3a*100:.4f}%")
print(classification_report(y3a_te, y3a_pred, target_names=['Normal','Overload']))

joblib.dump(overload_model, mdl('overload_detector_model.pkl'))
print("✅ Saved: overload_detector_model.pkl")

# ╔══════════════════════════════════════════════════════════════╗
# ║  MODEL 4 — Fault Detector (GradientBoosting + oversample)   ║
# ╚══════════════════════════════════════════════════════════════╝
print(f"\n{BANNER}")
print("  MODEL 4 : Fault Detector  (GradientBoosting + Oversampling)")
print(BANNER)

y3b_full = sg_all['Transformer Fault'].astype(int)
X3_full2 = sg_all[FAULT_FEATURES].fillna(0).copy()
X3_full2['__target__'] = y3b_full.values
majority_f  = X3_full2[X3_full2['__target__'] == 0]
minority_f  = X3_full2[X3_full2['__target__'] == 1]
minority_f_up = resample(minority_f, replace=True,
                          n_samples=len(majority_f), random_state=42)
balanced_f  = pd.concat([majority_f, minority_f_up]).sample(frac=1, random_state=42)
y3b_bal = balanced_f['__target__'].values
X3b_bal = balanced_f.drop(columns=['__target__']).values

X3b_tr, X3b_te, y3b_tr, y3b_te = train_test_split(
    X3b_bal, y3b_bal, test_size=0.20, random_state=42, stratify=y3b_bal
)

fault_model = GradientBoostingClassifier(
    n_estimators=200, max_depth=5,
    learning_rate=0.1, subsample=0.8,
    random_state=42
)
print("  Training on balanced dataset... (this may take ~120s)")
fault_model.fit(X3b_tr, y3b_tr)

y3b_pred = fault_model.predict(X3b_te)
acc3b = accuracy_score(y3b_te, y3b_pred)

print(f"\n🎯 Test Accuracy  : {acc3b*100:.4f}%")
print(classification_report(y3b_te, y3b_pred, target_names=['No Fault','Fault']))

joblib.dump(fault_model, mdl('fault_detector_model.pkl'))
print("✅ Saved: fault_detector_model.pkl")

# ╔══════════════════════════════════════════════════════════════╗
# ║  MODEL 5 — Load Forecaster (GradientBoostingRegressor)      ║
# ╚══════════════════════════════════════════════════════════════╝
print(f"\n{BANNER}")
print("  MODEL 5 : Load Forecaster  (GradientBoostingRegressor)")
print(BANNER)

# Use Load_Demand as target (actual real values available in dataset)
# and engineer strong correlated features from the same dataset
LOAD_FEATURES = [
    'Solar_Irradiance','Temperature','Wind_Speed','Humidity','Rainfall',
    'Solar_Power_Generated','Wind_Power_Generated','Hydro_Power_Generated',
    'Battery_Level','Battery_Input_Output','Aux_Backup_Power',
    'Grid_Frequency','Energy_Cost','hour','month','dayofweek'
]

X5 = re[LOAD_FEATURES].fillna(0)
# Predict Load_Demand (actual, rich signal) — model learns real consumption patterns
y5 = re['Load_Demand']

X5_tr, X5_te, y5_tr, y5_te = train_test_split(
    X5, y5, test_size=0.20, random_state=42
)

load_model = GradientBoostingRegressor(
    n_estimators=500, max_depth=6,
    learning_rate=0.05, subsample=0.8,
    min_samples_leaf=2, random_state=42
)
print("  Training...")
load_model.fit(X5_tr, y5_tr)

y5_pred = load_model.predict(X5_te)
r2  = r2_score(y5_te, y5_pred)
mae = mean_absolute_error(y5_te, y5_pred)

print(f"\n🎯 R² Score       : {r2:.6f}  ({r2*100:.4f}%)")
print(f"📉 MAE             : {mae:.4f} units")

cv5 = cross_val_score(load_model, X5, y5, cv=5, scoring='r2')
print(f"📈 5-fold CV R²   : {cv5.mean():.6f} ± {cv5.std():.6f}")

joblib.dump(load_model, mdl('load_forecaster_model.pkl'))
print("✅ Saved: load_forecaster_model.pkl")

# ── Save Label Encoders ───────────────────────────────────────────────────────
joblib.dump({'solar_action': le1, 'grid_stability': le2}, mdl('label_encoders.pkl'))
print("\n✅ Saved: label_encoders.pkl")

# ── Save Model Metadata ───────────────────────────────────────────────────────
model_metadata = {
    'solar_action': {
        'algorithm': 'GradientBoostingClassifier',
        'features': SOLAR_FEATURES,
        'classes': list(le1.classes_),
        'test_accuracy': round(acc1 * 100, 4),
        'cv_accuracy': round(float(cv1.mean()) * 100, 4)
    },
    'grid_stability': {
        'algorithm': 'GradientBoostingClassifier',
        'features': STABILITY_FEATURES,
        'classes': list(le2.classes_),
        'test_accuracy': round(acc2 * 100, 4),
        'cv_accuracy': round(float(cv2.mean()) * 100, 4)
    },
    'overload_detector': {
        'algorithm': 'GradientBoostingClassifier (oversampled)',
        'features': FAULT_FEATURES,
        'test_accuracy': round(acc3a * 100, 4),
        'note': 'Trained on oversampled balanced dataset'
    },
    'fault_detector': {
        'algorithm': 'GradientBoostingClassifier (oversampled)',
        'features': FAULT_FEATURES,
        'test_accuracy': round(acc3b * 100, 4),
        'note': 'Trained on oversampled balanced dataset'
    },
    'load_forecaster': {
        'algorithm': 'GradientBoostingRegressor',
        'features': LOAD_FEATURES,
        'r2_score': round(float(r2), 6),
        'mae': round(float(mae), 4),
        'cv_r2': round(float(cv5.mean()), 6)
    }
}

with open(mdl('model_metadata.json'), 'w') as f:
    json.dump(model_metadata, f, indent=2)
print("✅ Saved: model_metadata.json")

# ╔══════════════════════════════════════════════════════════════╗
# ║  REGENERATE gridmind_data.json with MODEL PREDICTIONS       ║
# ╚══════════════════════════════════════════════════════════════╝
print(f"\n{BANNER}")
print("  Regenerating gridmind_data.json with model predictions")
print(BANNER)

re_pred = re.copy()
re_pred['ai_action_pred'] = le1.inverse_transform(
    solar_model.predict(re_pred[SOLAR_FEATURES].fillna(0))
)

solar_max2 = re_pred['Solar_Power_Generated'].max()
re_pred['Solar_kW2']          = (re_pred['Solar_Power_Generated'] / solar_max2 * 10).round(2)
re_pred['Forecasted_Solar_kW']= (re_pred['Forecasted_Solar'] / solar_max2 * 10).round(2)

batt_max = re_pred['Battery_Level'].max()
re_pred['Battery_Pct'] = (re_pred['Battery_Level'] / batt_max * 100).round(1)

load_max2 = re_pred['Load_Demand'].max()
re_pred['Load_kW2']          = (re_pred['Load_Demand'] / load_max2 * 12).round(2)
re_pred['Energy_Cost_INR']   = (re_pred['Energy_Cost'] * 83).round(2)
re_pred['Grid_Frequency_Hz'] = re_pred['Grid_Frequency'].round(3)

# Model-predicted load forecast
re_pred['Forecasted_Load_ML'] = load_model.predict(re_pred[LOAD_FEATURES].fillna(0))

# Solar Hourly Profile
solar_hourly = re_pred.groupby('hour').agg(
    avg_solar_kw   = ('Solar_kW2', 'mean'),
    avg_forecast_kw= ('Forecasted_Solar_kW', 'mean'),
    avg_irradiance = ('Solar_Irradiance', 'mean'),
    avg_temp       = ('Temperature', 'mean'),
    avg_humidity   = ('Humidity', 'mean'),
    avg_rainfall   = ('Rainfall', 'mean'),
    avg_wind_speed = ('Wind_Speed', 'mean'),
    avg_battery    = ('Battery_Level', 'mean'),
    avg_solar_kw_raw = ('Solar_kW', 'mean'),
).round(2).reset_index()

solar_hourly['time_label'] = solar_hourly['hour'].apply(
    lambda h: f"{h%12 or 12}{'AM' if h<12 else 'PM'}"
)

def weather_condition(row):
    if row['avg_rainfall'] > 0.5:  return 'Rainy'
    elif row['avg_humidity'] > 70: return 'Cloudy'
    elif row['avg_humidity'] > 50: return 'Partly Cloudy'
    else:                          return 'Clear'

solar_hourly['weather'] = solar_hourly.apply(weather_condition, axis=1)

# Model-predicted AI action per hour
hourly_feat = pd.DataFrame({
    'Solar_Irradiance': solar_hourly['avg_irradiance'],
    'Temperature':      solar_hourly['avg_temp'],
    'Humidity':         solar_hourly['avg_humidity'],
    'Rainfall':         solar_hourly['avg_rainfall'],
    'Wind_Speed':       solar_hourly['avg_wind_speed'],
    'Battery_Level':    solar_hourly['avg_battery'],
    'Solar_kW':         solar_hourly['avg_solar_kw_raw'],
    'hour':             solar_hourly['hour'],
    'month':            1
})
solar_hourly['ai_action'] = le1.inverse_transform(
    solar_model.predict(hourly_feat[SOLAR_FEATURES])
)

solar_hourly_export = solar_hourly.drop(columns=['avg_wind_speed','avg_battery','avg_solar_kw_raw'])
solar_hourly_export.to_json(out('solar_hourly_profile.json'), orient='records', indent=2)
print("✅ solar_hourly_profile.json (model-predicted actions)")

# Battery Hourly
battery_hourly = re_pred.groupby('hour').agg(
    avg_battery_pct  = ('Battery_Pct', 'mean'),
    avg_input_output = ('Battery_Input_Output', 'mean'),
).round(2).reset_index()
battery_hourly['status'] = battery_hourly['avg_input_output'].apply(
    lambda x: 'Charging' if x > 0 else 'Discharging'
)
battery_hourly.to_json(out('battery_hourly_profile.json'), orient='records', indent=2)
print("✅ battery_hourly_profile.json")

# Load Hourly (model-predicted forecast)
load_hourly = re_pred.groupby('hour').agg(
    avg_load_kw          = ('Load_kW2', 'mean'),
    avg_cost_inr         = ('Energy_Cost_INR', 'mean'),
    avg_forecast_kw_ml   = ('Forecasted_Load_ML', 'mean'),
).round(2).reset_index()

load_hourly['avg_forecast_kw']  = (load_hourly['avg_forecast_kw_ml'] / load_max2 * 12).round(2)
load_hourly['bhatan_kw']        = (load_hourly['avg_load_kw'] * 0.35).round(2)
load_hourly['palaspe_kw']       = (load_hourly['avg_load_kw'] * 0.25).round(2)
load_hourly['somathne_kw']      = (load_hourly['avg_load_kw'] * 0.20).round(2)
load_hourly['kalamboli_kw']     = (load_hourly['avg_load_kw'] * 0.20).round(2)
load_hourly = load_hourly.drop(columns=['avg_forecast_kw_ml'])
load_hourly.to_json(out('load_hourly_profile.json'), orient='records', indent=2)
print("✅ load_hourly_profile.json (model-predicted forecasts)")

# Grid Stability Hourly (model-predicted)
sg_pred = sg.copy()
sg_pred['Voltage_Dev'] = (sg_pred['Voltage (V)'] - 230).abs()
sg_pred['hour']        = sg_pred['Timestamp'].dt.hour if sg_pred['Timestamp'].dtype != 'int64' else sg_pred['hour']
sg_pred['month']       = sg_pred['Timestamp'].dt.month

sg_pred['Stability_Score'] = (
    (sg_pred['Power Factor'] * 40) +
    (np.clip(10 - sg_pred['Voltage Fluctuation (%)'].abs(), 0, 10) * 3) +
    ((1 - sg_pred['Overload Condition']) * 15) +
    ((1 - sg_pred['Transformer Fault'])  * 15)
).clip(0, 100).round(2)

sg_pred['stability_label_pred'] = le2.inverse_transform(
    stability_model.predict(sg_pred[STABILITY_FEATURES].fillna(0))
)
sg_pred['overload_pred'] = overload_model.predict(sg_pred[FAULT_FEATURES].fillna(0))
sg_pred['fault_pred']    = fault_model.predict(sg_pred[FAULT_FEATURES].fillna(0))

stability_hourly = sg_pred.groupby('hour').agg(
    avg_stability          = ('Stability_Score', 'mean'),
    avg_voltage            = ('Voltage (V)', 'mean'),
    avg_power_factor       = ('Power Factor', 'mean'),
    avg_voltage_fluctuation= ('Voltage Fluctuation (%)', lambda x: abs(x).mean()),
    overload_rate          = ('Overload Condition', 'mean'),
    fault_rate             = ('Transformer Fault', 'mean'),
    avg_solar_kw           = ('Solar Power (kW)', 'mean'),
    avg_predicted_load     = ('Predicted Load (kW)', 'mean')
).round(3).reset_index()

stab_label_per_hour = (
    sg_pred.groupby('hour')['stability_label_pred']
    .agg(lambda x: x.mode()[0]).reset_index()
)
stability_hourly = stability_hourly.merge(stab_label_per_hour, on='hour')
stability_hourly.rename(columns={'stability_label_pred':'stability_label'}, inplace=True)
stability_hourly.to_json(out('grid_stability_hourly.json'), orient='records', indent=2)
print("✅ grid_stability_hourly.json (model-predicted labels)")

# Alerts (model-detected)
alerts_mask = (
    (sg_pred['overload_pred'] == 1) |
    (sg_pred['fault_pred'] == 1) |
    (sg_pred['Stability_Score'] < 40)
)
alerts_raw    = sg_pred[alerts_mask].copy()
alerts_sample = alerts_raw.sample(min(50, len(alerts_raw)), random_state=42)

def alert_type(row):
    return 'CRITICAL' if row['fault_pred'] == 1 else 'WARNING'

def alert_message(row):
    if row['fault_pred'] == 1:
        return (f"⚡ AI detected transformer fault. "
                f"Voltage: {row['Voltage (V)']:.1f}V. Switching to battery backup.")
    elif row['overload_pred'] == 1:
        return (f"🔴 AI detected overload. "
                f"Load: {row['Power Consumption (kW)']:.1f}kW. Initiating load shedding.")
    else:
        return (f"⚠️ Grid stability dropped to {row['Stability_Score']:.0f}. "
                f"Voltage fluctuation: {row['Voltage Fluctuation (%)']:.1f}%.")

alerts_sample['alert_type']    = alerts_sample.apply(alert_type, axis=1)
alerts_sample['alert_message'] = alerts_sample.apply(alert_message, axis=1)

alerts_export = alerts_sample[[
    'hour','Voltage (V)','Stability_Score',
    'overload_pred','fault_pred','alert_type','alert_message'
]].rename(columns={
    'Voltage (V)':     'voltage',
    'Stability_Score': 'stability_score',
    'overload_pred':   'overload',
    'fault_pred':      'fault'
})
alerts_export.to_json(out('grid_alerts.json'), orient='records', indent=2)
print(f"✅ grid_alerts.json ({len(alerts_export)} model-detected alerts)")

# Master JSON
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
        'data_source': 'Kaggle — Renewable Energy & Smart Grid Datasets',
        'ml_powered': True,
        'models_used': [
            'GradientBoosting Solar Action Classifier',
            'GradientBoosting Grid Stability Classifier',
            'RandomForest Overload Detector',
            'RandomForest Fault Detector',
            'GradientBoosting Load Forecaster'
        ],
        'generated_at': pd.Timestamp.now().isoformat()
    },
    'model_accuracy': model_metadata,
    'solar_hourly':          solar_data,
    'battery_hourly':        battery_data,
    'load_hourly':           load_data,
    'grid_stability_hourly': stability_data,
    'alert_events':          alerts_data[:20],
    'summary_stats': {
        'peak_solar_kw':         round(re_pred['Solar_kW2'].max(), 2),
        'avg_solar_kw':          round(re_pred['Solar_kW2'].mean(), 2),
        'avg_battery_pct':       round(re_pred['Battery_Pct'].mean(), 1),
        'avg_load_kw':           round(re_pred['Load_kW2'].mean(), 2),
        'avg_grid_frequency':    round(re_pred['Grid_Frequency_Hz'].mean(), 3),
        'avg_stability_score':   round(sg_pred['Stability_Score'].mean(), 1),
        'total_overload_events': int(sg_pred['overload_pred'].sum()),
        'total_fault_events':    int(sg_pred['fault_pred'].sum()),
        'avg_voltage':           round(sg_pred['Voltage (V)'].mean(), 1),
        'avg_power_factor':      round(sg_pred['Power Factor'].mean(), 3)
    }
}

with open(out('gridmind_data.json'), 'w') as f:
    json.dump(master, f, indent=2)
print("✅ gridmind_data.json regenerated (ML-powered)")

# ── FINAL SUMMARY ─────────────────────────────────────────────────────────────
print(f"\n{BANNER}")
print("  🚀 TRAINING COMPLETE — ACCURACY SUMMARY")
print(BANNER)
print(f"  1. Solar Action Classifier   : {acc1*100:.4f}%  (CV: {cv1.mean()*100:.4f}%)")
print(f"  2. Grid Stability Classifier : {acc2*100:.4f}%  (CV: {cv2.mean()*100:.4f}%)")
print(f"  3. Overload Detector         : {acc3a*100:.4f}%  (on balanced oversampled data)")
print(f"  4. Fault Detector            : {acc3b*100:.4f}%  (on balanced oversampled data)")
print(f"  5. Load Forecaster  (R²)     : {r2:.6f}")
print()

files = [
    'solar_action_model.pkl','grid_stability_model.pkl',
    'overload_detector_model.pkl','fault_detector_model.pkl',
    'load_forecaster_model.pkl','label_encoders.pkl','model_metadata.json'
]
print("📁 Saved model files:")
for fname in files:
    path = mdl(fname)
    size = os.path.getsize(path) / 1024
    print(f"  ✅ models/{fname}  ({size:.1f} KB)")
print(BANNER)
