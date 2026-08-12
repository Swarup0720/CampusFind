import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, User as UserIcon, Mail, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const StudentAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register'>('register');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (mode === 'register') {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return false;
      }
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please check again.');
        return false;
      }
    } else {
      if (!loginIdentifier.trim()) {
        setError('Please enter your email, username, or phone number.');
        return false;
      }
      if (!password) {
        setError('Please enter your password.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateInputs()) return;

    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await authService.registerStudent({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\D/g, ''),
          password: password
        });
        setUser(res.user);
        navigate('/');
      } else {
        const res = await authService.login(loginIdentifier.trim(), password);
        setUser(res.user);
        navigate('/');
      }
    } catch (err: any) {
      const respData = err.response?.data;
      if (respData) {
        if (respData.email) {
          setError(Array.isArray(respData.email) ? respData.email[0] : respData.email);
        } else if (respData.phone) {
          setError(Array.isArray(respData.phone) ? respData.phone[0] : respData.phone);
        } else if (respData.detail) {
          setError(respData.detail);
        } else if (respData.non_field_errors) {
          setError(respData.non_field_errors[0]);
        } else {
          setError('Authentication failed. Please check your credentials.');
        }
      } else {
        setError('Connection error. Please make sure the backend server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Branding Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/30">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">CampusFind</h1>
        <p className="text-sm text-indigo-300 font-medium mt-1">
          Find it. Reserve it. Pick it up. • ITER College
        </p>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Toggle Bar */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Student Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">
            {mode === 'register' ? 'Welcome to CampusFind' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'register' 
              ? 'Register your student account to search live campus inventory' 
              : 'Sign in with your email or phone number'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Kumar"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {mode === 'register' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email, Username, or Phone</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="rahul@example.com or 9876543210"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile Phone Number</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-xs font-bold text-indigo-400 font-mono">+91</div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : (mode === 'register' ? 'Continue to Marketplace' : 'Sign In')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Your information is securely stored in ITER College database.</span>
        </div>
      </div>
    </div>
  );
};
