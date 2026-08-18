import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Search, ShoppingBag, User as UserIcon, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-[#132D46]/95 backdrop-blur-md border-b border-[#696E79]/30 px-4 lg:px-8 py-3.5 transition-colors duration-200 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Branding */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#01C38D] flex items-center justify-center shadow-[0_0_15px_rgba(1,195,141,0.35)] group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5 text-[#191E29]" />
          </div>
          <div>
            <span className="font-tt-demibold text-lg tracking-tight text-[#FFFFFF]">CampusFind</span>
            <div className="flex items-center gap-1.5 text-xs text-[#01C38D] font-tt-demibold">
              <MapPin className="w-3.5 h-3.5 text-[#01C38D]" />
              <span>ITER College</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#01C38D] ml-0.5 animate-pulse" />
            </div>
          </div>
        </Link>

        {/* Center Student Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-[#191E29] p-1.5 rounded-input border border-[#696E79]/30">
          <Link
            to="/search"
            onClick={() => setActiveTab && setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-tt-demibold transition-all ${
              activeTab === 'search' || location.pathname === '/' || location.pathname === '/search' || location.pathname === '/products' || location.pathname === '/shops'
                ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_8px_rgba(1,195,141,0.3)] font-bold' 
                : 'text-[#696E79] hover:text-[#FFFFFF] hover:bg-[#132D46]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search & Reserve</span>
          </Link>

          <Link
            to="/reservations"
            onClick={() => setActiveTab && setActiveTab('reservations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-tt-demibold transition-all ${
              activeTab === 'reservations' || location.pathname === '/reservations'
                ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_8px_rgba(1,195,141,0.3)] font-bold' 
                : 'text-[#696E79] hover:text-[#FFFFFF] hover:bg-[#132D46]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>My Reservations</span>
          </Link>

          <Link
            to="/profile"
            onClick={() => setActiveTab && setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-tt-demibold transition-all ${
              activeTab === 'profile' || location.pathname === '/profile'
                ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_8px_rgba(1,195,141,0.3)] font-bold' 
                : 'text-[#696E79] hover:text-[#FFFFFF] hover:bg-[#132D46]'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile</span>
          </Link>
        </nav>

        {/* Right Student Account & Sign Out */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="px-3.5 py-1.5 rounded-xl bg-[#191E29] border border-[#696E79]/30 text-xs font-tt text-[#FFFFFF] flex items-center gap-2.5 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-[#01C38D] shadow-[0_0_6px_#01C38D]" />
                <span className="font-tt-demibold text-[#FFFFFF]">{user.full_name || user.username}</span>
                <span className="text-[10px] bg-[#132D46] text-[#01C38D] px-2 py-0.5 rounded border border-[#696E79]/30 font-tt-demibold">
                  Student
                </span>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-2.5 rounded-xl bg-[#191E29] hover:bg-rose-950/60 text-[#696E79] hover:text-rose-300 border border-[#696E79]/30 hover:border-rose-800/60 transition-colors"
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
