import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, BrainCircuit, FileText, AlertTriangle, 
  CheckCircle, ArrowRight, Download, Printer, RefreshCw,
  Activity 
} from 'lucide-react';
import api, { classifyError } from '../utils/api';
import WizardForm from '../components/WizardForm';
import ECGHeartbeat from '../components/ECGHeartbeat';
import { RiskGauge, FeatureBarChart, RadarChart } from '../components/MedicalCharts';
import NotificationToast from '../components/NotificationToast';

const INITIAL_DATA = {
  age: 55, sex: 1, cp: 0, trestbps: 140, chol: 250,
  fbs: 0, restecg: 1, thalach: 150, exang: 0,
  oldpeak: 1.5, slope: 1, ca: 0, thal: 2
};

const Dashboard = () => {
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  const handlePredict = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/predict', data);
      setResult(res.data);
      setFormData(data); // save state
      setToast({ message: 'Diagnostic check successfully generated.', type: 'success' });
    } catch (err) {
      setToast({ message: classifyError(err), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    try {
      const response = await api.get(`/prediction/${result.prediction_id}/report/download`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `cardio_report_${result.prediction_id}.pdf`;
      link.click();
      setToast({ message: 'Report PDF downloaded.', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to download report PDF.', type: 'error' });
    }
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const headers = ['Telemetry Parameter', 'Value'];
    const rows = Object.entries(result.patient_profile).map(([k, v]) => [k, v]);
    rows.push(['Risk Probability', `${(result.probability * 100).toFixed(1)}%`]);
    rows.push(['Risk Category', result.risk_level]);
    rows.push(['Clinical Severity', result.clinical_severity]);
    rows.push(['Diagnostic Date', new Date(result.prediction_timestamp).toLocaleString()]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `patient_cardio_data_${result.prediction_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: 'Patient parameters exported as CSV.', type: 'success' });
  };

  const handlePrint = () => {
    window.print();
  };

  // Maps top factors into chart coordinate layout
  const getFactorChartData = () => {
    if (!result) return [];
    // Merge risk and protective factors and slice top 6
    const riskData = result.risk_contributors.map(c => ({ label: c.label, impact: c.impact, value: c.value }));
    const protData = result.protective_contributors.map(c => ({ label: c.label, impact: c.impact, value: c.value }));
    return [...riskData, ...protData].sort((a,b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 6);
  };

  // Maps values for the radar physiological balance chart
  const getRadarData = () => {
    if (!result) return [];
    const fields = result.patient_profile;
    
    // Normalize raw parameters between 0 and 1
    const raw = formData;
    return [
      { name: 'Blood Pressure', value: Math.min((raw.trestbps - 80) / 120, 1.0) },
      { name: 'Cholesterol', value: Math.min((raw.chol - 100) / 350, 1.0) },
      { name: 'Heart Rate Peak', value: Math.min((raw.thalach - 60) / 160, 1.0) },
      { name: 'Ischemia Depression', value: Math.min(raw.oldpeak / 4.0, 1.0) },
      { name: 'Age Susceptibility', value: Math.min((raw.age - 20) / 80, 1.0) }
    ];
  };

  return (
    <div className="w-full max-w-7xl flex flex-col xl:flex-row gap-6 p-4">
      {/* Input Form Wizard Side */}
      <motion.div 
        id="wizard-side"
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.5 }}
        className="glass-panel p-6 w-full xl:w-[480px] flex-shrink-0 flex flex-col gap-6 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
          <HeartPulse className="text-[#00f0ff]" />
          <div>
            <h2 className="text-xl font-bold text-white">Diagnostics Telemetry</h2>
            <p className="text-[10px] text-gray-500 font-medium">Input clinical indicators to start synthesis</p>
          </div>
        </div>

        <WizardForm onSubmit={handlePredict} loading={loading} initialData={formData} />
        
        {/* Animated Lead II Heartbeat ECG */}
        <ECGHeartbeat height={85} />
      </motion.div>

      {/* Results Report Side */}
      <motion.div 
        id="results-side"
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-grow flex flex-col gap-6 min-h-[500px]"
      >
        {!result && !loading && (
          <div className="glass-panel p-12 flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <BrainCircuit size={64} className="opacity-30 text-[#7000ff]" />
            <h3 className="text-xl text-white font-semibold">Awaiting Telemetry Parameters</h3>
            <p className="text-sm text-center max-w-md">
              Complete the multi-step diagnostics wizard on the left and trigger compilation to generate an AI clinical evaluation sheet.
            </p>
          </div>
        )}

        {loading && (
          <div className="glass-panel p-12 flex flex-col items-center justify-center h-full gap-6">
            <div className="w-16 h-16 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
            <p className="neon-text-primary animate-pulse text-lg tracking-widest uppercase font-mono">Running Neural Risk Inference...</p>
          </div>
        )}

        {result && !loading && (
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex flex-col gap-6 w-full"
            >
              {/* TOP ACTION BAR: Downloads and Prints */}
              <div id="action-bar" className="flex flex-wrap items-center justify-between gap-4 bg-black/40 border border-gray-900 rounded-xl p-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">Report Signature</span>
                  <span className="text-xs text-white font-mono">NH-REF-{String(result.prediction_id).padStart(5, '0')}</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleDownloadPDF}
                    className="input-field px-4 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-white/5 active:translate-y-0.5 transition-transform"
                  >
                    <Download size={14} /> PDF Report
                  </button>
                  <button 
                    onClick={handleDownloadCSV}
                    className="input-field px-4 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-white/5 active:translate-y-0.5 transition-transform"
                  >
                    <FileText size={14} /> Export CSV
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="input-field px-4 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-white/5 active:translate-y-0.5 transition-transform"
                  >
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>

              {/* ROW 1: Gauge and Medical summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RiskGauge value={result.probability} label="Cardiovascular Risk" />
                
                {/* Clinical Interpretation Card */}
                <div className="glass-panel p-6 flex flex-col relative">
                  <div className="flex items-center gap-2 mb-4 text-[#00f0ff] border-b border-gray-800 pb-3">
                    <FileText size={18} />
                    <h3 className="font-bold tracking-wider uppercase text-xs">Medical Assessment Summary</h3>
                  </div>
                  <div className="flex-grow bg-black/40 border border-gray-900 rounded-xl p-4 flex flex-col gap-3">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {result.patient_summary}
                    </p>
                    <p className="text-xs text-gray-500 italic border-t border-gray-950 pt-2 leading-relaxed">
                      <span className="font-bold text-gray-400 not-italic">Clinical Path:</span> {result.medical_interpretation}
                    </p>
                  </div>
                </div>
              </div>

              {/* ROW 2: Charts Area (Radar Physiological + Factor Importances) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureBarChart data={getFactorChartData()} />
                <RadarChart indicators={getRadarData()} />
              </div>

              {/* ROW 3: Risk Drivers list */}
              <div className="glass-panel p-6 relative">
                <div className="flex items-center gap-2 mb-4 text-gray-300 border-b border-gray-800 pb-3">
                  <Activity size={18} />
                  <h3 className="font-bold tracking-wider uppercase text-xs">Pathology Indicator Auditing</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Risk columns */}
                  <div className="bg-red-950/10 border border-red-950/20 rounded-xl p-4 flex flex-col gap-3">
                    <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle size={14} /> Core Risk Accelerators
                    </h4>
                    {result.risk_contributors.length === 0 ? (
                      <p className="text-gray-500 text-xs italic">No critical risk metrics identified.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {result.risk_contributors.map((c, i) => (
                          <div key={i} className="text-xs">
                            <div className="flex justify-between font-semibold text-gray-300 mb-0.5">
                              <span>{c.label} ({c.value})</span>
                              <span className="text-red-400">{c.severity}</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed">{c.clinical_interpretation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Protective columns */}
                  <div className="bg-green-950/10 border border-green-950/20 rounded-xl p-4 flex flex-col gap-3">
                    <h4 className="text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle size={14} /> Stabilizing / Favorable Markers
                    </h4>
                    {result.protective_contributors.length === 0 ? (
                      <p className="text-gray-500 text-xs italic">No protective markers identified.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {result.protective_contributors.map((c, i) => (
                          <div key={i} className="text-xs">
                            <div className="flex justify-between font-semibold text-gray-300 mb-0.5">
                              <span>{c.label} ({c.value})</span>
                              <span className="text-green-400">{c.severity}</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed">{c.clinical_interpretation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ROW 4: Action Recommendations */}
              <div className="glass-panel p-6 flex flex-col gap-4">
                <div className="border-b border-gray-800 pb-3">
                  <h3 className="font-bold tracking-wider uppercase text-xs text-white">Recommended Intervention Plan</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Tests */}
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-[#00f0ff] uppercase tracking-wider">Diagnostic Screenings</h4>
                    <ul className="space-y-1.5 text-gray-400">
                      {result.recommended_medical_tests.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#00f0ff]">•</span> {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Lifestyle */}
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-[#7000ff] uppercase tracking-wider">Lifestyle Directions</h4>
                    <ul className="space-y-1.5 text-gray-400">
                      {result.lifestyle_recommendations.map((l, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#7000ff]">•</span> {l}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specialists & Referrals */}
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-orange-500 uppercase tracking-wider">Specialists & Referrals</h4>
                    <ul className="space-y-1.5 text-gray-400 mb-2">
                      {result.recommended_specialists.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-orange-500">•</span> {s}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto bg-black/40 border border-gray-900 rounded p-2.5 text-[10px]">
                      <span className="font-bold text-gray-400 block uppercase mb-1">Follow-up Window</span>
                      <span className="text-white font-semibold">{result.follow_up_timeline}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {toast && (
        <NotificationToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
