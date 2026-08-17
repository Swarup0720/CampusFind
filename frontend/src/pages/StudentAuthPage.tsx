import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, User as UserIcon, Mail, Phone, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const StudentAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

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
    <div className="min-h-screen bg-[#191E29] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#01C38D]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-[#132D46] blur-[100px] pointer-events-none" />

      {/* Swissborg-inspired Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-[#132D46] border-2 border-[#01C38D] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(1,195,141,0.35)]">
          <ShoppingBag className="w-8 h-8 text-[#01C38D]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-tt-demibold text-[#FFFFFF] tracking-tight">
          CampusFind
        </h1>
        <p className="text-sm font-tt-demibold text-[#01C38D] mt-1.5 tracking-wide flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          The new era of Hyperlocal Campus Ordering • ITER College
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-[#132D46] border border-[#696E79]/30 rounded-card p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative z-10">
        {/* Mode Switcher */}
        <div className="flex bg-[#191E29] p-1.5 rounded-input border border-[#696E79]/30 mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-tt-demibold rounded-lg transition-all ${
              mode === 'signin' 
                ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_10px_rgba(1,195,141,0.3)]' 
                : 'text-[#696E79] hover:text-[#FFFFFF]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-tt-demibold rounded-lg transition-all ${
              mode === 'register' 
                ? 'bg-[#01C38D] text-[#191E29] shadow-[0_2px_10px_rgba(1,195,141,0.3)]' 
                : 'text-[#696E79] hover:text-[#FFFFFF]'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-tt-demibold text-[#FFFFFF]">
            {mode === 'register' ? 'Join CampusFind' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-[#696E79] font-tt mt-1">
            {mode === 'register' 
              ? 'Register with your student details to reserve items instantly.' 
              : 'Sign in to access 20 live ITER campus outlets.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-tt leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              icon={<UserIcon className="w-4 h-4" />}
              required
            />
          )}

          {mode === 'register' ? (
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@example.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />
          ) : (
            <Input
              label="Email, Username, or Phone Number"
              type="text"
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="e.g. student or 7657094157"
              icon={<UserIcon className="w-4 h-4" />}
              required
            />
          )}

          {mode === 'register' && (
            <div className="flex flex-col gap-1.5 font-tt">
              <label className="text-xs font-tt-demibold text-[#FFFFFF] tracking-wide">
                Mobile Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-xs font-tt-demibold text-[#01C38D] font-mono z-10">
                  +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="7657094157"
                  maxLength={10}
                  className="w-full bg-[#132D46] text-[#FFFFFF] placeholder-[#696E79] border border-[#696E79]/40 focus:border-[#01C38D] focus:ring-2 focus:ring-[#01C38D]/30 rounded-input pl-12 pr-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none"
                  style={{
                    backgroundColor: '#132D46',
                    color: '#FFFFFF',
                  }}
                  required
                />
              </div>
            </div>
          )}

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            required
          />

          {mode === 'register' && (
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              required
            />
          )}

          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              <span>{mode === 'register' ? 'Create Student Account' : 'Sign In to CampusFind'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#696E79]/20 text-center flex items-center justify-center gap-2 text-xs text-[#696E79] font-tt">
          <ShieldCheck className="w-4 h-4 text-[#01C38D]" />
          <span>Encrypted node connection • ITER College verified</span>
        </div>
      </div>
    </div>
  );
};
