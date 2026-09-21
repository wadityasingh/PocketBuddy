import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  Zap,
  CheckCircle2,
  IndianRupee,
  RotateCcw,
} from 'lucide-react';
import { Transaction, WalletBalances } from '../types';
import { formatINR } from '../utils/formatters';

interface AiCoachTabProps {
  monthlyPocketMoney: number;
  totalSpent?: number;
  spentThisMonth?: number;
  todaySpent?: number;
  transactions?: Transaction[];
  wallets?: WalletBalances;
  safeDailyLimit?: number;
  pendingUdhaarTotal?: number;
  upcomingBillsTotal?: number;
}

interface CoachInsight {
  status: 'healthy' | 'warning' | 'critical';
  summary: string;
  safeDailyCap: number;
  burnRateAlert: string;
  hacks: string[];
}

export const AiCoachTab: React.FC<AiCoachTabProps> = ({
  monthlyPocketMoney,
  totalSpent,
  spentThisMonth,
  todaySpent = 0,
  transactions = [],
  wallets = { cash: 0, upi: 0, bank: 0 },
  safeDailyLimit = 250,
  pendingUdhaarTotal = 0,
  upcomingBillsTotal = 0,
}) => {
  const actualSpent = totalSpent ?? spentThisMonth ?? 0;
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; sender: 'coach' | 'user'; text: string; time: string }>
  >([
    {
      id: 'welcome_1',
      sender: 'coach',
      text: 'Namaste! I am your PocketBuddy AI Money Mentor. Ask me anything about your pocket money, whether you can afford an outing, or how to survive month-end without asking home for cash!',
      time: 'Just now',
    },
  ]);
  const [userQuestion, setUserQuestion] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, askingQuestion]);

  const remainingDaysInMonth = Math.max(
    1,
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
      new Date().getDate() +
      1
  );
  const remainingBudget = Math.max(0, monthlyPocketMoney - actualSpent);
  const computedSafeCap = Math.round(remainingBudget / remainingDaysInMonth);

  const fetchCoachingInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyPocketMoney,
          totalSpent: actualSpent,
          todaySpent,
          remainingBudget,
          safeDailyCap: computedSafeCap,
          wallets,
          pendingUdhaarTotal,
          upcomingBillsTotal,
          recentTransactions: transactions.slice(0, 15),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const info = data.insight || data.data;
        if (info) {
          setInsight({
            status: info.status === 'danger' ? 'critical' : info.status || 'healthy',
            summary: info.summary || 'Your finances are tracked.',
            safeDailyCap: info.safeDailyCap || computedSafeCap,
            burnRateAlert: info.burnRateAlert || 'Spending is normal.',
            hacks: Array.isArray(info.hacks) ? info.hacks : [],
          });
        }
      } else {
        generateLocalInsight();
      }
    } catch (err) {
      generateLocalInsight();
    } finally {
      setLoading(false);
    }
  };

  const generateLocalInsight = () => {
    const remaining = Math.max(0, monthlyPocketMoney - actualSpent);
    const safeCap = Math.round(remaining / remainingDaysInMonth);
    const isHealthy = actualSpent < monthlyPocketMoney * 0.7;

    setInsight({
      status: isHealthy ? 'healthy' : remaining > 0 ? 'warning' : 'critical',
      summary: isHealthy
        ? `You have spent ${formatINR(actualSpent)} out of ${formatINR(
            monthlyPocketMoney
          )}. You are pacing comfortably with ${formatINR(safeCap)}/day safe spending limit.`
        : `Your expenses are running tight! You have ${formatINR(
            remaining
          )} left for ${remainingDaysInMonth} days. Stick to max ${formatINR(safeCap)} per day.`,
      safeDailyCap: safeCap,
      burnRateAlert: isHealthy
        ? 'Normal burn pace. You are safe from end-of-month broke days if you avoid sudden impulsive spending.'
        : 'High burn rate! Recommend cutting non-essential deliveries and cab rides.',
      hacks: [
        'Pay with UPI instead of loose cash for better micro-spend tracking.',
        'Cook weekend meals or eat at hostel mess to save up to ₹1,500/month.',
        'Always split room electricity, WiFi, and water bottles immediately via the Room Split tab.',
      ],
    });
  };

  useEffect(() => {
    fetchCoachingInsights();
  }, [monthlyPocketMoney, actualSpent]);

  // Dedicated Ultra-Fast Chat Handler (~1s response time)
  const sendChatMessage = async (q: string) => {
    if (!q.trim() || askingQuestion) return;
    const question = q.trim();
    setUserQuestion('');
    setAskingQuestion(true);

    const userMsgId = 'q_' + Date.now();
    setChatMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: question,
        time: 'Just now',
      },
    ]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          studentState: {
            monthlyPocketMoney,
            remainingPocketMoney: remainingBudget,
            daysLeft: remainingDaysInMonth,
            safeDailyLimit: computedSafeCap,
            todaySpent,
            pendingToCollect: pendingUdhaarTotal,
            upcomingBills: upcomingBillsTotal,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || data.answer || 'Got it! Keep spending within your daily limit.';
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'coach_' + Date.now(),
            sender: 'coach',
            text: replyText,
            time: 'Just now',
          },
        ]);
      } else {
        fallbackChatReply(question);
      }
    } catch (err) {
      fallbackChatReply(question);
    } finally {
      setAskingQuestion(false);
    }
  };

  const fallbackChatReply = (question: string) => {
    const qLower = question.toLowerCase();
    let reply = `Based on your balance of ${formatINR(remainingBudget)}, your safe spending cap is ${formatINR(computedSafeCap)}/day for the remaining ${remainingDaysInMonth} days.`;

    const numMatch = question.match(/\b(\d+)\b/);
    if (qLower.includes('can i afford') || qLower.includes('can i spend') || qLower.includes('kharcha')) {
      const amount = numMatch ? parseInt(numMatch[1], 10) : 300;
      if (amount <= computedSafeCap) {
        reply = `Haan bhai, bilkul! ₹${amount} is well under your safe daily limit of ${formatINR(computedSafeCap)}. You can safely spend it without stressing your month-end budget.`;
      } else if (amount <= remainingBudget - upcomingBillsTotal) {
        const nextDayCap = Math.max(40, Math.round((remainingBudget - amount) / Math.max(1, remainingDaysInMonth - 1)));
        reply = `You can afford ₹${amount}, but since it exceeds your ${formatINR(computedSafeCap)} daily cap, you should limit spending to ${formatINR(nextDayCap)}/day for the next few days to balance it out!`;
      } else {
        reply = `Caution: ₹${amount} will severely eat into your remaining ${formatINR(remainingBudget)} (especially with ${formatINR(upcomingBillsTotal)} in upcoming bills). Postpone or find a cheaper alternative!`;
      }
    } else if (qLower.includes('save') || qLower.includes('bachat')) {
      reply = `To save fast: 1) Collect your ${formatINR(pendingUdhaarTotal)} pending friend udhaar, 2) Claim hostel mess skip rebates, and 3) Keep daily canteen snacks under ₹80. You can easily save ₹1,200 this month!`;
    } else if (qLower.includes('limit') || qLower.includes('budget') || qLower.includes('safe')) {
      reply = `Your safe daily spending limit right now is ${formatINR(computedSafeCap)}/day for ${remainingDaysInMonth} days left in this month.`;
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: 'coach_' + Date.now(),
        sender: 'coach',
        text: reply,
        time: 'Just now',
      },
    ]);
  };

  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;
    sendChatMessage(userQuestion);
  };

  const clearChatHistory = () => {
    setChatMessages([
      {
        id: 'welcome_' + Date.now(),
        sender: 'coach',
        text: 'Chat cleared! What would you like to check about your student budget, canteen expenses, or room bills?',
        time: 'Just now',
      },
    ]);
  };

  const suggestedPrompts = [
    'Can I afford a ₹350 dinner tonight?',
    'What is my safe daily limit right now?',
    'How do I save ₹1,000 this month?',
    'Where can I cut unnecessary expenses?',
    'Can I spend ₹150 on canteen chai?',
  ];

  return (
    <div id="ai-coach-tab" className="space-y-6">
      {/* Top Banner: Authentic, natural dark card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
              Ultra-Fast AI Student Financial Mentor
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              ⚡ ~1s Instant Response
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Student Money Coach &amp; Survival Mentor
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Analyzes your pocket money burn rate, evaluates whether you can afford upcoming spends, and gives practical student life hacks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchCoachingInsights()}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Coach Analysis Card */}
      {loading && !insight ? (
        <div className="p-10 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <div>
            <p className="text-sm font-black text-slate-900">Analyzing Your Pocket Money Pace</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating transactions, remaining days, and safe daily limits...
            </p>
          </div>
        </div>
      ) : insight ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Financial Health Assessment:
              </span>
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                  insight.status === 'healthy'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : insight.status === 'warning'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {insight.status.toUpperCase()} PACE
              </span>
            </div>
            <div className="text-xs text-slate-600">
              Safe Daily Cap:{' '}
              <strong className="text-slate-900 font-black">
                {formatINR(insight.safeDailyCap || computedSafeCap)}
              </strong>
              /day
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 leading-relaxed">
            {insight.summary}
          </div>

          {/* Burn rate alert */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Burn Rate Assessment: </strong>
              <span>{insight.burnRateAlert}</span>
            </div>
          </div>

          {/* Hacks */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>3 Practical Student Savings Hacks</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {insight.hacks.map((hack, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{hack}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Interactive Fast Coach Q&A */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900">
              Ask Your Student Money Coach Anything
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
              Instant Answers
            </span>
          </div>

          {chatMessages.length > 2 && (
            <button
              type="button"
              onClick={clearChatHistory}
              className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 transition cursor-pointer"
              title="Clear chat messages"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Chat</span>
            </button>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={askingQuestion}
              onClick={() => sendChatMessage(q)}
              className="text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 disabled:opacity-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer text-left font-medium"
            >
              &quot;{q}&quot;
            </button>
          ))}
        </div>

        {/* Chat History Container with Auto-Scroll */}
        <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200 scroll-smooth">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] opacity-70">
                  <span>{msg.sender === 'user' ? 'You' : 'PocketBuddy AI'}</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>
                <div>{msg.text}</div>
              </div>
            </div>
          ))}

          {askingQuestion && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none text-xs text-slate-600 flex items-center gap-2 shadow-2xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Coach is analyzing in ~1s...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Question input */}
        <form onSubmit={handleSendQuestion} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask anything: e.g. Can I afford a ₹300 movie? How to stretch ₹2,000 for 10 days?"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            disabled={askingQuestion}
            className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!userQuestion.trim() || askingQuestion}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
          >
            {askingQuestion ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{askingQuestion ? 'Thinking...' : 'Ask Coach'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
