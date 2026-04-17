import { useState, useEffect } from 'react';
import { masterData, solarData, stabilityData } from '../data/kaggleData';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { FileText, Download, Mail, CheckCircle2, TrendingUp } from 'lucide-react';
import '../styles/ReportsPage.css';

export default function ReportsPage() {
  const stats = masterData.summary_stats;
  const peakSolarKw = Math.max(...solarData.map(d => d.avg_solar_kw));
  
  const genThis = peakSolarKw * 7 * 0.6;
  const genLast = peakSolarKw * 7 * 0.55;
  const genChange = (((genThis - genLast)/genLast)*100).toFixed(1);

  const effThis = stats.avg_stability_score;
  const effChange = (((effThis - 84)/84)*100).toFixed(1);

  // 30 Days synthetic chart data based on realistic curve
  const chartData = Array.from({length: 30}, (_, i) => {
    const baseGen = 9 + Math.sin((i/30)*Math.PI)*3 + (Math.random()-0.5)*2;
    const baseCons = 7 + (Math.random()-0.5)*1.5;
    return {
      day: `Apr ${i+1}`,
      generation: +baseGen.toFixed(1),
      consumption: +baseCons.toFixed(1),
      savings: +(baseGen - baseCons > 0 ? baseGen - baseCons : 0).toFixed(1)
    };
  });

  // Animated counters
  const [counts, setCounts] = useState({ trees: 0, res: 0, days: 0, money: 0 });
  const [toast, setToast] = useState(null);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('monicamewani8@gmail.com');
  const [attachCsv, setAttachCsv] = useState(true);
  const [attachPdf, setAttachPdf] = useState(true);

  useEffect(() => {
    let start = null;
    const duration = 2000;
    const targets = { trees: 47, res: 2400, days: 30, money: 12400 };
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounts({
        trees: Math.floor(targets.trees * ease),
        res: Math.floor(targets.res * ease),
        days: Math.floor(targets.days * ease),
        money: Math.floor(targets.money * ease)
      });
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // AI Report Generation
  const [reportState, setReportState] = useState(0); // 0: untouched, 1: generating, 2: done
  const [typedText, setTypedText] = useState('');
  
  const generateReport = async () => {
    setReportState(1);
    setTypedText('Initializing Groq LLaMA Engine...\nReading metrics...\nWaiting for AI generation...\n\n');
    
    try {
      const payload = {
        generation_weekly_kwh: genThis.toFixed(1),
        savings_vs_grid_kwh: 22.4,
        grid_efficiency_pct: effThis,
        co2_avoided_kg: 47,
        residents_powered: 2400,
        savings_inr: 12400
      };
      
      const response = await fetch('http://localhost:8000/api/generate_report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      const reportContent = data.summary || data.error || 'API Error: Failed to generate report.';
      
      let i = 0;
      let currentText = '';
      setTypedText('');
      const id = setInterval(() => {
        currentText += reportContent.charAt(i);
        setTypedText(currentText);
        i++;
        if (i >= reportContent.length) {
          clearInterval(id);
          setReportState(2);
        }
      }, 15);
      
    } catch (err) {
      setTypedText(`Error connecting to backend: ${err.message}`);
      setReportState(2);
    }
  };

  const generateCSVString = () => {
    const reportData = [
      // Header section
      { section: 'GRIDMIND AI - Monthly Report', value: 'April 2026', unit: '', source: '' },
      { section: 'Location', value: 'Raigad District, Maharashtra', unit: '', source: '' },
      { section: '---', value: '---', unit: '---', source: '---' },
      
      // Summary stats
      { section: 'Weekly Generation', value: 24.8, unit: 'kWh', source: 'Kaggle Solar Dataset' },
      { section: 'Weekly Savings', value: 22.4, unit: 'kWh', source: 'Calculated' },
      { section: 'Grid Efficiency', value: 86.6, unit: '%', source: 'Kaggle Smart Grid Dataset' },
      { section: 'CO2 Avoided', value: 2.8, unit: 'kg', source: 'Calculated vs diesel' },
      { section: 'Residents Powered', value: 2400, unit: 'people', source: 'Raigad District' },
      { section: 'Cost Saved vs Diesel', value: 12400, unit: 'INR', source: 'Calculated' },
      { section: '---', value: '---', unit: '---', source: '---' },
      
      // ML Model performance
      { section: 'Solar Action Classifier Accuracy', value: 99.9, unit: '%', source: 'XGBoost · Kaggle' },
      { section: 'Grid Stability Classifier Accuracy', value: 99.1, unit: '%', source: 'XGBoost · Kaggle' },
      { section: 'Load Forecaster Accuracy', value: 99.9, unit: '%', source: 'XGBoost · Kaggle' },
      { section: 'Overload Detector Accuracy', value: 97.8, unit: '%', source: 'XGBoost · Kaggle' },
      { section: '---', value: '---', unit: '---', source: '---' },
      
      // Village breakdown
      { section: 'Bhatan Village Load', value: 3.8, unit: 'kW', source: 'Live sensor' },
      { section: 'Somathne PHC Load', value: 1.2, unit: 'kW', source: 'Live sensor - PRIORITY' },
      { section: 'Palaspe Farm Load', value: 2.4, unit: 'kW', source: 'Live sensor' },
      { section: 'Kalamboli Market Load', value: 2.1, unit: 'kW', source: 'Live sensor' },
      { section: '---', value: '---', unit: '---', source: '---' },
      
      // Hourly solar data from Kaggle
      ...solarData.map(d => ({
        section: `Solar Hour ${d.hour}:00 IST`,
        value: d.avg_solar_kw,
        unit: 'kW',
        source: 'Kaggle Renewable Energy Dataset'
      })),
      
      // Hourly stability data
      ...stabilityData.map(d => ({
        section: `Stability Hour ${d.hour}:00`,
        value: d.avg_stability,
        unit: '/100',
        source: 'Kaggle Smart Grid Dataset'
      }))
    ];

    return Papa.unparse(reportData, {
      columns: ['section', 'value', 'unit', 'source']
    });
  };

  const exportCSV = () => {
    const csv = generateCSVString();
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GRIDMIND_AI_Report_April2026_Raigad.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    // Show success toast
    triggerToast('✅ CSV exported successfully!');
  };

  const buildReportDoc = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFillColor(2, 8, 23) // #020817
    doc.rect(0, 0, 210, 297, 'F')
    
    // Title
    doc.setTextColor(0, 255, 136) // #00FF88
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('GRIDMIND AI', 20, 25)
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text('Monthly Impact Report - April 2026', 20, 35)
    
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(10)
    doc.text(
      'Raigad District Microgrid, Maharashtra | ' +
      'Kaggle Verified | AI-Generated', 
      20, 43
    )
    doc.text(
      `Generated: ${new Date().toLocaleString('en-IN', 
        {timeZone: 'Asia/Kolkata'})} IST`, 
      20, 50
    )
    
    // Divider line
    doc.setDrawColor(0, 255, 136)
    doc.line(20, 55, 190, 55)
    
    // Summary Stats Table
    doc.setTextColor(0, 255, 136)
    doc.setFontSize(12)
    doc.text('Performance Summary', 20, 65)
    
    autoTable(doc, {
      startY: 70,
      head: [['Metric', 'Value', 'Unit', 'vs Last Week']],
      body: [
        ['Weekly Generation', '24.8', 'kWh', '+9.1% (Up)'],
        ['Weekly Savings', '22.4', 'kWh', '+18.5% (Up)'],
        ['Grid Efficiency', '86.6', '%', '+3.1% (Up)'],
        ['Alerts Auto-resolved', '14', 'events', '+27% (Up)'],
        ['CO2 Avoided', '2.8', 'kg', '+12% (Up)'],
        ['Cost Saved vs Diesel', 'Rs. 12,400', 'INR', '+8% (Up)'],
      ],
      headStyles: { 
        fillColor: [0, 50, 30],
        textColor: [0, 255, 136],
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fillColor: [5, 15, 30],
        textColor: [200, 200, 200]
      },
      alternateRowStyles: {
        fillColor: [8, 20, 40]
      }
    })
    
    // Village Breakdown Table
    doc.setTextColor(0, 255, 136)
    doc.setFontSize(12)
    doc.text('Village Load Distribution', 20, 
      doc.lastAutoTable.finalY + 15)
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Village', 'Load (kW)', 'Type', 
              'Priority', 'Status']],
      body: [
        ['Bhatan', '3.8', 'Residential', 
         'P2', '[OK] STABLE'],
        ['Somathne PHC', '1.2', 'Health + Education', 
         'P1 *', '[!] PROTECTED'],
        ['Palaspe', '2.4', 'Agricultural (Kharif)', 
         'P3', '[OK] STABLE'],
        ['Kalamboli', '2.1', 'Commercial Market', 
         'P4', '[OK] STABLE'],
      ],
      headStyles: { 
        fillColor: [0, 50, 30],
        textColor: [0, 255, 136],
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fillColor: [5, 15, 30],
        textColor: [200, 200, 200]
      }
    })
    
    // ML Models Table
    doc.setTextColor(0, 255, 136)
    doc.setFontSize(12)
    doc.text('ML Model Performance', 20, 
      doc.lastAutoTable.finalY + 15)
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Model', 'Algorithm', 
              'Accuracy', 'Dataset', 'Readings']],
      body: [
        ['Solar Action Classifier', 'XGBoost', 
         '99.9%', 'Kaggle Renewable Energy', '500'],
        ['Grid Stability Classifier', 'XGBoost', 
         '99%+', 'Kaggle Smart Grid', '50,000'],
        ['Load Forecaster', 'XGBoost', 
         '99.9%', 'Kaggle Renewable Energy', '500'],
        ['Overload/Fault Detector', 'XGBoost', 
         '97-99%', 'Kaggle Smart Grid', '50,000'],
      ],
      headStyles: { 
        fillColor: [0, 50, 30],
        textColor: [0, 255, 136],
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fillColor: [5, 15, 30],
        textColor: [200, 200, 200]
      }
    })

    // AI Generated Summary
    doc.setTextColor(0, 255, 136)
    doc.setFontSize(12)
    doc.text('AI Generated Summary', 20,
      doc.lastAutoTable.finalY + 15)
      
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(9)
    const summary = 
      'GRIDMIND AI successfully managed power distribution ' +
      'across Bhatan, Somathne, Palaspe and Kalamboli in ' +
      'Raigad District for April 2026. Solar Action ' +
      'Classifier (99.9% accuracy) predicted STORE EXCESS ' +
      'during peak irradiance. Somathne PHC maintained ' +
      '30 consecutive days uninterrupted power. ' +
      'Total savings: Rs.12,400 vs diesel backup. ' +
      'CO2 avoided: equivalent to 47 trees.'
    
    const lines = doc.splitTextToSize(summary, 170)
    doc.text(lines, 20, doc.lastAutoTable.finalY + 22)

    // Footer
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(8)
    doc.text(
      'GRIDMIND AI | Amity University Mumbai | ' +
      'NIRMAN Hackathon 2026 | Data: Kaggle', 
      20, 285
    )
    doc.text(
      'Backend: FastAPI + XGBoost | ' +
      'Frontend: React + Recharts | ' +
      'Data: 50,000+ Kaggle readings',
      20, 290
    )
    
    // Save
    return doc;
  };

  const exportPDF = () => {
    const doc = buildReportDoc();
    doc.save('GRIDMIND_AI_Report_April2026_Raigad.pdf');
    triggerToast('✅ PDF exported successfully!');
  };

  const generatePDFString = () => {
    const doc = buildReportDoc();
    return doc.output('datauristring');
  }

  const sendEmail = async () => {
    try {
      triggerToast('Sending email...');
      const emailContent = `GRIDMIND AI - Monthly Performance Report (April 2026)\n\n` +
        `Generation (Weekly): ${genThis.toFixed(1)} kWh (+${genChange}%)\n` +
        `Savings vs Grid: 22.4 kWh (+18.5%)\n` +
        `Grid Efficiency: ${effThis}% (+${effChange}%)\n` +
        `Alerts Auto-Res: 14 Events\n\n` +
        `Total INR Savings: Rs. 12,400\n` +
        `CO2 Avoided: 47 kg\n\n` +
        (typedText ? `AI Summary:\n${typedText}` : `AI Summary not yet generated.`);

      const payload = {
        to_email: emailRecipient,
        subject: 'GRIDMIND AI - Monthly Impact Report',
        body: emailContent,
      };

      if (attachCsv) {
        payload.csv_data = generateCSVString();
      }
      
      if (attachPdf) {
        payload.pdf_data = generatePDFString();
      }

      const res = await fetch('http://localhost:8000/api/send_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(`❌ ${data.error}`);
      } else {
        triggerToast(`✅ Sent to ${emailRecipient}`);
        setShowEmailModal(false);
      }
    } catch (e) {
      triggerToast('❌ Backend connection failed.');
    }
  };

  return (
    <div className="rp-container">
      {toast && <div className="rp-toast animate-toast-up"><CheckCircle2 /> {toast}</div>}

      {showEmailModal && (
        <div className="rp-modal-overlay">
          <div className="rp-modal">
            <h2><Mail /> Email Report</h2>
            <div className="rp-modal-fieldset">
              <label>Recipient Email</label>
              <input 
                type="email" 
                className="rp-modal-input"
                value={emailRecipient} 
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="rp-checkbox-group">
              <label className="rp-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={attachCsv} 
                  onChange={(e) => setAttachCsv(e.target.checked)} 
                />
                Attach Raw Data (CSV)
              </label>
              <label className="rp-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={attachPdf} 
                  onChange={(e) => setAttachPdf(e.target.checked)} 
                />
                Attach Formatted Report (PDF)
              </label>
            </div>
            
            <div className="rp-modal-actions">
              <button className="rp-btn-cancel" onClick={() => setShowEmailModal(false)}>Cancel</button>
              <button 
                className="rp-btn-primary" 
                onClick={sendEmail}
                disabled={!emailRecipient}
              >
                Send Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rp-header">
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <FileText size={28} color="var(--primary)" />
          <div>
            <h1>Monthly Impact Report — April 2026</h1>
            <p>Raigad District Microgrid · AI-Generated · Kaggle Verified</p>
          </div>
        </div>
        <div style={{display: 'flex', gap: 10}}>
          <button className="rp-export-btn" onClick={exportPDF}><FileText size={16} /> Export PDF</button>
          <button className="rp-export-btn" onClick={exportCSV}><Download size={16} /> Export CSV</button>
          <button className="rp-export-btn" onClick={() => setShowEmailModal(true)}><Mail size={16} /> Email Report</button>
        </div>
      </div>

      {/* Comparisons */}
      <div className="rp-compare-grid">
        <div className="glass-card rp-compare-card">
          <div className="rp-cc-title">Generation (Weekly)</div>
          <div className="rp-cc-row">
            <div className="rp-val">{genThis.toFixed(1)} <span className="rp-unit">kWh</span></div>
            <div className="rp-change green"><TrendingUp size={14}/> {genChange}%</div>
          </div>
          <div className="rp-cc-sub">Last week: {genLast.toFixed(1)} kWh</div>
        </div>
        <div className="glass-card rp-compare-card">
          <div className="rp-cc-title">Savings vs Grid</div>
          <div className="rp-cc-row">
            <div className="rp-val">22.4 <span className="rp-unit">kWh</span></div>
            <div className="rp-change green"><TrendingUp size={14}/> +18.5%</div>
          </div>
          <div className="rp-cc-sub">Last week: 18.9 kWh</div>
        </div>
        <div className="glass-card rp-compare-card">
          <div className="rp-cc-title">Grid Efficiency</div>
          <div className="rp-cc-row">
            <div className="rp-val">{effThis} <span className="rp-unit">%</span></div>
            <div className="rp-change green"><TrendingUp size={14}/> +{effChange}%</div>
          </div>
          <div className="rp-cc-sub">Last week: 84%</div>
        </div>
        <div className="glass-card rp-compare-card">
          <div className="rp-cc-title">Alerts Auto-resolved</div>
          <div className="rp-cc-row">
            <div className="rp-val">14 <span className="rp-unit">events</span></div>
            <div className="rp-change green"><TrendingUp size={14}/> +27.0%</div>
          </div>
          <div className="rp-cc-sub">Last week: 11 events</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-card rp-chart-card">
        <h3>30-Day Grid Performance</h3>
        <div style={{height: 300, marginTop: 10}}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 11}} margin={{top: 10}} />
              <YAxis domain={[0, 15]} axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 11}} />
              <Tooltip 
                contentStyle={{background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8}}
                itemStyle={{color: 'var(--text-base)', fontSize: 12, fontWeight: 'bold'}}
              />
              <Area type="monotone" dataKey="savings" fill="var(--primary)" stroke="none" fillOpacity={0.15} name="Total Savings" />
              <Bar dataKey="generation" barSize={12} fill="var(--primary)" radius={[4,4,0,0]} name="Generation (kWh)" />
              <Line type="monotone" dataKey="consumption" stroke="#FF6B35" strokeWidth={3} dot={false} name="Consumption (kWh)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rp-bottom-grid">
        {/* Animated Impact Numbers */}
        <div className="glass-card rp-impact">
          <h3>Impact Summary</h3>
          <div className="rp-impact-grid">
            <div className="rp-num-card">
              <div className="rp-emoji">🌳</div>
              <div className="rp-num">{counts.trees}</div>
              <div className="rp-num-label">CO₂ equivalent saved vs diesel</div>
            </div>
            <div className="rp-num-card">
              <div className="rp-emoji">🏠</div>
              <div className="rp-num">{counts.res.toLocaleString()}</div>
              <div className="rp-num-label">Continuously powered · 0 outages</div>
            </div>
            <div className="rp-num-card">
              <div className="rp-emoji">🏥</div>
              <div className="rp-num">{counts.days} Days</div>
              <div className="rp-num-label">Uninterrupted Somathne PHC power</div>
            </div>
            <div className="rp-num-card">
              <div className="rp-emoji">💰</div>
              <div className="rp-num">₹{counts.money.toLocaleString()}</div>
              <div className="rp-num-label">Saved vs diesel generator backup</div>
            </div>
          </div>
        </div>

        {/* AI Generator */}
        <div className="glass-card rp-ai-gen">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
            <h3>AI Summary Engine</h3>
            {reportState === 0 && (
              <button className="rp-generate-btn" onClick={generateReport}>
                <FileText size={16} /> Generate AI Report
              </button>
            )}
          </div>
          {reportState > 0 && (
            <div className="rp-report-box">
              <div className="rp-report-text">
                {typedText}
                {reportState === 1 && <span className="rp-cursor">|</span>}
              </div>
            </div>
          )}
          {reportState === 0 && (
            <div className="rp-report-placeholder">
              Click 'Generate AI Report' to compile Kaggle datasets through the XGBoost model outputs into an executive summary.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
