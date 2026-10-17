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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { BrandMark } from '@/components/common/BrandMark';
import { springSnappy, springSoft } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { getBadgeClasses, type StatusType } from '../../utils/colors';

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

// The real workflow every product moves through (see README "Status workflow").
// The login panel walks a sample product through it.
const WORKFLOW: { type: StatusType; label: string; hint: string }[] = [
  { type: 'order-placed', label: 'Order Placed', hint: 'Log the order, or import it from the retailer page' },
  { type: 'add-review', label: 'Add Review', hint: 'Delivered. Time to write the review' },
  { type: 'review-pending', label: 'Review Pending', hint: 'Submitted and waiting to go live' },
  { type: 'send-screenshot', label: 'Send Screenshot', hint: 'Live. Send proof to the seller' },
  { type: 'refund-pending', label: 'Refund Pending', hint: 'Waiting for the payment to land' },
  { type: 'complete', label: 'Complete', hint: 'Refund matched to its transaction' },
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
    const id = setInterval(() => setActiveStep(s => (s + 1) % WORKFLOW.length), 2400);
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
      <div className="hidden lg:flex lg:w-[52%] gradient-bg relative overflow-hidden flex-col justify-center px-14 py-16 text-white">
        {/* One soft light source, top-left; no motion behind content */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-white/[0.06] blur-3xl" />

        <div className="relative z-10 max-w-md">
          <div className="mb-12 flex items-center gap-2.5">
            <BrandMark className="h-8 w-8 rounded-[0.5625rem] bg-none bg-white/15 shadow-none" />
            <span className="text-[1.0625rem] font-semibold tracking-[-0.015em]">Review Club</span>
          </div>

          <h2 className="font-display text-large-title font-bold text-white">
            Every order,<br />from purchase to refund.
          </h2>
          <p className="mt-3 text-body text-white/70">
            Track what you ordered, where each review stands, and what has been paid back.
          </p>

          {/* Sample product moving through the workflow */}
          <div className="mt-10 rounded-2xl bg-card p-4 text-card-foreground shadow-navy-lg">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium">Sony WH-1000XM5 Headphones</p>
                <div className="mt-1.5 h-[1.375rem]">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={WORKFLOW[activeStep].type}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={springSnappy}
                      className={cn(getBadgeClasses(WORKFLOW[activeStep].type), 'inline-flex')}
                    >
                      {WORKFLOW[activeStep].label}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 tabular-nums">
              <div>
                <p className="text-caption text-muted-foreground">Paid</p>
                <p className="text-body font-medium text-destructive">$348.00</p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Received</p>
                <p className={cn('text-body font-medium transition-colors duration-300', activeStep === WORKFLOW.length - 1 ? 'text-brand' : 'text-foreground')}>
                  {activeStep === WORKFLOW.length - 1 ? '$348.00' : '$0.00'}
                </p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Delta</p>
                <p className={cn('text-body font-semibold transition-colors duration-300', activeStep === WORKFLOW.length - 1 ? 'text-muted-foreground' : 'text-destructive')}>
                  {activeStep === WORKFLOW.length - 1 ? '$0.00' : '-$348.00'}
                </p>
              </div>
            </div>
          </div>

          {/* The steps themselves; the current one is lit */}
          <ol className="mt-6 space-y-0.5" aria-label="How a product moves through Review Club">
            {WORKFLOW.map((step, i) => {
              const done = i < activeStep;
              const current = i === activeStep;
              return (
                <li key={step.type} className="relative flex items-center gap-3 rounded-xl px-3 py-2">
                  {current && (
                    <motion.span layoutId="login-step" transition={springSoft} className="absolute inset-0 rounded-xl bg-white/10" />
                  )}
                  <span
                    className={cn(
                      'relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-semibold transition-colors duration-300',
                      done ? 'bg-white/80 text-header' : current ? 'bg-white text-header' : 'bg-white/10 text-white/60'
                    )}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="relative min-w-0">
                    <span className={cn('block text-label font-medium transition-colors duration-300', current ? 'text-white' : 'text-white/60')}>
                      {step.label}
                    </span>
                    {current && <span className="block truncate text-caption text-white/60">{step.hint}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-10 bg-background">

        {/* Phone: app icon and name, like a native sign-in screen */}
        <div className="lg:hidden mb-8 flex flex-col items-center text-center">
          <BrandMark className="h-14 w-14 rounded-[0.875rem] [&_svg]:h-7 [&_svg]:w-7" />
          <h1 className="mt-4 font-display text-page-title font-bold">Review Club</h1>
          <p className="mt-1 text-body text-muted-foreground">Every order, from purchase to refund.</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className={typography.pageTitle}>
              {showForgotPassword ? 'Reset password' : isSignUp ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="text-muted-foreground text-body mt-1.5">
              {showForgotPassword
                ? 'We will email you a link to choose a new password'
                : isSignUp
                  ? 'Start tracking your review orders today'
                  : 'Sign in to view your products and reviews'}
            </p>
          </div>

          {/* Mobile heading: only when it says something the icon block doesn't */}
          {(showForgotPassword || isSignUp) && (
            <div className="lg:hidden mb-6 text-center">
              <h2 className={typography.modalTitle}>
                {showForgotPassword ? 'Reset password' : 'Create account'}
              </h2>
            </div>
          )}

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className={`${typography.label} mb-1.5 block`}>
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 rounded-xl px-4 md:text-base"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-destructive-container text-destructive px-4 py-3 rounded-xl text-label">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-brand/10 text-brand px-4 py-3 rounded-xl text-label">
                  {successMessage}
                </div>
              )}

              <Button
                size="lg"
                type="submit"
                disabled={loading}
                className="w-full text-[1.0625rem] font-semibold"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>

              <p className="text-center text-body text-muted-foreground">
                <button
                  type="button"
                  onClick={resetAuthView}
                  className="text-brand font-semibold hover:underline active:opacity-60"
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
                  <label className={`${typography.label} mb-1.5 block`}>
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 rounded-xl px-4 md:text-base"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
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
                        className="text-label text-brand font-medium hover:underline active:opacity-60"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 rounded-xl px-4 md:text-base"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="bg-destructive-container text-destructive px-4 py-3 rounded-xl text-label">
                    {error}
                  </div>
                )}

                <Button
                  size="lg"
                  type="submit"
                  disabled={loading}
                  className="w-full text-[1.0625rem] font-semibold"
                >
                  {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className={`${typography.caption} text-muted-foreground`}>or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google */}
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="pressable w-full h-12 px-4 bg-card text-foreground rounded-full hover:bg-secondary/60 active:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium text-[1.0625rem] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-input/50"
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
              <p className="mt-5 text-center text-body text-muted-foreground">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMessage(''); }}
                  className="text-brand font-semibold hover:underline active:opacity-60"
                >
                  {isSignUp ? 'Sign in' : 'Create one'}
                </button>
              </p>
            </>
          )}

          {/* Footer */}
          <div className="mt-10 text-center">
            <a
              href="https://www.kshitijstudio.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 ${typography.caption} text-muted-foreground hover:text-primary transition-colors`}
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
