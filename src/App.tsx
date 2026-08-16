import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Enterprise Optimization: Route-Level Code Splitting
const LandingPage = React.lazy(() => import('@/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const Login = React.lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })));
const Dashboard = React.lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const AdminDashboard = React.lazy(() => import('@/pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const SSOCallback = React.lazy(() => import('@/pages/SSOCallback').then(module => ({ default: module.SSOCallback })));

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Router>
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">Loading modules...</div>}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
          <Route path="/reset-password" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default App;
