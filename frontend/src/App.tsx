import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StudentAuthPage } from './pages/StudentAuthPage';
import { StudentChatPage } from './pages/StudentChatPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminPanel } from './pages/AdminPanel';

// Protected Student Route Guard
const ProtectedStudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs font-mono">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

// Protected Admin Route Guard
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs font-mono">
        Authenticating admin session...
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && !user.username.includes('admin'))) {
    return <Navigate to="/admin-panel/login" replace />;
  }

  return <>{children}</>;
};

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'reservations' | 'profile'>('search');
  const location = useLocation();

  const isAuthOrAdminRoute = location.pathname.startsWith('/admin-panel') || location.pathname === '/signin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {!isAuthOrAdminRoute && (
        <Navbar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
      
      <main className="flex-1 pb-8">
        <Routes>
          <Route path="/signin" element={<StudentAuthPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedStudentRoute>
                <StudentChatPage activeTab={activeTab} />
              </ProtectedStudentRoute>
            } 
          />
          <Route path="/admin-panel/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin-panel/*" 
            element={
              <ProtectedAdminRoute>
                <AdminPanel />
              </ProtectedAdminRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAuthOrAdminRoute && (
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-300">CampusFind</span> • ITER College Hyperlocal Marketplace
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Cloud Database Active</span>
              <span>•</span>
              <span>WhatsApp Notifications Engine</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <MainContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
