import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, MessageSquare, ShoppingBag, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC<{ 
  activeTab?: string;
  setActiveTab?: (tab: 'search' | 'reservations' | 'profile') => void;
}> = ({ activeTab = 'search', setActiveTab }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (location.pathname.startsWith('/admin-panel') || location.pathname === '/signin') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Branding */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">CampusFind</span>
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
              <MapPin className="w-3 h-3 text-indigo-400" />
              <span>ITER College</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
            </div>
          </div>
        </Link>

        {/* Center Student Navigation Links */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab && setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'search' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Search & Reserve</span>
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('reservations')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'reservations' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>My Reservations</span>
          </button>

          <button
            onClick={() => setActiveTab && setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'profile' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </nav>

        {/* Right Student Account & Sign Out */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold">{user.full_name || user.username}</span>
                <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                  Student
                </span>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
