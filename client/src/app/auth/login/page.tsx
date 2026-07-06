'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../utils/api';
import { ShieldAlert, ArrowRight, Chrome } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('miracle_access_token', data.accessToken);
      localStorage.setItem('miracle_refresh_token', data.refreshToken);
      localStorage.setItem('miracle_user_role', data.user.role);

      const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      router.push(redirectPath);
      // Force page refresh to update header state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginMock = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google-login', {
        email: 'google_user@gmail.com',
        firstName: 'Google',
        lastName: 'Client',
      });
      localStorage.setItem('miracle_access_token', data.accessToken);
      localStorage.setItem('miracle_refresh_token', data.refreshToken);
      localStorage.setItem('miracle_user_role', data.user.role);

      const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      router.push(redirectPath);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch {
      setError('Google Sign-in failed. Server offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-20 flex flex-col justify-center min-h-[70vh]">
      <div className="bg-white dark:bg-luxury-darkCard border border-luxury-border dark:border-luxury-darkBorder p-8 rounded-luxury shadow-luxury space-y-6">
        
        <div className="text-center space-y-1">
          <span className="font-serif text-2xl font-semibold tracking-[4px]">MIRACLE</span>
          <p className="text-xs text-luxury-muted dark:text-luxury-darkMuted tracking-widest font-semibold pt-1">Sign In</p>
        </div>

        {error && (
          <div className="p-3 bg-luxury-danger/10 text-luxury-danger border border-luxury-danger/20 rounded-luxury text-xs font-semibold flex items-center space-x-2">
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
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
            <div className="flex justify-between items-baseline">
              <label className="text-luxury-muted">Password</label>
              <Link href="/auth/forgot" className="text-[10px] text-luxury-gold hover:text-luxury-text">Forgot?</Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border border-luxury-border dark:border-luxury-darkBorder rounded-luxury px-3 py-2.5 outline-none focus:border-luxury-gold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-luxury-text hover:bg-luxury-gold text-white text-xs font-bold tracking-widest rounded-luxury transition-all"
          >
            {loading ? 'Authorizing...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-luxury-border dark:border-luxury-darkBorder"></div>
          <span className="flex-shrink mx-4 text-[10px] text-luxury-muted tracking-wider font-semibold">or</span>
          <div className="flex-grow border-t border-luxury-border dark:border-luxury-darkBorder"></div>
        </div>

        <button
          onClick={handleGoogleLoginMock}
          className="w-full py-3 border border-luxury-border dark:border-luxury-darkBorder rounded-luxury text-xs font-bold tracking-wider flex items-center justify-center space-x-2 hover:border-luxury-gold transition-colors"
        >
          <Chrome size={14} />
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-[10px] text-luxury-muted font-bold tracking-wider pt-2">
          New to Miracle?{' '}
          <Link href="/auth/register" className="text-luxury-gold hover:text-luxury-text transition-colors">
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
}
