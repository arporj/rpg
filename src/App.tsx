import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Adventure from './pages/Adventure';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ChronicleEditor from './pages/admin/ChronicleEditor';
import Setup from './pages/admin/Setup';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/rpg" element={<Home />} />
      <Route path="/rpg/:slug" element={<Adventure />} />
      
      {/* Admin Routes */}
      <Route path="/rpg/admin" element={<Login />} />
      <Route path="/rpg/admin/setup" element={<Setup />} />
      <Route path="/rpg/admin/dashboard" element={<Dashboard />} />
      <Route path="/rpg/admin/chronicle/:id" element={<ChronicleEditor />} />
      
      {/* Redirects */}
      <Route path="/" element={<Navigate to="/rpg" replace />} />
      <Route path="*" element={<Navigate to="/rpg" replace />} />
    </Routes>
  );
}

export default App;
