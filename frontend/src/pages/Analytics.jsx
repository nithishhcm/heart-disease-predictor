import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, BrainCircuit, Heart, Cpu, HardDrive, Timer } from 'lucide-react';
import api from '../utils/api';
import { TableSkeleton } from '../components/Skeletons';
import { TrendTimeline } from '../components/MedicalCharts';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics');
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load analytics platform data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl p-6">
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl p-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
          {error}
        </div>
      </div>
    );
  }

  const {
    total_users,
    total_predictions,
    average_probability,
    risk_distribution,
    daily_predictions,
    age_distribution,
    gender_distribution,
    model_accuracy,
    system_statistics
  } = stats;

  // Format daily predictions for chart consumption
  const trendHistory = Object.entries(daily_predictions).map(([dateStr, count]) => ({
    dateStr: dateStr.split('-').slice(1).join('/'), // format as MM/DD
    probability: count / 10.0 // Normalize count to fit trend percent representation
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-7xl p-4 flex flex-col gap-6"
    >
      {/* Page Title */}
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <BrainCircuit className="text-[#00f0ff] animate-pulse" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Platform Analytics Cockpit</h2>
          <p className="text-xs text-gray-500 font-medium">Cardiovascular diagnosis telemetry and system hardware monitoring</p>
        </div>
      </div>

      {/* Grid Row 1: Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Registered Personnel</span>
            <span className="text-3xl font-extrabold text-white">{total_users}</span>
          </div>
          <div className="p-3 bg-[#00f0ff]/10 rounded-lg border border-[#00f0ff]/20">
            <Users className="text-[#00f0ff]" size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Telemetry Diagnostics</span>
            <span className="text-3xl font-extrabold text-white">{total_predictions}</span>
          </div>
          <div className="p-3 bg-[#7000ff]/10 rounded-lg border border-[#7000ff]/20">
            <Heart className="text-[#7000ff]" size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Average Event Score</span>
            <span className="text-3xl font-extrabold text-[#f97316]">{(average_probability * 100).toFixed(1)}%</span>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <Activity className="text-orange-500" size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Inference Accuracy</span>
            <span className="text-3xl font-extrabold text-green-500">{(model_accuracy * 100).toFixed(1)}%</span>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <BrainCircuit className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Grid Row 2: Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Predictions Line */}
        <div className="lg:col-span-2 flex flex-col">
          <TrendTimeline history={trendHistory} />
        </div>

        {/* System Telemetry Logs */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <div className="border-b border-gray-800 pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#7000ff]">Hardware Diagnostics</h4>
          </div>
          
          <div className="flex flex-col gap-4 justify-center h-full">
            <div className="flex items-center justify-between p-3 bg-black/30 border border-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <Cpu className="text-[#00f0ff]" size={20} />
                <span className="text-sm text-gray-300">CPU Usage</span>
              </div>
              <span className="text-sm font-mono font-bold text-white">{system_statistics.cpu_usage}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/30 border border-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <HardDrive className="text-[#7000ff]" size={20} />
                <span className="text-sm text-gray-300">Memory Load</span>
              </div>
              <span className="text-sm font-mono font-bold text-white">{system_statistics.memory_usage}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/30 border border-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <Timer className="text-orange-500" size={20} />
                <span className="text-sm text-gray-300">System Uptime</span>
              </div>
              <span className="text-sm font-mono font-bold text-white">{system_statistics.uptime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 3: Demographics & Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Age distribution bar list */}
        <div className="glass-panel p-5 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#7000ff] border-b border-gray-800 pb-2">
            Patient Age Profiles
          </h4>
          <div className="flex flex-col gap-2">
            {Object.entries(age_distribution).map(([ageGroup, count]) => {
              const maxVal = Math.max(...Object.values(age_distribution)) || 1;
              const pct = (count / maxVal) * 100;
              return (
                <div key={ageGroup} className="flex items-center justify-between text-xs gap-3">
                  <span className="text-gray-400 font-mono w-10">{ageGroup}</span>
                  <div className="flex-grow h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00f0ff]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-white font-mono w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gender distribution list */}
        <div className="glass-panel p-5 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#7000ff] border-b border-gray-800 pb-2">
            Biological Gender Balance
          </h4>
          <div className="flex flex-col justify-center h-full gap-4">
            {Object.entries(gender_distribution).map(([gender, count]) => {
              const total = Object.values(gender_distribution).reduce((a, b) => a + b, 0) || 1;
              const share = Math.round((count / total) * 100);
              return (
                <div key={gender} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <span className="text-sm text-gray-300 font-semibold">{gender}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{count} patients</div>
                    <div className="text-[10px] text-gray-500 font-mono">{share}% ratio</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Distribution list */}
        <div className="glass-panel p-5 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#7000ff] border-b border-gray-800 pb-2">
            Cardiac Risk Categories
          </h4>
          <div className="flex flex-col justify-center h-full gap-4">
            {Object.entries(risk_distribution).map(([riskType, count]) => {
              const isHigh = riskType.toLowerCase().includes("high");
              return (
                <div key={riskType} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border-l-4" style={{ borderLeftColor: isHigh ? '#ef4444' : '#22c55e' }}>
                  <span className="text-sm text-gray-300 font-semibold">{riskType}</span>
                  <span className="text-sm font-mono font-bold text-white">{count} runs</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics;
