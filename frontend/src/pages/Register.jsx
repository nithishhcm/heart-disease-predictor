import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic client-side validation
    if (formData.username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Register
      await api.post('/register', {
        username: formData.username.trim(),
        email:    formData.email.trim(),
        password: formData.password,
      });

      setSuccess('Account created! Logging you in…');

      // Step 2: Auto-login
      const loginData = new URLSearchParams();
      loginData.append('username', formData.username.trim());
      loginData.append('password', formData.password);

      const res = await api.post('/login', loginData);
      localStorage.setItem('token', res.data.access_token);
      navigate('/dashboard');

    } catch (err) {
      // No response at all = server not running
      if (!err.response) {
        setError('Cannot reach the server. Please try again later.');
        setLoading(false);
        return;
      }

      // 5xx = server crashed
      if (err.response.status >= 500) {
        setError(`Server error (${err.response.status}). Check the backend terminal for details.`);
        setLoading(false);
        return;
      }

      const detail = err.response?.data?.detail;

      // Username or email already taken → redirect to login
      if (
        typeof detail === 'string' &&
        (detail.toLowerCase().includes('username already') ||
         detail.toLowerCase().includes('email already'))
      ) {
        setError(`${detail} — redirecting you to login…`);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="glass-panel p-8 relative overflow-hidden">
        {/* Subtle rotating glow */}
        <div
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(180,0,0,0.12) 0%, transparent 70%)',
            animation: 'spin 22s linear infinite',
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-[rgba(0,240,255,0.1)] rounded-full mb-4 border border-[rgba(0,240,255,0.3)]">
              <Activity className="text-[#00f0ff]" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-center neon-text-primary mb-2">Initialize User</h2>
            <p className="text-gray-400 text-sm">Create your AI secure credentials</p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-2 bg-red-900/30 border border-red-700/60 text-red-200 p-3 rounded-lg mb-5 text-sm"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-2 bg-green-900/30 border border-green-700/60 text-green-200 p-3 rounded-lg mb-5 text-sm"
              >
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-400" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {/* Username */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon size={18} className="text-[#00f0ff]" />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field w-full pl-10 pr-4 py-3 rounded-lg text-sm"
                placeholder="Agent ID (Username)"
                autoComplete="new-password"
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-[#00f0ff]" />
              </div>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field w-full pl-10 pr-4 py-3 rounded-lg text-sm"
                placeholder="Secure Comm Link (Email)"
                autoComplete="new-password"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-[#7000ff]" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field w-full pl-10 pr-4 py-3 rounded-lg text-sm"
                placeholder="Passcode (min. 6 chars)"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neon-button w-full py-3 rounded-lg font-bold tracking-widest uppercase text-sm mt-4 flex justify-center items-center gap-2"
            >
              {loading ? <Activity className="animate-spin" size={18} /> : 'Establish Connection'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-[#00f0ff] hover:text-white transition-colors">
              Authenticate
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;
