import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { typography } from '../../utils/typography';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

function getAuthErrorMessage(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in Firebase. Enable it under Authentication → Sign-in method → Google.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Add it under Firebase Authentication → Settings → Authorized domains.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

const StarSVG = ({ filled, size = 'sm' }: { filled: boolean; size?: 'xs' | 'sm' }) => (
  <svg
    className={`${size === 'xs' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} ${filled ? 'text-yellow-400' : 'text-white/20'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const STEPS = [
  {
    title: 'Add Products',
    desc: 'Paste an Amazon ASIN or URL to start tracking',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    title: 'Track Reviews',
    desc: 'New reviews are captured and categorized daily',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    title: 'Get Insights',
    desc: 'Export reports and analyze sentiment trends',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const REVIEWS = [
  { name: 'Sarah M.', rating: 5, text: 'Absolutely love this product!', time: '2h ago' },
  { name: 'James K.', rating: 4, text: 'Great quality, fast shipping.', time: '5h ago' },
  { name: 'Priya S.', rating: 5, text: 'Exceeded my expectations!', time: '1d ago' },
];

const RATING_BARS = [
  { label: '5★', width: '68%', delay: '0.3s' },
  { label: '4★', width: '18%', delay: '0.5s' },
  { label: '3★', width: '8%',  delay: '0.7s' },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      setLoading(false);
      onLoginSuccess();
    }
  }, [user, authLoading, onLoginSuccess]);

  useEffect(() => {
    const id = setInterval(() => setActiveStep(s => (s + 1) % 3), 2500);
    return () => clearInterval(id);
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      setSuccessMessage('Password reset email sent. Check your inbox and spam folder.');
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetAuthView = () => {
    setShowForgotPassword(false);
    setIsSignUp(false);
    setError('');
    setSuccessMessage('');
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ─── LEFT PANEL (desktop only) ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] gradient-bg relative overflow-hidden flex-col justify-center px-12 py-16 text-white">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 w-[28rem] h-[28rem] rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 w-56 h-56 rounded-full bg-[#006a68]/15 blur-2xl" />

        <div className="relative z-10 max-w-md">
          {/* Brand mark */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <StarSVG filled size="sm" />
            </div>
            <span className={`${typography.overline} text-white/55`}>
              Review Club
            </span>
          </div>

          {/* Headline */}
          <h2 className={`${typography.pageTitle} mb-3`}>
            Track every review.<br />Never miss feedback.
          </h2>
          <p className={`${typography.body} text-white/55 mb-8`}>
            Monitor Amazon product reviews in real-time and turn customer feedback into actionable insights.
          </p>

          {/* Floating product card */}
          <div
            className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 mb-4"
            style={{ animation: 'float 4s ease-in-out infinite' }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">Sony WH-1000XM5</p>
                <p className="text-white/45 text-xs mt-0.5">B09XS7JWHH · Headphones</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white text-sm font-bold">$348</p>
                <p className="text-[#86f4f1] text-xs font-semibold mt-0.5">+12 new</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => <StarSVG key={i} filled={i <= 4} size="sm" />)}
              </div>
              <span className="text-white text-xs font-semibold">4.3</span>
              <span className="text-white/35 text-xs">(1,247 reviews)</span>
            </div>

            <div className="space-y-1.5">
              {RATING_BARS.map(({ label, width, delay }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`${typography.caption} text-white/40 w-5`}>{label}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400/70 rounded-full"
                      style={{ width, transformOrigin: 'left', animation: `barGrow 1.2s ease-out ${delay} both` }}
                    />
                  </div>
                  <span className={`${typography.caption} text-white/35 w-6 text-right`}>{width}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review feed */}
          <div className="space-y-2 mb-8">
            {REVIEWS.map((r, i) => (
              <div
                key={i}
                className="bg-white/10 border border-white/10 rounded-xl p-3 flex items-start gap-3"
                style={{ animation: `slideInFromRight 0.5s ease-out ${0.5 + i * 0.15}s both` }}
              >
                <div className={`w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ${typography.captionStrong}`}>
                  {r.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white text-xs font-semibold">{r.name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, j) => <StarSVG key={j} filled size="xs" />)}
                    </div>
                    <span className={`${typography.caption} text-white/30 ml-auto flex-shrink-0`}>{r.time}</span>
                  </div>
                  <p className="text-white/55 text-xs truncate">{r.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Step cycle */}
          <div className="space-y-2">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 ${
                  activeStep === i ? 'bg-white/[0.12]' : 'opacity-50'
                }`}
                style={{ animation: `fadeInUp 0.5s ease-out ${1.0 + i * 0.12}s both` }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                  activeStep === i ? 'bg-white/25' : 'bg-white/10'
                }`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{step.title}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{step.desc}</p>
                </div>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-500"
                  style={{
                    backgroundColor: activeStep === i ? '#86f4f1' : 'transparent',
                    animation: activeStep === i ? 'pulseDot 1.5s ease-in-out infinite' : 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 py-10 sm:px-10 bg-[#fbf9f3]">

        {/* Mobile gradient banner */}
        <div className="lg:hidden w-full max-w-sm mb-8">
          <div className="gradient-bg rounded-2xl p-5 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <StarSVG filled size="sm" />
              <span className={`${typography.overline} text-white/55`}>
                Review Club
              </span>
            </div>
            <h1 className={`${typography.modalTitle}`}>Review Club</h1>
            <p className="text-white/55 text-xs mt-1">Track reviews. Stay ahead.</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className={`${typography.pageTitle} text-[#022448]`}>
              {showForgotPassword ? 'Reset password' : isSignUp ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="text-[#74777f] text-sm mt-1.5">
              {showForgotPassword
                ? 'We will email you a link to choose a new password'
                : isSignUp
                  ? 'Start tracking your Amazon products today'
                  : 'Sign in to view your products and reviews'}
            </p>
          </div>

          {/* Mobile heading */}
          <div className="lg:hidden mb-6 text-center">
            <h2 className={`${typography.modalTitle} text-[#022448]`}>
              {showForgotPassword ? 'Reset password' : isSignUp ? 'Create account' : 'Sign in'}
            </h2>
          </div>

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className={`${typography.label} mb-2`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#e4e2dd] border-0 text-[#1b1c19] placeholder-[#74777f] focus:outline-none focus:ring-2 focus:ring-[#022448] text-base transition-all"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-[#ffdad6] text-[#ba1a1a] px-4 py-3 rounded-2xl text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-[#006a68]/10 text-[#006a68] px-4 py-3 rounded-2xl text-sm">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3.5 bg-gradient-to-br from-[#022448] to-[#1e3a5f] text-white rounded-full hover:from-[#1e3a5f] hover:to-[#022448] focus:outline-none focus:ring-2 focus:ring-[#022448] font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_16px_rgba(2,36,72,0.2)]"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <p className="text-center text-sm text-[#74777f]">
                <button
                  type="button"
                  onClick={resetAuthView}
                  className="text-[#006a68] hover:text-[#022448] font-semibold transition-colors"
                >
                  Back to sign in
                </button>
              </p>
            </form>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className={`${typography.label} mb-2`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#e4e2dd] border-0 text-[#1b1c19] placeholder-[#74777f] focus:outline-none focus:ring-2 focus:ring-[#022448] text-base transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`${typography.label}`}>
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setError('');
                          setSuccessMessage('');
                        }}
                        className="text-xs text-[#006a68] hover:text-[#022448] font-semibold transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#e4e2dd] border-0 text-[#1b1c19] placeholder-[#74777f] focus:outline-none focus:ring-2 focus:ring-[#022448] text-base transition-all"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="bg-[#ffdad6] text-[#ba1a1a] px-4 py-3 rounded-2xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3.5 bg-gradient-to-br from-[#022448] to-[#1e3a5f] text-white rounded-full hover:from-[#1e3a5f] hover:to-[#022448] focus:outline-none focus:ring-2 focus:ring-[#022448] font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_16px_rgba(2,36,72,0.2)]"
                >
                  {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-4">
                <div className="flex-1 h-px bg-[rgba(196,198,207,0.4)]" />
                <span className={`${typography.caption} text-[#74777f]`}>or</span>
                <div className="flex-1 h-px bg-[rgba(196,198,207,0.4)]" />
              </div>

              {/* Google */}
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full px-4 py-3 bg-white text-[#1b1c19] rounded-full hover:bg-[#f5f3ee] focus:outline-none focus:ring-2 focus:ring-[#022448] font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-[0_2px_8px_rgba(2,36,72,0.08)] border border-[rgba(196,198,207,0.4)]"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Toggle sign-up / sign-in */}
              <p className="mt-5 text-center text-sm text-[#74777f]">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMessage(''); }}
                  className="text-[#006a68] hover:text-[#022448] font-semibold transition-colors"
                >
                  {isSignUp ? 'Sign in' : 'Create one'}
                </button>
              </p>
            </>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-[rgba(196,198,207,0.3)] text-center">
            <a
              href="https://www.kshitijstudio.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 ${typography.caption} text-[#74777f] hover:text-[#022448] transition-colors`}
            >
              <span>Powered by</span>
              <span className="font-semibold">KshitijStudio</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
