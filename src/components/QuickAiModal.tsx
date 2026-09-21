import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Loader2,
  Sparkles,
  RotateCcw,
  IndianRupee,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Home,
  Wallet,
  Lightbulb,
} from 'lucide-react';
import { RoomGroup, RoomExpense } from '../types';
import { formatINR } from '../utils/formatters';

interface QuickAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyPocketMoney: number;
  totalSpent: number;
  todaySpent: number;
  pendingUdhaarTotal: number;
  upcomingBillsTotal: number;
  roomGroup?: RoomGroup | null;
  currentUserName?: string;
  initialPrompt?: string;
}

export const QuickAiModal: React.FC<QuickAiModalProps> = ({
  isOpen,
  onClose,
  monthlyPocketMoney,
  totalSpent,
  todaySpent,
  pendingUdhaarTotal,
  upcomingBillsTotal,
  roomGroup,
  currentUserName = 'You',
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<
    Array<{ id: string; sender: 'user' | 'coach'; text: string; time: string }>
  >([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Hello ${currentUserName}! I am your AI Financial & Room Coach. Ask me anything—budget tracking, roommate bill splits, "Can I afford this?", expense management, or campus savings hacks. I'm here to help!`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const remainingBudget = Math.max(0, monthlyPocketMoney - totalSpent);
  const remainingDays = Math.max(
    1,
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
      new Date().getDate() +
      1
  );
  const safeDailyLimit = Math.max(0, Math.round(remainingBudget / remainingDays));

  // Compute room details if room exists
  const roomMembersList = roomGroup?.members?.map((m) => m.name) || [];
  const roomExpensesList = roomGroup?.expenses || [];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      if (initialPrompt && initialPrompt.trim()) {
        sendMessage(initialPrompt.trim());
      }
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const query = text.trim();
    setInputText('');
    setLoading(true);

    const userMsg = {
      id: 'u_' + Date.now(),
      sender: 'user' as const,
      text: query,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);

    // Prepare room purchases for context
    const recentRoomPurchases = roomExpensesList.slice(0, 10).map((e) => ({
      title: e.title,
      amount: e.totalAmount,
      paidBy: e.paidBy,
      date: e.date,
      category: e.category,
    }));

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          studentState: {
            monthlyPocketMoney,
            remainingPocketMoney: remainingBudget,
            daysLeft: remainingDays,
            safeDailyLimit,
            todaySpent,
            pendingToCollect: pendingUdhaarTotal,
            upcomingBills: upcomingBillsTotal,
            roomName: roomGroup?.name || 'My Room',
            roomMembers: roomMembersList,
            recentRoomPurchases,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || data.answer || 'Keep daily spends within your safe limit!';
        setMessages((prev) => [
          ...prev,
          {
            id: 'c_' + Date.now(),
            sender: 'coach',
            text: reply,
            time: 'Just now',
          },
        ]);
      } else {
        fallbackReply(query);
      }
    } catch {
      fallbackReply(query);
    } finally {
      setLoading(false);
    }
  };

  const fallbackReply = (query: string) => {
    const qLower = query.toLowerCase();
    let reply = `Your safe daily limit is ${formatINR(safeDailyLimit)}/day with ${formatINR(remainingBudget)} remaining for ${remainingDays} days.`;

    const numMatch = query.match(/\b(\d+)\b/);
    if (qLower.includes('afford') || qLower.includes('spend') || qLower.includes('buy')) {
      const amount = numMatch ? parseInt(numMatch[1], 10) : 300;
      if (amount <= safeDailyLimit) {
        reply = `Yes, definitely! Spending ₹${amount} is well within your safe daily target of ${formatINR(safeDailyLimit)}. You can go ahead safely.`;
      } else if (amount <= remainingBudget) {
        reply = `Caution advised: ₹${amount} exceeds today's safe target of ${formatINR(safeDailyLimit)}. To balance your budget, spend a bit less over the next couple of days.`;
      } else {
        reply = `Not recommended! Spending ₹${amount} will exceed your remaining pocket money of ${formatINR(remainingBudget)}. It's best to hold off on this expense.`;
      }
    } else if (qLower.includes('room') || qLower.includes('split') || qLower.includes('roommate') || qLower.includes('hisaab')) {
      if (roomGroup) {
        reply = `In "${roomGroup.name}", there are ${roomMembersList.length} roommates with total shared expenses of ${formatINR(roomExpensesList.reduce((s, e) => s + e.totalAmount, 0))}. You can inspect itemized breakdown under "Purchases & Items" and net debts under "Balances & Settlements" in the Room tab!`;
      } else {
        reply = `To manage room expenses, create or join a room in the My Room tab. Once added, you can split groceries, Wi-Fi, electricity, and rent automatically.`;
      }
    } else if (qLower.includes('save') || qLower.includes('budget') || qLower.includes('saving')) {
      reply = `Smart Student Savings Tips:\n1. Collect pending receivables (${formatINR(pendingUdhaarTotal)}) from friends before the weekend.\n2. Keep non-essential daily spends within your ${formatINR(safeDailyLimit)} safe daily limit.\n3. Minimize late-night food deliveries by planning mess/room snacks.`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: 'c_' + Date.now(),
        sender: 'coach',
        text: reply,
        time: 'Just now',
      },
    ]);
  };

  const promptCategories = [
    {
      label: 'Room & Roommates',
      prompts: [
        'Explain who owes what in my room',
        'What items did I buy for the room?',
        'How should I ask my roommate to settle up?',
        'How do we split bills when someone was away?',
      ],
    },
    {
      label: 'Budget & Savings',
      prompts: [
        'Can I afford ₹300 today?',
        'How can I save ₹1,500 this month?',
        'What is my safe daily spending target?',
        'Top tips to manage student pocket money',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        id="quick-ai-modal"
        className={`bg-white w-full transition-all duration-300 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col ${
          isExpanded
            ? 'sm:max-w-3xl h-[92vh]'
            : 'sm:max-w-xl h-[85vh] sm:h-[650px]'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white">Ask AI Coach</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                  ⚡ All-in-One Advisor
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Safe Daily: <strong className="text-white">{formatINR(safeDailyLimit)}/day</strong> • Budget: <strong className="text-white">{formatINR(remainingBudget)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:block p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {messages.length > 2 && (
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'w_' + Date.now(),
                      sender: 'coach',
                      text: `Chat reset! Kuch bhi pucho—room hisaab, budget, splits ya saving advice.`,
                      time: 'Just now',
                    },
                  ])
                }
                title="Reset Chat"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Categories */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 shrink-0 space-y-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {promptCategories.flatMap((cat) => cat.prompts).map((pill, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => sendMessage(pill)}
                className="text-[11px] whitespace-nowrap bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 px-3 py-1 rounded-full text-slate-700 font-medium transition cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`group relative max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs font-medium'
                }`}
              >
                {m.text}

                {m.sender === 'coach' && m.id !== 'welcome' && (
                  <button
                    onClick={() => handleCopy(m.id, m.text)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-slate-700 rounded bg-slate-100"
                    title="Copy Answer"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none text-xs text-slate-600 flex items-center gap-2 shadow-2xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Coach is thinking &amp; calculating your student numbers...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Bottom Input Field */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Kuch bhi pucho (e.g. 'Can I afford dinner?', 'Room hisaab', 'How to save')..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
