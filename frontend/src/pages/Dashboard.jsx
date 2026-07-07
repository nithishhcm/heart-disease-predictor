import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, ShieldCheck, BrainCircuit, HeartPulse, FileText, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const INITIAL_DATA = {
  age: 55, sex: 1, cp: 0, trestbps: 140, chol: 250,
  fbs: 0, restecg: 1, thalach: 150, exang: 0,
  oldpeak: 1.5, slope: 1, ca: 0, thal: 2
};

const UI_FIELDS = {
  age: { label: 'Age (Years)', type: 'number', min: 20, max: 100 },
  sex: { 
    label: 'Biological Sex', type: 'select', 
    options: [{v: 0, l: 'Female'}, {v: 1, l: 'Male'}] 
  },
  cp: {
    label: 'Chest Pain Type (0-3)', type: 'select',
    options: [
      {v: 0, l: 'Typical Angina (0)'}, {v: 1, l: 'Atypical Angina (1)'}, 
      {v: 2, l: 'Non-Anginal Pain (2)'}, {v: 3, l: 'Asymptomatic (3)'}
    ]
  },
  trestbps: { label: 'Resting Blood Pressure (mmHg)', type: 'number' },
  chol: { label: 'Serum Cholesterol (mg/dL)', type: 'number' },
  fbs: {
    label: 'Fasting Blood Sugar > 120 mg/dL', type: 'select',
    options: [{v: 0, l: 'Normal (0)'}, {v: 1, l: 'Elevated (1)'}]
  },
  restecg: {
    label: 'Resting ECG Results (0-2)', type: 'select',
    options: [{v: 0, l: 'Normal (0)'}, {v: 1, l: 'ST-T Abnormality (1)'}, {v: 2, l: 'LV Hypertrophy (2)'}]
  },
  thalach: { label: 'Maximum Heart Rate (bpm)', type: 'number' },
  exang: {
    label: 'Exercise-Induced Angina', type: 'select',
    options: [{v: 0, l: 'No (0)'}, {v: 1, l: 'Yes (1)'}]
  },
  oldpeak: { label: 'ST Depression from Exercise (mm)', type: 'number', step: '0.1' },
  slope: {
    label: 'Peak Exercise ST Slope (0-2)', type: 'select',
    options: [{v: 0, l: 'Upsloping / Good (0)'}, {v: 1, l: 'Flat (1)'}, {v: 2, l: 'Downsloping / Risk (2)'}]
  },
  ca: {
    label: 'Major Vessels via Fluoroscopy (0-4)', type: 'select',
    options: [{v: 0, l: '0 Vessels'}, {v: 1, l: '1 Vessel'}, {v: 2, l: '2 Vessels'}, {v: 3, l: '3 Vessels'}, {v: 4, l: '4 Vessels'}]
  },
  thal: {
    label: 'Thalassemia (0-3)', type: 'select',
    options: [{v: 0, l: 'Normal (0)'}, {v: 1, l: 'Fixed Defect (1)'}, {v: 2, l: 'Reversible Defect (2)'}, {v: 3, l: 'Severe (3)'}]
  }
};

const Dashboard = () => {
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'number' || e.target.tagName === 'SELECT' 
      ? parseFloat(e.target.value) 
      : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/predict`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl flex flex-col xl:flex-row gap-6 p-4">
      {/* Input Panel */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        className="glass-panel p-6 w-full xl:w-[400px] flex-shrink-0 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
          <HeartPulse className="text-[#00f0ff]" />
          <h2 className="text-xl font-bold text-white">Patient Telemetry</h2>
        </div>
        
        {error && <div className="text-red-400 mb-4 text-sm bg-red-500/10 p-3 rounded border border-red-500/20">{error}</div>}

        <form onSubmit={handlePredict} className="flex flex-col gap-4">
          {Object.entries(UI_FIELDS).map(([key, config]) => (
            <div key={key} className="flex flex-col">
              <label className="text-[11px] text-[#00f0ff] uppercase tracking-wider mb-1 font-semibold">{config.label}</label>
              
              {config.type === 'select' ? (
                <select
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="input-field px-3 py-2.5 rounded-md text-sm bg-black/50 border border-gray-700 text-white focus:border-[#00f0ff] outline-none"
                  required
                >
                  {config.options.map(opt => (
                    <option key={opt.v} value={opt.v} className="bg-gray-900">{opt.l}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  step={config.step || '1'}
                  min={config.min}
                  max={config.max}
                  className="input-field px-3 py-2 rounded-md text-sm bg-black/50 border border-gray-700 text-white focus:border-[#00f0ff] outline-none"
                  required
                />
              )}
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={loading}
              className="neon-button w-full py-3 rounded-lg font-bold tracking-widest uppercase text-sm flex justify-center items-center gap-2"
            >
              {loading ? <Activity className="animate-spin" /> : <BrainCircuit />}
              {loading ? 'Analyzing Profile...' : 'Run Diagnostics'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Results Panel */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1 flex flex-col gap-6"
      >
        {!result && !loading && (
          <div className="glass-panel p-12 flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <BrainCircuit size={64} className="opacity-30" />
            <h3 className="text-xl">Awaiting Patient Data</h3>
            <p className="text-sm">Enter telemetry parameters on the left and run diagnostics to generate a medical report.</p>
          </div>
        )}

        {loading && (
          <div className="glass-panel p-12 flex flex-col items-center justify-center h-full gap-6">
            <div className="w-16 h-16 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
            <p className="neon-text-primary animate-pulse text-lg tracking-widest uppercase">Processing Neural Inference...</p>
          </div>
        )}

        {result && !loading && (
          <AnimatePresence mode="wait">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6 w-full">
              
              {/* TOP ROW: Prediction & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1: Prediction Status */}
                <div className="glass-panel p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className={`absolute top-0 w-full h-1 ${result.prediction === 1 ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-green-500 shadow-[0_0_15px_#22c55e]'}`} />
                  
                  {result.prediction === 1 ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="p-5 bg-red-500/10 rounded-full animate-pulse border border-red-500/30">
                        <ShieldAlert size={56} className="text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-red-500 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">High Risk</h3>
                        <p className="text-gray-400 mt-2 tracking-widest uppercase text-sm">Cardiac Event Probability</p>
                      </div>
                      <div className="text-5xl font-light text-white mt-2">
                        {(result.probability * 100).toFixed(1)}<span className="text-2xl text-gray-500">%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="p-5 bg-green-500/10 rounded-full border border-green-500/30">
                        <ShieldCheck size={56} className="text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-green-500 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">Low Risk</h3>
                        <p className="text-gray-400 mt-2 tracking-widest uppercase text-sm">Cardiac Event Probability</p>
                      </div>
                      <div className="text-5xl font-light text-white mt-2">
                        {(result.probability * 100).toFixed(1)}<span className="text-2xl text-gray-500">%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card 4: Medical Summary */}
                <div className="glass-panel p-6 flex flex-col relative">
                  <div className="flex items-center gap-2 mb-4 text-[#00f0ff] border-b border-gray-800 pb-3">
                    <FileText size={20} />
                    <h3 className="font-bold tracking-wider uppercase">Clinical Summary</h3>
                  </div>
                  <div className="flex-1 flex items-center bg-black/40 rounded-lg p-5 border border-gray-800">
                    <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                      {result.medical_summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Risk Factors Analysis */}
              <div className="glass-panel p-6 relative">
                <div className="flex items-center gap-2 mb-6 text-[#7000ff] border-b border-gray-800 pb-3">
                  <Activity size={20} />
                  <h3 className="font-bold tracking-wider uppercase">AI Factor Analysis</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* High Risk Column */}
                  <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-4 font-semibold uppercase tracking-wider text-xs">
                      <AlertTriangle size={16} /> Risk Drivers
                    </div>
                    {result.risk_factors.high_risk.length > 0 ? (
                      <ul className="space-y-3">
                        {result.risk_factors.high_risk.map((factor, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No significant risk drivers identified.</p>
                    )}
                  </div>

                  {/* Protective Column */}
                  <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-4 font-semibold uppercase tracking-wider text-xs">
                      <CheckCircle size={16} /> Protective Factors
                    </div>
                    {result.risk_factors.protective_factors.length > 0 ? (
                      <ul className="space-y-3">
                        {result.risk_factors.protective_factors.map((factor, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No significant protective factors identified.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Patient Profile */}
              <div className="glass-panel p-6 relative">
                <div className="flex items-center gap-2 mb-4 text-gray-300 border-b border-gray-800 pb-3">
                  <Info size={20} />
                  <h3 className="font-bold tracking-wider uppercase text-sm">Patient Profile Snapshot</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(result.patient_profile).map(([label, val]) => (
                    <div key={label} className="bg-black/40 border border-gray-800 rounded p-3">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-sm text-white font-medium truncate" title={val}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
