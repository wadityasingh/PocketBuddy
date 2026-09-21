import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Shield,
  ShieldCheck,
  Sparkles,
  Check,
  Loader2,
  Smartphone,
  CheckCheck,
  Facebook,
  Instagram,
  Github,
  MessageCircle,
  Linkedin,
} from 'lucide-react';
import { StudentUser, UserAppData } from '../types';
import { BrandLogo } from './BrandLogo';
import { RadialLoader } from './RadialLoader';
import {
  safeFetchJson,
  localRegisterUser,
  localLoginUser,
  localResetPassword,
  normalizePhone,
  syncAccountToLocal,
  saveUserStoredData,
  getUserStoredData,
} from '../utils/api';

interface AuthScreenProps {
  initialMode?: 'login' | 'register';
  onAuthSuccess: (user: StudentUser, data: UserAppData, token: string, isNewUser?: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Registration Fields
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot Password Fields
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  // Snappy real-touch login loading transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionUser, setTransitionUser] = useState<StudentUser | null>(null);

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});
  };

  /**
   * Snappy ~450ms authentic native transition with real-touch radial loader
   */
  const triggerSuccessTransition = (
    user: StudentUser,
    data: UserAppData,
    token: string,
    isNewUser?: boolean
  ) => {
    setIsTransitioning(true);
    setTransitionUser(user);

    const timer = setTimeout(() => {
      onAuthSuccess(user, data, token, isNewUser);
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  };

  // -------------------------------------------------------------------------
  // Handle Login (Supports Email OR 10-Digit Mobile Number like 7307273515)
  // -------------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const errors: Record<string, string> = {};

    const cleanIdentifier = loginIdentifier.trim();
    if (!cleanIdentifier) {
      errors.loginIdentifier = 'Please enter your email or 10-digit mobile number.';
    }

    if (!loginPassword) {
      errors.loginPassword = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      // 1. First attempt server login
      const res = await safeFetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password: loginPassword,
        }),
      });

      if (res.ok && res.data && res.data.success && res.data.user) {
        const user = res.data.user;
        const token = res.data.token || `token_${user.id}_${Date.now()}`;
        const userData = res.data.data || getUserStoredData(user.id);

        // Synchronize and persist locally so data stays intact
        localStorage.setItem('smm_auth_token', token);
        localStorage.setItem('smm_current_user', JSON.stringify(user));
        syncAccountToLocal(user, loginPassword);
        saveUserStoredData(user.id, userData);

        setLoading(false);
        triggerSuccessTransition(user, userData, token, false);
        return;
      }

      // If server returned wrong password error
      if (res.data && res.data.error && res.data.error.toLowerCase().includes('password')) {
        setErrorMessage(res.data.error);
        setLoading(false);
        return;
      }

      // 2. Check local client registry for matching email or phone
      const localResult = localLoginUser(cleanIdentifier, loginPassword);
      if (localResult.success && localResult.user && localResult.token) {
        const user = localResult.user;
        const token = localResult.token;
        const userData = localResult.data || getUserStoredData(user.id);

        localStorage.setItem('smm_auth_token', token);
        localStorage.setItem('smm_current_user', JSON.stringify(user));
        saveUserStoredData(user.id, userData);

        // Background sync to server if available
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            phone: user.phone,
            password: loginPassword,
            startClean: false,
          }),
        }).catch(() => {});

        setLoading(false);
        triggerSuccessTransition(user, userData, token, false);
        return;
      }

      // If local found user but password was wrong
      if (localResult.error && localResult.error.toLowerCase().includes('password')) {
        setErrorMessage(localResult.error);
        setLoading(false);
        return;
      }

      // User not found in either system
      setErrorMessage(
        'No registered account found with this email or mobile number. Please click "Sign Up" below to create your account.'
      );
    } catch (err: any) {
      // Local fallback on unexpected network break
      const localResult = localLoginUser(cleanIdentifier, loginPassword);
      if (localResult.success && localResult.user && localResult.token) {
        const user = localResult.user;
        const token = localResult.token;
        const userData = localResult.data || getUserStoredData(user.id);

        localStorage.setItem('smm_auth_token', token);
        localStorage.setItem('smm_current_user', JSON.stringify(user));
        saveUserStoredData(user.id, userData);

        setLoading(false);
        triggerSuccessTransition(user, userData, token, false);
        return;
      }
      setErrorMessage(localResult.error || err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handle Register (Stores both Email and Mobile Number for flexible login)
  // -------------------------------------------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const errors: Record<string, string> = {};

    const cleanName = fullName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const rawPhone = regPhone;
    const cleanPhone = rawPhone.trim();

    if (!cleanName || cleanName.length < 2) {
      errors.fullName = 'Please enter your full name.';
    }

    // Email validation:
    // Accept ONLY a valid real-format email address (e.g. student@gmail.com).
    // Reject incomplete/invalid formats such as student@, student@gmail, @gmail.com.
    // Trim unnecessary spaces and validate the email before account creation.
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!cleanEmail) {
      errors.regEmail = 'Please enter your email address.';
    } else if (/\s/.test(cleanEmail) || !emailRegex.test(cleanEmail)) {
      errors.regEmail = 'Please enter a valid email address (e.g. student@gmail.com).';
    } else {
      const parts = cleanEmail.split('@');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        errors.regEmail = 'Please enter a valid email address (e.g. student@gmail.com).';
      } else {
        const [localPart, domainPart] = parts;
        if (
          localPart.startsWith('.') ||
          localPart.endsWith('.') ||
          localPart.includes('..') ||
          domainPart.startsWith('.') ||
          domainPart.endsWith('.') ||
          domainPart.includes('..') ||
          !domainPart.includes('.')
        ) {
          errors.regEmail = 'Please enter a valid email address (e.g. student@gmail.com).';
        }
      }
    }

    // Mobile Number validation:
    // Accept ONLY a valid Indian 10-digit mobile number.
    // Allow exactly 10 digits, starting with 6, 7, 8, or 9.
    // Do not allow letters, spaces, symbols, or fewer/more than 10 digits.
    // Show a clear error message if the number is invalid.
    if (!cleanPhone) {
      errors.regPhone = 'Please enter your 10-digit mobile number.';
    } else if (/[^0-9]/.test(rawPhone)) {
      errors.regPhone = 'Mobile number cannot contain letters, spaces, or symbols.';
    } else if (cleanPhone.length !== 10) {
      errors.regPhone = 'Mobile number must be exactly 10 digits.';
    } else if (!/^[6-9]/.test(cleanPhone)) {
      errors.regPhone = 'Mobile number must start with 6, 7, 8, or 9.';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.regPhone = 'Please enter a valid 10-digit Indian mobile number.';
    }

    if (!regPassword || regPassword.length < 6) {
      errors.regPassword = 'Password must be at least 6 characters.';
    }

    if (regPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreeTerms) {
      errors.terms = 'Please accept the privacy terms to continue.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const finalEmail = cleanEmail;
    const finalPhone = cleanPhone;

    try {
      // 1. Register with backend server
      const res = await safeFetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: finalEmail,
          phone: finalPhone,
          password: regPassword,
          startClean: true,
        }),
      });

      if (res.ok && res.data && res.data.success && res.data.user) {
        const user = res.data.user;
        const token = res.data.token || `token_${user.id}_${Date.now()}`;
        const initialData = res.data.data || getUserStoredData(user.id);

        localStorage.setItem('smm_auth_token', token);
        localStorage.setItem('smm_current_user', JSON.stringify(user));
        syncAccountToLocal(user, regPassword);
        saveUserStoredData(user.id, initialData);

        setLoading(false);
        triggerSuccessTransition(user, initialData, token, true);
        return;
      }

      if (res.data && res.data.error && !res.isStaticHtml) {
        setErrorMessage(res.data.error);
        setLoading(false);
        return;
      }

      // 2. Client Local Registration Fallback
      const localResult = localRegisterUser({
        name: cleanName,
        email: finalEmail,
        phone: finalPhone || '',
        password: regPassword,
      });

      if (localResult.success && localResult.user && localResult.token) {
        const user = localResult.user;
        const token = localResult.token;
        const initialData = localResult.data || getUserStoredData(user.id);

        localStorage.setItem('smm_auth_token', token);
        localStorage.setItem('smm_current_user', JSON.stringify(user));
        saveUserStoredData(user.id, initialData);

        setLoading(false);
        triggerSuccessTransition(user, initialData, token, true);
        return;
      }

      setErrorMessage(localResult.error || 'Registration could not be completed.');
    } catch (err: any) {
      const localResult = localRegisterUser({
        name: cleanName,
        email: finalEmail,
        phone: finalPhone || '',
        password: regPassword,
      });

      if (localResult.success && localResult.user && localResult.token) {
        const user = localResult.user;
        const token = localResult.token;
        const initialData = localResult.data || getUserStoredData(user.id);

        localStorage.setItem('smm_auth_token', token);
        localStorage.setItem('smm_current_user', JSON.stringify(user));
        saveUserStoredData(user.id, initialData);

        setLoading(false);
        triggerSuccessTransition(user, initialData, token, true);
        return;
      }
      setErrorMessage(localResult.error || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handle Forgot Password
  // -------------------------------------------------------------------------
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const errors: Record<string, string> = {};

    const cleanIdentifier = forgotIdentifier.trim();
    if (!cleanIdentifier) {
      errors.forgotIdentifier = 'Please enter your registered email or mobile number.';
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      errors.forgotNewPassword = 'New password must be at least 6 characters.';
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      errors.forgotConfirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      let serverResetSuccess = false;
      const res = await safeFetchJson('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          newPassword: forgotNewPassword,
        }),
      });

      if (res.ok && res.data && res.data.success) {
        serverResetSuccess = true;
      }

      // Also reset in local storage
      const localResult = localResetPassword(cleanIdentifier, forgotNewPassword);

      if (serverResetSuccess || localResult.success) {
        setSuccessMessage('Password updated successfully! Logging you in...');
        
        // Auto-login with the updated credentials
        setTimeout(async () => {
          const autoRes = await localLoginUser(cleanIdentifier, forgotNewPassword);
          if (autoRes.success && autoRes.user && autoRes.token) {
            localStorage.setItem('smm_auth_token', autoRes.token);
            localStorage.setItem('smm_current_user', JSON.stringify(autoRes.user));
            triggerSuccessTransition(autoRes.user, autoRes.data || getUserStoredData(autoRes.user.id), autoRes.token, false);
          } else {
            switchMode('login');
            setLoginIdentifier(cleanIdentifier);
            setLoginPassword('');
          }
        }, 600);
        return;
      }

      setErrorMessage(
        res.data?.error || localResult.error || 'No registered account found with this email or mobile number.'
      );
    } catch (err: any) {
      const localResult = localResetPassword(cleanIdentifier, forgotNewPassword);
      if (localResult.success) {
        setSuccessMessage('Password updated successfully! Signing you in...');
        setTimeout(() => {
          switchMode('login');
          setLoginIdentifier(cleanIdentifier);
          setLoginPassword('');
        }, 1200);
        return;
      }
      setErrorMessage(localResult.error || err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // AUTHENTIC LIGHT WEBSITE LOADING TRANSITION (< 0.5s with Real Touch Radial Loader)
  // =========================================================================
  if (isTransitioning) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-150">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <RadialLoader size={62} />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800 tracking-normal">
              {transitionUser ? `Welcome, ${transitionUser.name || 'Student'}` : 'Signing in...'}
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Loading PocketBuddy...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN AUTH INTERFACE (Inspired by Image 2 - Figma App Login Concept)
  // =========================================================================
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col justify-between items-center relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* ---------------------------------------------------------------------
          TOP ORGANIC HEADER WAVE (Inspired by Image 2 design style)
          --------------------------------------------------------------------- */}
      <div className="w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white pt-8 pb-16 px-4 sm:px-6 relative overflow-hidden shadow-lg">
        {/* Soft Organic Background Circles */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute top-10 -left-10 w-48 h-48 rounded-full bg-violet-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-52 h-52 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />

        {/* Decorative Wave SVG Divider at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none overflow-hidden leading-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-8 fill-[#f8fafc]"
          >
            <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>

        <div className="max-w-md mx-auto relative z-10">
          {/* Header Navigation & Brand */}
          <div className="flex items-center justify-between mb-4">
            {mode !== 'login' ? (
              <button
                id="auth-back-button"
                type="button"
                onClick={() => switchMode('login')}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer border border-white/20"
                title="Back to Sign In"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-9" />
            )}

            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/25 shadow-xs">
              <BrandLogo size="xs" showWordmark={true} tagline={false} variant="dark" />
            </div>

            <div className="w-9" />
          </div>

          {/* Heading and Subtitle */}
          <div className="text-center sm:text-left pt-2 pb-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {mode === 'login' && 'Sign In'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 font-medium">
              {mode === 'login' && 'Welcome back! Enter your details to continue.'}
              {mode === 'register' && 'Join PocketBuddy to manage expenses & room splits.'}
              {mode === 'forgot' && 'Enter your email or mobile to set a new password.'}
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          MAIN FORM CARD (Floating Elevated Card matching Image 2)
          --------------------------------------------------------------------- */}
      <div className="w-full max-w-md px-4 -mt-8 relative z-20 mb-8 flex-1 flex flex-col justify-start">
        
        {/* Global Error Alert */}
        {errorMessage && (
          <div
            id="auth-error-alert"
            className="w-full mb-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-sm"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              {errorMessage.includes('Sign Up') && mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="mt-1.5 inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  Create new account now <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Global Success Alert */}
        {successMessage && (
          <div
            id="auth-success-alert"
            className="w-full mb-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 shadow-sm"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-semibold flex-1">{successMessage}</p>
          </div>
        )}

        <div className="w-full bg-white rounded-[32px] p-6 sm:p-8 shadow-xl shadow-slate-200/70 border border-slate-100">
          
          {/* =================================================================
              1. SIGN IN FORM
              ================================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Field: Email or Mobile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email or Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-login-identifier"
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Email or 10-digit mobile number"
                    className={`w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
                      fieldErrors.loginIdentifier ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                    autoComplete="username"
                  />
                </div>
                {fieldErrors.loginIdentifier && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.loginIdentifier}</p>
                )}
              </div>

              {/* Field: Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className={`w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
                      fieldErrors.loginPassword ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.loginPassword && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.loginPassword}</p>
                )}
              </div>

              {/* Options Row: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                  <input
                    id="auth-login-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                      rememberMe ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-slate-50'
                    }`}
                  >
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Remember Me</span>
                </label>

                <button
                  id="auth-forgot-link"
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Primary Sign In CTA Button */}
              <button
                id="auth-login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Switch to Register */}
              <div className="text-center pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-600 font-medium">
                  Don't have an Account?{' '}
                  <button
                    id="switch-to-register-btn"
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* =================================================================
              2. CREATE ACCOUNT FORM (Supports Name, Email & Phone)
              ================================================================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-reg-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.fullName;
                          return next;
                        });
                      }
                    }}
                    placeholder="Enter full name"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
                      fieldErrors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p id="auth-reg-name-error" className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (fieldErrors.regEmail) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.regEmail;
                          return next;
                        });
                      }
                    }}
                    placeholder="student@gmail.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
                      fieldErrors.regEmail ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                </div>
                {fieldErrors.regEmail && (
                  <p id="auth-reg-email-error" className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.regEmail}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-reg-phone"
                    type="tel"
                    value={regPhone}
                    onChange={(e) => {
                      setRegPhone(e.target.value);
                      if (fieldErrors.regPhone) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.regPhone;
                          return next;
                        });
                      }
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
                      fieldErrors.regPhone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                </div>
                {fieldErrors.regPhone && (
                  <p id="auth-reg-phone-error" className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.regPhone}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (fieldErrors.regPassword) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.regPassword;
                          return next;
                        });
                      }
                    }}
                    placeholder="Create password (min 6 characters)"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
                      fieldErrors.regPassword ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.regPassword && (
                  <p id="auth-reg-password-error" className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.regPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.confirmPassword;
                          return next;
                        });
                      }
                    }}
                    placeholder="Re-enter password to confirm"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
                      fieldErrors.confirmPassword ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p id="auth-reg-confirm-password-error" className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Privacy Agreement Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    id="auth-reg-terms-check"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (fieldErrors.terms) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.terms;
                          return next;
                        });
                      }
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 mt-0.5 rounded-md flex items-center justify-center transition-colors ${
                      agreeTerms ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-slate-50'
                    }`}
                  >
                    {agreeTerms && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[11px] text-slate-600 leading-tight">
                    I agree to the <span className="font-semibold text-indigo-600">Privacy Policy</span> and keep my financial data secure
                  </span>
                </label>
                {fieldErrors.terms && (
                  <p id="auth-reg-terms-error" className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.terms}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="auth-reg-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Switch to Sign In */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600 font-medium">
                  Already have an Account?{' '}
                  <button
                    id="switch-to-login-btn"
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* =================================================================
              3. FORGOT PASSWORD FORM
              ================================================================= */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Email or Mobile <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-forgot-identifier"
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="Enter registered email or mobile number"
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                {fieldErrors.forgotIdentifier && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.forgotIdentifier}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-forgot-new-pwd"
                    type={showForgotNewPassword ? 'text' : 'password'}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.forgotNewPassword && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.forgotNewPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-forgot-confirm-pwd"
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password to confirm"
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
                {fieldErrors.forgotConfirmPassword && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.forgotConfirmPassword}</p>
                )}
              </div>

              <button
                id="auth-forgot-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </span>
                ) : (
                  <span>Reset & Sign In</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* ---------------------------------------------------------------------
          FOOTER WITH OFFICIAL LINKS & CONNECT TO DEVELOPER
          --------------------------------------------------------------------- */}
      <footer id="auth-footer" className="w-full mt-auto bg-[#0d1627] text-slate-400 py-2.5 px-4 border-t border-slate-800/80 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1">
              <span>PocketBuddy</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">&copy; {new Date().getFullYear()} PocketBuddy, Inc.</span>
          </div>

          <div className="footer-socials flex items-center gap-3 text-slate-400">
            <a
              href="https://www.facebook.com/wadityasingh"
              target="_blank"
              rel="noopener noreferrer"
              title="Facebook"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://www.instagram.com/wadityasingh"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://github.com/wadityasingh"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://wa.me/918957190542"
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://www.linkedin.com/in/aditya-singh-a84486315"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
