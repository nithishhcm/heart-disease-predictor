import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const FIELD_LABELS = {
  age: 'Age', sex: 'Biological Sex', cp: 'Chest Pain Type',
  trestbps: 'Resting Blood Pressure', chol: 'Serum Cholesterol',
  fbs: 'Fasting Blood Sugar', restecg: 'Resting ECG Result',
  thalach: 'Max Heart Rate Achieved', exang: 'Exercise-Induced Angina',
  oldpeak: 'ST Depression (Exercise)', slope: 'Peak Exercise ST Slope',
  ca: 'Fluoroscopy Major Vessels', thal: 'Thalassemia',
};

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="w-full max-w-5xl glass-panel p-8 min-h-[70vh] flex flex-col"
    >
      <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-4">
        <HistoryIcon className="text-[#00f0ff]" size={28} />
        <h2 className="text-2xl font-bold text-white">Prediction History</h2>
      </div>

      {error && <div className="text-red-400 mb-4 bg-red-500/10 p-3 rounded">{error}</div>}

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Activity className="animate-spin text-[#00f0ff]" size={40} />
        </div>
      ) : history.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-gray-500">
          <HistoryIcon size={64} className="opacity-20 mb-4" />
          <p>No prediction records found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm tracking-wider uppercase">
                <th className="pb-4 px-4 font-normal">Timestamp</th>
                <th className="pb-4 px-4 font-normal">Prediction</th>
                <th className="pb-4 px-4 font-normal">Probability</th>
                <th className="pb-4 px-4 font-normal">Top Factor</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, idx) => {
                const date = new Date(record.timestamp).toLocaleString();
                // Find top absolute SHAP value
                const topFactor = Object.entries(record.explanation)
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];

                return (
                  <motion.tr 
                    key={record.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border-b border-gray-800/50 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-gray-300">{date}</td>
                    <td className="py-4 px-4">
                      {record.prediction === 1 ? (
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertTriangle size={16} /> High Risk
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle size={16} /> Normal
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {(record.probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {topFactor ? (
                        <span className="flex items-center gap-2">
                          <span className="uppercase text-[11px] tracking-wider font-semibold">
                            {FIELD_LABELS[topFactor[0]] || topFactor[0]}
                          </span>
                          <span className={topFactor[1] > 0 ? "text-red-400" : "text-green-400"}>
                            ({topFactor[1] > 0 ? '+' : ''}{topFactor[1].toFixed(3)})
                          </span>
                        </span>
                      ) : 'N/A'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default History;
