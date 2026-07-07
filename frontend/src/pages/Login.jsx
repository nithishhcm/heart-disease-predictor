import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Lock, User as UserIcon } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const loginData = new URLSearchParams();
      loginData.append('username', formData.username);
      loginData.append('password', formData.password);
      
      const res = await axios.post(`${API_URL}/login`, loginData);
      localStorage.setItem('token', res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
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
        {/* Glow Effects */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-[rgba(112,0,255,0.1)] to-[rgba(0,240,255,0.1)] animate-spin-slow pointer-events-none" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
        
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-[rgba(112,0,255,0.1)] rounded-full mb-4 border border-[rgba(112,0,255,0.3)]">
              <Lock className="text-[#7000ff]" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-center neon-text-secondary mb-2">System Login</h2>
            <p className="text-gray-400 text-sm">Access Medical AI Interface</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
              className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="Agent ID"
                required
              />
            </div>

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
                placeholder="Passcode"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neon-button w-full py-3 rounded-lg font-bold tracking-widest uppercase text-sm mt-4 flex justify-center items-center gap-2"
            >
              {loading ? <Activity className="animate-spin" size={18} /> : 'Authenticate'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            New personnel? <Link to="/register" className="text-[#7000ff] hover:text-white transition-colors">Request Access</Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
