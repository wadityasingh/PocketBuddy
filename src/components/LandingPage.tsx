import React, { useState } from 'react';
import {
  Wallet,
  Smartphone,
  Banknote,
  Users,
  Camera,
  Mic,
  FileText,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  PieChart,
  Bot,
  Sparkles,
  Layers,
  Home,
  History,
  BookOpen,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { formatINR } from '../utils/formatters';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onExploreTab: (tab: 'overview' | 'room' | 'history' | 'udhaar') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenRegister,
  onExploreTab,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewWalletMode, setPreviewWalletMode] = useState<'all' | 'upi' | 'cash'>('all');

  return (
    <div className="min-h-screen bg-[#fafafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Name */}
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-indigo-600 font-bold transition hover:text-indigo-700 cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onExploreTab('overview')}
              className="hover:text-slate-900 transition cursor-pointer"
            >
              My Money
            </button>
            <button
              type="button"
              onClick={() => onExploreTab('room')}
              className="hover:text-slate-900 transition cursor-pointer"
            >
              My Room
            </button>
            <button
              type="button"
              onClick={() => onExploreTab('history')}
              className="hover:text-slate-900 transition cursor-pointer"
            >
              History
            </button>
            <button
              type="button"
              onClick={() => onExploreTab('udhaar')}
              className="hover:text-slate-900 transition cursor-pointer"
            >
              Notes
            </button>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              id="landing-login-btn"
              type="button"
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Login
            </button>
            <button
              id="landing-get-started-btn"
              type="button"
              onClick={onOpenRegister}
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="landing-mobile-menu-btn"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-2 text-left rounded-lg bg-indigo-50/70 text-indigo-700 font-bold"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onExploreTab('overview');
                }}
                className="px-3 py-2 text-left rounded-lg hover:bg-slate-50 text-slate-700"
              >
                My Money
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onExploreTab('room');
                }}
                className="px-3 py-2 text-left rounded-lg hover:bg-slate-50 text-slate-700"
              >
                My Room
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onExploreTab('history');
                }}
                className="px-3 py-2 text-left rounded-lg hover:bg-slate-50 text-slate-700"
              >
                History
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onExploreTab('udhaar');
                }}
                className="px-3 py-2 text-left rounded-lg hover:bg-slate-50 text-slate-700"
              >
                Notes
              </button>
            </nav>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRegister();
                }}
                className="w-full py-2.5 text-center text-xs font-bold text-white bg-indigo-600 rounded-xl shadow-xs"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-12 sm:pb-20 border-b border-slate-200/60 bg-gradient-to-b from-white to-[#fafafc]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          {/* Quiet Trust Pill */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100/90 border border-slate-200/80 px-3.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Built specifically for college students &amp; flatmates</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12] [text-wrap:balance]">
            Manage Your Money. <span className="text-indigo-600">Together.</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed [text-wrap:balance]">
            PocketBuddy helps students manage pocket money, track personal expenses and split shared expenses with roommates.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="hero-get-started-btn"
              type="button"
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-explore-btn"
              type="button"
              onClick={() => onExploreTab('overview')}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-bold text-sm transition cursor-pointer"
            >
              Explore PocketBuddy
            </button>
          </div>

          {/* Real-Product Dashboard Preview Card */}
          <div className="pt-8 sm:pt-12 text-left max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
              {/* Fake Chrome Bar */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="text-[11px] font-bold text-slate-500 ml-2">
                    PocketBuddy Student Dashboard Preview
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real Calculations</span>
                </div>
              </div>

              {/* Realistic Dashboard Interior */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* 4 Financial Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="text-[10px] font-bold text-slate-500">Monthly Pocket Money</div>
                    <div className="text-base sm:text-xl font-black text-slate-900 mt-1">₹8,000</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Starting allowance</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="text-[10px] font-bold text-slate-500">Available Balance</div>
                    <div className="text-base sm:text-xl font-black text-indigo-700 mt-1">₹7,830</div>
                    <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">Ready to spend</div>
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/60">
                    <div className="text-[10px] font-bold text-indigo-800">UPI Balance</div>
                    <div className="text-base sm:text-xl font-black text-indigo-900 mt-1">₹5,880</div>
                    <div className="text-[10px] text-indigo-700 mt-0.5">Google Pay / PhonePe</div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                    <div className="text-[10px] font-bold text-emerald-800">Cash Balance</div>
                    <div className="text-base sm:text-xl font-black text-emerald-900 mt-1">₹1,950</div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Physical wallet</div>
                  </div>
                </div>

                {/* Quick Split & Room Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Left: Who Owes Whom */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Room 302 · Who Owes Whom</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">3 Roommates</span>
                    </div>

                    <div className="space-y-1.5 pt-1 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-700 font-medium">Aman owes You</span>
                        <span className="font-bold text-emerald-600">+₹90</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-700 font-medium">Rahul owes You</span>
                        <span className="font-bold text-emerald-600">+₹30</span>
                      </div>
                      <div className="text-[10px] text-slate-500 pt-0.5">
                        Shared expenses split automatically (e.g. WiFi ₹300, Milk ₹90, Chicken ₹150)
                      </div>
                    </div>
                  </div>

                  {/* Right: AI Receipt & Voice Preview */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>AI Instant Entry</span>
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600">Gemini Powered</span>
                    </div>

                    <div className="space-y-1.5 pt-1 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-slate-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-800">Scan UPI Screenshot</span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            Extracts merchant, ₹ amount, payment mode, and date instantly
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <Mic className="w-4 h-4 text-slate-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-800">Voice Expense</span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            &ldquo;Spent 50 rupees on tea using cash&rdquo; &rarr; Saved in 1 tap
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Fintech Features Section */}
      <section className="py-12 sm:py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight [text-wrap:balance]">
              Everything a student needs to survive the semester
            </h2>
            <p className="text-sm text-slate-600">
              Clean, reliable financial tracking without ads, confusing crypto schemes, or fake statistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 bg-[#fafafc] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Separate UPI &amp; Cash Wallets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Never mix up your phone UPI balance with physical hostel cash. Record cash snacks and UPI bills separately so you always know exactly what is in your pocket.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 bg-[#fafafc] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Roommate Splits &amp; Who Owes Whom</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create a room for your flat or hostel wing. Add shared groceries, Wi-Fi, electricity, or cook expenses. PocketBuddy calculates the exact net settlements with zero drama.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 bg-[#fafafc] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Printable Statement PDF Export</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download structured Personal and Room Expense Statements. Show your parents a clean, verified expense breakdown or share room balance sheets directly on WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Realistic Student Scenarios */}
      <section className="py-12 sm:py-16 bg-[#fafafc] border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900">
              Designed for real campus life
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              How students use PocketBuddy every single day
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-700">
                <strong className="text-slate-900">Month-End Safe Daily Cap:</strong> Know exactly how much you can spend per day to ensure your pocket money survives until the 30th.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-700">
                <strong className="text-slate-900">Flatmate Transparency:</strong> Everyone sees who bought the water jar or gas cylinder, who joined the room, and when someone paid.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-700">
                <strong className="text-slate-900">Quick Voice &amp; Screenshot Entry:</strong> Scan the Google Pay or Paytm payment screen directly after paying at the chai stall.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/90 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showWordmark={true} tagline={false} />
            <span className="text-xs text-slate-500">· Student Smart Financial Hub</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={onOpenLogin}
              className="hover:text-slate-900 transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="hover:text-indigo-600 transition cursor-pointer"
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => onExploreTab('overview')}
              className="hover:text-indigo-600 transition cursor-pointer"
            >
              My Money
            </button>
            <button
              type="button"
              onClick={() => onExploreTab('room')}
              className="hover:text-indigo-600 transition cursor-pointer"
            >
              My Room
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} PocketBuddy. Real student finances.
          </div>
        </div>
      </footer>
    </div>
  );
};
