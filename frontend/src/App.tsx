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
      <div className="min-h-screen bg-bg text-fintech-secondary flex items-center justify-center text-xs font-tt">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Authenticating session...</span>
        </div>
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
      <div className="min-h-screen bg-bg text-fintech-secondary flex items-center justify-center text-xs font-tt">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Authenticating admin session...</span>
        </div>
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

  const isAuthOrAdminRoute = location.pathname.startsWith('/admin-panel') || 
                              location.pathname === '/signin' || 
                              location.pathname === '/login' || 
                              location.pathname === '/register';

  return (
    <div className="min-h-screen bg-bg text-fintech-primary flex flex-col font-sans selection:bg-accent selection:text-bg">
      {!isAuthOrAdminRoute && (
        <Navbar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
      
      <main className="flex-1 pb-8">
        <Routes>
          <Route path="/signin" element={<StudentAuthPage />} />
          <Route path="/login" element={<StudentAuthPage />} />
          <Route path="/register" element={<StudentAuthPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedStudentRoute>
                <StudentChatPage activeTab={activeTab} />
              </ProtectedStudentRoute>
            } 
          />
          <Route 
            path="/search" 
            element={
              <ProtectedStudentRoute>
                <StudentChatPage activeTab="search" />
              </ProtectedStudentRoute>
            } 
          />
          <Route 
            path="/products" 
            element={
              <ProtectedStudentRoute>
                <StudentChatPage activeTab="search" />
              </ProtectedStudentRoute>
            } 
          />
          <Route 
            path="/shops" 
            element={
              <ProtectedStudentRoute>
                <StudentChatPage activeTab="search" />
              </ProtectedStudentRoute>
            } 
          />
          <Route 
            path="/reservations" 
            element={
              <ProtectedStudentRoute>
                <StudentChatPage activeTab="reservations" />
              </ProtectedStudentRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedStudentRoute>
                <StudentChatPage activeTab="profile" />
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
        <footer className="border-t border-surface-border py-6 text-center text-xs text-fintech-secondary bg-bg-dark/60 font-tt">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-tt-demibold text-fintech-primary">CampusFind</span> • ITER College Hyperlocal Marketplace
            </div>
            <div className="flex items-center gap-4 text-fintech-secondary">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                Live Node
              </span>
              <span>•</span>
              <span>WhatsApp Notification Engine</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <MainContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
