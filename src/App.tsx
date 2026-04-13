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
      <Route path="/" element={<Home />} />
      <Route path="/:slug" element={<Adventure />} />
      <Route path="/:slug/sessao/:sessionId" element={<Adventure />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<Login />} />
      <Route path="/admin/setup" element={<Setup />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/chronicle/:id" element={<ChronicleEditor />} />
      
      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
