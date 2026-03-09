import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Default: go straight to the notes app (no main/landing page).
// Main page saved for later: /landing (Landing) and /signin (SignIn).
// To restore main page as default: make "/" render <LandingOrRedirect /> again and protect /app with <ProtectedRoute>.

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/app" element={<Dashboard />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
