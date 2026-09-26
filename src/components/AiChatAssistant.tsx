import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  ChevronDown,
  RotateCcw,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface AiChatAssistantProps {
  studentState: {
    monthlyPocketMoney: number;
    remainingBudget: number;
    safeDailyCap: number;
    todaySpent: number;
    daysLeft: number;
    wallets: { cash: number; upi: number };
    roomName?: string;
    roomMembers?: string[];
    myRoomStanding?: string;
    whoOwesWhom?: Array<{ from: string; to: string; amount: number }>;
    recentRoomPurchases?: Array<{ title: string; amount: number; paidBy: string }>;
  };
  onOpenAction?: (action: string) => void;
}

const SUGGESTED_QUESTIONS = [
  'Where did I spend the most?',
  'How much money do I have left?',
  'Who do I owe in my room?',
  'What are my biggest expenses?',
  'Show my spending summary.',
];

export const AiChatAssistant: React.FC<AiChatAssistantProps> = ({
  studentState,
  onOpenAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "Hi! I'm PocketBuddy AI.\nHow can I help you manage your money or roommate expenses today?",
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          studentState: {
            ...studentState,
            remainingPocketMoney: studentState.remainingBudget,
            daysLeft: studentState.daysLeft,
            safeDailyLimit: studentState.safeDailyCap,
          },
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        data.answer ||
        generateLocalFallback(text, studentState);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('AI chat error, using local financial reasoning:', err);
      const fallbackText = generateLocalFallback(text, studentState);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <aside aria-label="PocketBuddy AI Chat Assistant" className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 select-none">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          id="btn-open-pocketbuddy-ai"
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg hover:shadow-xl border border-slate-700/60 transition-all duration-200 cursor-pointer active:scale-95"
          title="Open PocketBuddy AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-bold tracking-tight text-white pr-0.5">
            PocketBuddy AI
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          id="pocketbuddy-ai-window"
          className="flex flex-col w-[92vw] sm:w-[380px] h-[520px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>PocketBuddy AI</span>
                  <span className="text-[10px] font-normal text-red-300">· Assistant</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Budget &amp; Roommate Expense Advisor
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: 'msg-welcome',
                      sender: 'assistant',
                      text: "Hi! I'm PocketBuddy AI.\nHow can I help you manage your money or roommate expenses today?",
                      timestamp: new Date(),
                    },
                  ])
                }
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-close-pocketbuddy-ai"
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Real Financial Context Strip */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span>
              Left: <strong className="text-slate-900">{formatINR(studentState.remainingBudget)}</strong>
            </span>
            <span>·</span>
            <span>
              Safe/Day: <strong className="text-red-600">{formatINR(studentState.safeDailyCap)}</strong>
            </span>
            <span>·</span>
            <span>{studentState.daysLeft}d left</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#fafafc]">
            {messages.map((m) => {
              const isAi = m.sender === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${isAi ? 'justify-start' : 'justify-end'}`}
                >
                  {isAi && (
                    <div className="w-6 h-6 rounded-md bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                      isAi
                        ? 'bg-white border border-slate-200/90 text-slate-800 shadow-2xs'
                        : 'bg-red-600 text-white shadow-2xs font-medium'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 justify-start items-center">
                <div className="w-6 h-6 rounded-md bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl text-xs text-slate-500 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-red-600" />
                  <span>Calculating with your financial data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200/70 text-[10px] font-semibold text-slate-700 transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your money or room..."
              disabled={loading}
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition text-slate-900 placeholder:text-slate-400"
            />
            <button
              id="btn-send-pocketbuddy-ai"
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || loading}
              className="p-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white transition cursor-pointer shrink-0 shadow-xs shadow-red-600/20"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

/**
 * Intelligent local fallback using real student numbers when offline
 */
function generateLocalFallback(query: string, state: any): string {
  const q = query.toLowerCase();
  const remaining = state.remainingBudget || 0;
  const allowance = state.monthlyPocketMoney || 0;
  const safeDaily = state.safeDailyCap || 0;
  const days = state.daysLeft || 1;
  const cash = state.wallets?.cash || 0;
  const upi = state.wallets?.upi || 0;

  if (q.includes('how much') || q.includes('left') || q.includes('balance')) {
    return `You currently have ${formatINR(remaining)} remaining this month out of your ${formatINR(allowance)} allowance.\n\n• UPI Wallet: ${formatINR(upi)}\n• Cash Wallet: ${formatINR(cash)}\n• Safe daily pace: ${formatINR(safeDaily)}/day for the next ${days} days.`;
  }

  if (q.includes('owe') || q.includes('room') || q.includes('roommate')) {
    if (state.whoOwesWhom && state.whoOwesWhom.length > 0) {
      const splits = state.whoOwesWhom
        .map((d: any) => `• ${d.from} owes ${d.to}: ${formatINR(d.amount)}`)
        .join('\n');
      return `Here is your current room debt summary:\n\n${splits}\n\nYour standing: ${state.myRoomStanding || 'Up to date'}.`;
    }
    return `In your room "${state.roomName || 'Current Room'}", there are currently no pending debts! All roommate expenses are settled.`;
  }

  if (q.includes('spend') || q.includes('summary') || q.includes('biggest') || q.includes('most')) {
    return `Spending Summary for this month:\n• Total monthly budget: ${formatINR(allowance)}\n• Available in-hand: ${formatINR(remaining)}\n• Safe spending limit: ${formatINR(safeDaily)} per day\n• Active days remaining: ${days} days\n\nTip: Keep high-frequency canteen snacks in Cash and track bills through UPI to preserve liquidity.`;
  }

  return `Based on your live account:\n• Monthly Allowance: ${formatINR(allowance)}\n• Remaining Balance: ${formatINR(remaining)} (UPI: ${formatINR(upi)}, Cash: ${formatINR(cash)})\n• Safe Daily Rate: ${formatINR(safeDaily)}/day\n\nFeel free to ask me to check if you can afford an expense, calculate roommate splits, or craft a polite payment reminder!`;
}
