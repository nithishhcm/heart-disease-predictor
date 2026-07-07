import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight, ChevronLeft, BrainCircuit, Activity, Info, ShieldAlert } from 'lucide-react';

const FIELD_DEFS = {
  age: {
    label: 'Age',
    type: 'number',
    unit: 'yrs',
    min: 20,
    max: 100,
    tooltip: 'Patient chronological age. Cardiovascular risk accumulates naturally with age.',
    normalRange: '20 to 100 years',
    placeholder: 'Enter Age (e.g., 55)'
  },
  sex: {
    label: 'Biological Sex',
    type: 'select',
    options: [{ v: 0, l: 'Female' }, { v: 1, l: 'Male' }],
    tooltip: 'Sex assigned at birth. Statistical variations affect baseline vascular event models.',
    normalRange: 'N/A'
  },
  cp: {
    label: 'Chest Pain Type',
    type: 'select',
    options: [
      { v: 0, l: 'Typical Angina' },
      { v: 1, l: 'Atypical Angina' },
      { v: 2, l: 'Non-Anginal Pain' },
      { v: 3, l: 'Asymptomatic (Severe)' }
    ],
    tooltip: 'Chest discomfort description. Typical Angina reflects myocardial oxygen deprivation.',
    normalRange: 'Non-anginal discomfort is favorable; asymptomatic/typical poses higher risk.'
  },
  exang: {
    label: 'Exercise Angina',
    type: 'select',
    options: [{ v: 0, l: 'No Angina (0)' }, { v: 1, l: 'Present (1)' }],
    tooltip: 'Angina triggered during stress testing. Positive is strongly correlated with arterial blockages.',
    normalRange: 'Should be absent (No).'
  },
  trestbps: {
    label: 'Resting Blood Pressure',
    type: 'number',
    unit: 'mmHg',
    min: 80,
    max: 200,
    tooltip: 'Systolic blood pressure measured on admission in resting state.',
    normalRange: 'Normal: <120 mmHg. Stage 2 Hypertensive: >=140 mmHg.',
    placeholder: 'e.g., 120'
  },
  chol: {
    label: 'Serum Cholesterol',
    type: 'number',
    unit: 'mg/dL',
    min: 100,
    max: 600,
    tooltip: 'Serum cholesterol concentration. Elevates atherosclerotic plaque formation rate.',
    normalRange: 'Desirable: <200 mg/dL. High Risk: >=240 mg/dL.',
    placeholder: 'e.g., 195'
  },
  fbs: {
    label: 'Fasting Blood Sugar',
    type: 'select',
    options: [{ v: 0, l: 'Normal (<= 120 mg/dL)' }, { v: 1, l: 'Elevated (> 120 mg/dL)' }],
    tooltip: 'Blood glucose level after fasting. Elevated levels increase cardiovascular pathology risk.',
    normalRange: 'Fasting sugar: <=120 mg/dL (Normal).'
  },
  restecg: {
    label: 'Resting ECG Results',
    type: 'select',
    options: [
      { v: 0, l: 'Normal ECG' },
      { v: 1, l: 'ST-T Wave Abnormality' },
      { v: 2, l: 'Left Ventricular Hypertrophy' }
    ],
    tooltip: 'Electrocardiogram readout at rest. ST-T abnormality indicates perfusion risks.',
    normalRange: 'Normal is optimal. Ventricular hypertrophy reflects chronic heart workload pressure.'
  },
  thalach: {
    label: 'Max Heart Rate',
    type: 'number',
    unit: 'bpm',
    min: 60,
    max: 220,
    tooltip: 'Highest heart rate recorded during maximum exercise stress testing.',
    normalRange: 'Typically 140 - 180 bpm under high physical stress.',
    placeholder: 'e.g., 150'
  },
  oldpeak: {
    label: 'ST Depression (Exercise)',
    type: 'number',
    step: '0.1',
    unit: 'mm',
    min: 0.0,
    max: 6.0,
    tooltip: 'ST segment depression measured on stress test relative to rest. Reflects ischemia.',
    normalRange: 'Favorable: <0.5 mm. High ischemia risk: >=1.5 mm.',
    placeholder: 'e.g., 1.5'
  },
  slope: {
    label: 'ST Segment Slope',
    type: 'select',
    options: [
      { v: 0, l: 'Upsloping (Favorable)' },
      { v: 1, l: 'Flat (Borderline)' },
      { v: 2, l: 'Downsloping (Risk Indicator)' }
    ],
    tooltip: 'Peak exercise ST segment slope. Downsloping represents coronary arterial constraint.',
    normalRange: 'Upsloping is favorable; downsloping is high-risk.'
  },
  ca: {
    label: 'Fluoroscopy Vessels Count',
    type: 'select',
    options: [
      { v: 0, l: '0 vessels (Clear)' },
      { v: 1, l: '1 vessel' },
      { v: 2, l: '2 vessels' },
      { v: 3, l: '3 vessels' },
      { v: 4, l: '4 vessels (Severe)' }
    ],
    tooltip: 'Number of major coronary blood vessels showing blockage visible via X-ray dye.',
    normalRange: '0 major vessels affected (optimal).'
  },
  thal: {
    label: 'Thalassemia Defect',
    type: 'select',
    options: [
      { v: 0, l: 'Normal Perfusion' },
      { v: 1, l: 'Fixed Defect (Stable)' },
      { v: 2, l: 'Reversible Defect (Dynamic)' },
      { v: 3, l: 'Severe / Critical Defect' }
    ],
    tooltip: 'Nuclear resonance perfusion scans indicator. Reversible/fixed defects point to blood supply blocks.',
    normalRange: 'Normal perfusion (0).'
  }
};

const STEPS = [
  { title: 'Demographics', fields: ['age', 'sex'] },
  { title: 'Clinical Symptoms', fields: ['cp', 'exang'] },
  { title: 'Physiological Vitals', fields: ['trestbps', 'chol', 'fbs'] },
  { title: 'Diagnostic Tests', fields: ['restecg', 'thalach', 'oldpeak', 'slope', 'ca', 'thal'] }
];

const WizardForm = ({ onSubmit, loading, initialData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [errors, setErrors] = useState({});

  const validateField = (name, val) => {
    const config = FIELD_DEFS[name];
    if (!config) return '';
    
    if (config.type === 'number') {
      const num = parseFloat(val);
      if (isNaN(num)) return 'Required numeric entry';
      if (config.min !== undefined && num < config.min) return `Minimum threshold: ${config.min}`;
      if (config.max !== undefined && num > config.max) return `Maximum limit: ${config.max}`;
    }
    return '';
  };

  const handleFieldChange = (name, rawVal) => {
    const val = FIELD_DEFS[name].type === 'number' ? parseFloat(rawVal) : parseInt(rawVal);
    const err = validateField(name, val);
    
    setErrors({ ...errors, [name]: err });
    setFormData({ ...formData, [name]: isNaN(val) ? rawVal : val });
  };

  const nextStep = () => {
    // Validate current step fields before progressing
    let stepHasError = false;
    const newErrors = { ...errors };
    
    STEPS[currentStep].fields.forEach((field) => {
      const val = formData[field];
      const err = validateField(field, val);
      if (err) {
        newErrors[field] = err;
        stepHasError = true;
      }
    });

    setErrors(newErrors);
    if (!stepHasError && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    let formHasError = false;
    const newErrors = {};

    Object.keys(FIELD_DEFS).forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) {
        newErrors[field] = err;
        formHasError = true;
      }
    });

    setErrors(newErrors);
    if (!formHasError) {
      onSubmit(formData);
    } else {
      // Find first step that has error and jump to it
      for (let sIdx = 0; sIdx < STEPS.length; sIdx++) {
        const stepFields = STEPS[sIdx].fields;
        const stepHasError = stepFields.some(f => newErrors[f]);
        if (stepHasError) {
          setCurrentStep(sIdx);
          break;
        }
      }
    }
  };

  const renderField = (name) => {
    const config = FIELD_DEFS[name];
    if (!config) return null;
    const hasError = !!errors[name];

    return (
      <div key={name} className="flex flex-col relative bg-black/30 border border-gray-900 rounded-xl p-4 gap-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#00f0ff]">
              {config.label}
            </span>
            {config.unit && (
              <span className="text-[10px] text-gray-500 font-mono">({config.unit})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTooltip(activeTooltip === name ? null : name)}
              className="text-gray-500 hover:text-[#00f0ff] transition-colors p-0.5 rounded-md"
              title="Medical info"
            >
              <HelpCircle size={15} />
            </button>
          </div>
        </div>

        {/* Tooltip detail block */}
        <AnimatePresence>
          {activeTooltip === name && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-gray-400 leading-relaxed border-l-2 border-[#7000ff] pl-3 py-1 flex flex-col gap-1"
            >
              <p>{config.tooltip}</p>
              <p className="text-[10px] text-gray-500 font-medium">
                <span className="text-[#7000ff]">Normal Baseline:</span> {config.normalRange}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {config.type === 'select' ? (
          <select
            value={formData[name]}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            className={`input-field w-full px-3.5 py-3 rounded-lg text-sm bg-black/60 border ${hasError ? 'border-red-500' : 'border-gray-800'} text-white focus:border-[#00f0ff] outline-none transition-colors`}
          >
            {config.options.map((opt) => (
              <option key={opt.v} value={opt.v} className="bg-[#0b0b0e]">
                {opt.l}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            step={config.step || '1'}
            min={config.min}
            max={config.max}
            value={formData[name]}
            placeholder={config.placeholder}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            className={`input-field w-full px-3.5 py-3 rounded-lg text-sm bg-black/60 border ${hasError ? 'border-red-500' : 'border-gray-800'} text-white focus:border-[#00f0ff] outline-none transition-colors`}
            required
          />
        )}

        {hasError && (
          <div className="flex items-center gap-1 text-red-500 text-xs mt-0.5">
            <ShieldAlert size={12} />
            <span>{errors[name]}</span>
          </div>
        )}
      </div>
    );
  };

  const progressPct = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <form onSubmit={handleSubmitForm} className="w-full flex flex-col gap-6">
      {/* Wizard Header Progress Tracker */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-xs uppercase font-mono tracking-widest text-[#7000ff]">
            Diagnostics Phase {currentStep + 1} of {STEPS.length}
          </span>
          <span className="font-bold text-[#00f0ff]">{Math.round(progressPct)}% COMPLETE</span>
        </div>
        
        {/* Glowing Progress bar */}
        <div className="w-full h-1 bg-gray-800/80 rounded-full overflow-hidden relative">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#00f0ff] to-[#7000ff] shadow-[0_0_8px_#00f0ff]"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Tab labels */}
        <div className="hidden sm:flex justify-between mt-1 text-[10px] text-gray-500 tracking-wider uppercase font-semibold">
          {STEPS.map((step, idx) => (
            <span 
              key={idx} 
              className={idx === currentStep ? "text-[#00f0ff] neon-text-primary" : idx < currentStep ? "text-gray-300" : "text-gray-600"}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Fields card area */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-800/80">
              <Info size={16} className="text-[#7000ff]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {STEPS[currentStep].title} Parameters
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STEPS[currentStep].fields.map((field) => renderField(field))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4 border-t border-gray-800/80 mt-2">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={prevStep}
            className="input-field px-6 py-3 rounded-lg text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-white/5 active:translate-y-0.5 transition-transform"
          >
            <ChevronLeft size={16} /> Previous
          </button>
        )}
        
        {currentStep < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="neon-button ml-auto px-6 py-3 rounded-lg text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2"
          >
            Next Step <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="neon-button ml-auto px-8 py-3.5 rounded-lg text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            {loading ? <Activity className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
            {loading ? 'Evaluating Telemetry...' : 'Synthesize Analytics'}
          </button>
        )}
      </div>
    </form>
  );
};

export default WizardForm;
