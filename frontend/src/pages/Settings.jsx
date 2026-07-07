import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Shield, Bell, Eye, EyeOff, Layout, History, Clock } from 'lucide-react';
import api, { classifyError } from '../utils/api';
import { FormSkeleton } from '../components/Skeletons';
import NotificationToast from '../components/NotificationToast';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, historyRes, auditsRes] = await Promise.all([
          api.get('/auth/settings'),
          api.get('/auth/login-history'),
          api.get('/auth/audit-logs')
        ]);
        setSettings(settingsRes.data);
        setLoginHistory(historyRes.data);
        setAuditLogs(auditsRes.data);
      } catch (err) {
        setToast({ message: 'Failed to retrieve profile configuration.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleSettings = (field) => {
    setSettings({
      ...settings,
      [field]: !settings[field]
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await api.put('/auth/settings', {
        theme: settings.theme,
        notifications_enabled: settings.notifications_enabled,
        two_factor_enabled: settings.two_factor_enabled
      });
      setSettings(res.data);
      setToast({ message: 'Preferences updated successfully.', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to update preferences.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl p-6">
        <FormSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl p-4 flex flex-col gap-6"
    >
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <SettingsIcon className="text-[#00f0ff]" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Personalizations & Security</h2>
          <p className="text-xs text-gray-500 font-medium">Configure diagnostics dashboard behavior and audit security trails</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Preferences Form */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7000ff] pb-2 border-b border-gray-800 flex items-center gap-2">
              <Layout size={16} /> Console Themes
            </h3>
            
            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-between text-xs text-gray-300">
                <span>Interface Theme</span>
                <select 
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  className="input-field px-3 py-1.5 rounded bg-black/60 border border-gray-800 text-white outline-none"
                >
                  <option value="dark">Deep Space (Dark)</option>
                  <option value="glass">Glassmorphism</option>
                </select>
              </label>

              <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer pt-2">
                <span className="flex items-center gap-2">
                  <Bell size={14} className="text-[#00f0ff]" /> Enable Notifications
                </span>
                <input 
                  type="checkbox"
                  checked={settings.notifications_enabled}
                  onChange={() => handleToggleSettings('notifications_enabled')}
                  className="w-4 h-4 accent-[#00f0ff] rounded bg-black border-gray-800"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer pt-2">
                <span className="flex items-center gap-2">
                  <Shield size={14} className="text-[#7000ff]" /> Two-Factor Verification
                </span>
                <input 
                  type="checkbox"
                  checked={settings.two_factor_enabled}
                  onChange={() => handleToggleSettings('two_factor_enabled')}
                  className="w-4 h-4 accent-[#7000ff] rounded bg-black border-gray-800"
                />
              </label>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="neon-button py-2.5 rounded-lg font-bold uppercase text-xs mt-3 flex justify-center items-center"
            >
              {saving ? 'Saving...' : 'Apply Changes'}
            </button>
          </div>
        </div>

        {/* Right Column: Security Audits & Login History */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Audit Logs */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7000ff] pb-2 border-b border-gray-800 flex items-center gap-2">
              <Clock size={16} /> Recent Audit Activity
            </h3>
            
            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-gray-500 text-xs italic">No activity logs recorded.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="text-xs flex flex-col bg-black/30 border border-gray-900 rounded p-2.5">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span className="font-mono">{new Date(log.created_at).toLocaleString()}</span>
                      <span className="font-bold text-[#00f0ff]">{log.action}</span>
                    </div>
                    <p className="text-gray-300 font-medium leading-relaxed">{log.details}</p>
                    {log.ip_address && (
                      <span className="text-[9px] text-gray-600 font-mono mt-1">IP ADDR: {log.ip_address}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Login History */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7000ff] pb-2 border-b border-gray-800 flex items-center gap-2">
              <History size={16} /> Authentication Logs
            </h3>
            
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {loginHistory.length === 0 ? (
                <p className="text-gray-500 text-xs italic">No login logs recorded.</p>
              ) : (
                loginHistory.map((hist) => (
                  <div key={hist.id} className="text-xs flex justify-between items-center p-2.5 bg-black/20 rounded border border-gray-900">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-gray-500">{new Date(hist.created_at).toLocaleString()}</span>
                      <span className="text-gray-400 font-medium text-[11px] truncate max-w-xs" title={hist.user_agent}>
                        {hist.user_agent ? hist.user_agent.split(" ").slice(0, 3).join(" ") : 'Generic Browser'}
                      </span>
                      {hist.ip_address && (
                        <span className="text-[9px] text-gray-600 font-mono">IP: {hist.ip_address}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span 
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${hist.status === 'Success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                      >
                        {hist.status}
                      </span>
                      {hist.failure_reason && (
                        <p className="text-[10px] text-red-500 mt-1">{hist.failure_reason}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <NotificationToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </motion.div>
  );
};

export default Settings;
