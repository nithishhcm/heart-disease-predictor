import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NeuralBackground from './components/NeuralBackground';
import Navigation from './components/Navigation';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
        {/* Animated Background */}
        <NeuralBackground />
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navigation />
          
          <main className="flex-grow flex flex-col">
            <Routes>
              {/* Home page — public landing */}
              <Route path="/" element={<Home />} />

              {/* Auth pages */}
              <Route path="/login"    element={<div className="flex-grow flex items-center justify-center p-4"><Login /></div>} />
              <Route path="/register" element={<div className="flex-grow flex items-center justify-center p-4"><Register /></div>} />

              {/* Protected pages */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div className="flex-grow flex items-center justify-center p-4">
                      <Dashboard />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <div className="flex-grow flex items-center justify-center p-4">
                      <History />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <div className="flex-grow flex items-center justify-center p-4">
                      <Analytics />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <div className="flex-grow flex items-center justify-center p-4">
                      <Settings />
                    </div>
                  </ProtectedRoute>
                }
              />


              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
