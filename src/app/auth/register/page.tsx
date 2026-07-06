'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../utils/api';
import { ShieldAlert } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        referralCode: referralCode || undefined,
      });

      localStorage.setItem('miracle_access_token', data.accessToken);
      localStorage.setItem('miracle_refresh_token', data.refreshToken);
      localStorage.setItem('miracle_user_role', data.user.role);

      const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      router.push(redirectPath);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16 flex flex-col justify-center min-h-[85vh]">
      <div className="bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder p-8 rounded-luxury shadow-luxury space-y-6">
        
        <div className="text-center space-y-1">
          <span className="font-serif text-2xl font-semibold tracking-[4px]">MIRACLE</span>
          <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted tracking-widest font-semibold pt-1">Create Account</p>
        </div>

        {error && (
          <div className="p-3 bg-luxury-danger/10 text-luxury-danger border border-luxury-danger/20 rounded-luxury text-xs font-semibold flex items-center space-x-2">
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-luxury-muted">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Julian"
                className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-luxury-muted">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Gray"
                className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-luxury-muted">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-luxury-muted">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-luxury-muted">Referral Code (Optional)</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="MRC-XXXXXX"
              className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
            />
            <span className="text-[9px] text-luxury-muted tracking-wider block pt-1">
              Enter a friend's referral link to earn 50 additional welcome reward points.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-luxury-text hover:bg-luxury-gold text-white text-xs font-bold tracking-widest rounded-luxury transition-all"
          >
            {loading ? 'Creating Profile...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-[10px] text-luxury-muted font-bold tracking-wider pt-2">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-luxury-gold hover:text-luxury-text transition-colors">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}
