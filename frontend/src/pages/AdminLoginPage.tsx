import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      const currentUser = await authService.getCurrentUser();
      if (currentUser.role !== 'ADMIN' && !currentUser.username.includes('admin')) {
        setError("Access denied. Admin credentials required.");
        authService.logout();
      } else {
        navigate('/admin-panel/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#191E29] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#01C38D]/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#132D46] border border-[#696E79]/30 rounded-card p-8 shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#191E29] border-2 border-[#01C38D] flex items-center justify-center mx-auto mb-3 text-[#01C38D] shadow-[0_0_20px_rgba(1,195,141,0.35)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-tt-demibold text-[#FFFFFF] tracking-tight">CAMPUSFIND ADMIN</h1>
          <p className="text-xs font-tt-demibold text-[#01C38D] mt-1 tracking-wide">Platform Operations & Control Hub</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-tt text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Admin Username / Email"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            icon={<UserIcon className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              <span>{loading ? 'Authenticating...' : 'Access Admin Control'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-4 border-t border-[#696E79]/20 text-center">
          <p className="text-[11px] text-[#696E79] font-tt">
            Strictly restricted to authorized CampusFind operations personnel.
          </p>
        </div>
      </div>
    </div>
  );
};
