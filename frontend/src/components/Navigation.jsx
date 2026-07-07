import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, LogOut, LayoutDashboard, History, Home } from 'lucide-react';

const Navigation = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const token     = localStorage.getItem('token');
  const isHome    = location.pathname === '/';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // On the home page when not logged in — show a minimal transparent nav
  if (!token) {
    return (
      <nav className={`w-full px-6 py-4 flex justify-between items-center z-50 absolute top-0 left-0
                       ${isHome ? 'bg-transparent' : 'glass-panel border-t-0 border-x-0 rounded-none relative'}`}>
        <Link to="/" className="flex items-center gap-2">
          <Activity className="text-[#00f0ff] animate-pulse" size={24} />
          <span className="text-lg font-bold tracking-wider neon-text-primary">
            NEURO<span className="text-white">HEART</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className={`text-sm transition-colors ${isActive('/login') ? 'text-[#00f0ff]' : 'text-gray-400 hover:text-white'}`}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="neon-button px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Get Started
          </Link>
        </div>
      </nav>
    );
  }

  // Logged-in nav
  return (
    <nav className="w-full glass-panel border-t-0 border-x-0 rounded-none px-6 py-4 flex justify-between items-center z-50 relative">
      <Link to="/" className="flex items-center gap-2">
        <Activity className="text-[#00f0ff] animate-pulse" size={28} />
        <span className="text-xl font-bold tracking-wider neon-text-primary">
          NEURO<span className="text-white">HEART</span>
        </span>
      </Link>

      <div className="flex items-center gap-6">
        <Link
          to="/"
          className={`flex items-center gap-2 transition-colors ${isActive('/') ? 'neon-text-primary' : 'text-gray-400 hover:text-white'}`}
        >
          <Home size={18} />
          <span className="text-sm">Home</span>
        </Link>
        <Link
          to="/dashboard"
          className={`flex items-center gap-2 transition-colors ${isActive('/dashboard') ? 'neon-text-primary' : 'text-gray-400 hover:text-white'}`}
        >
          <LayoutDashboard size={18} />
          <span className="text-sm">Dashboard</span>
        </Link>
        <Link
          to="/history"
          className={`flex items-center gap-2 transition-colors ${isActive('/history') ? 'neon-text-primary' : 'text-gray-400 hover:text-white'}`}
        >
          <History size={18} />
          <span className="text-sm">History</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors ml-4 text-sm"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
