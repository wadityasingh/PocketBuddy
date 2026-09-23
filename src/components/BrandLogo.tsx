import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  tagline?: boolean;
  className?: string;
  badgeText?: string;
  variant?: 'light' | 'dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  tagline = true,
  className = '',
  badgeText,
  variant = 'light',
}) => {
  const sizeDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none shrink-0 ${className}`}>
      {/* Visual Emblem / App Icon */}
      <div
        className={`relative shrink-0 ${sizeDimensions[size]} rounded-xl flex items-center justify-center overflow-hidden transition-transform duration-150`}
        style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          boxShadow: '0 2px 8px -1px rgba(220, 38, 38, 0.4)',
        }}
      >
        {/* Vector Mark: Layered Digital Wallet */}
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5 relative z-10"
        >
          <defs>
            <linearGradient id="pb-wallet-grad" x1="4" y1="8" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ef4444" />
              <stop offset="1" stopColor="#b91c1c" />
            </linearGradient>
            <linearGradient id="pb-coin-gold" x1="18" y1="14" x2="30" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.5" stopColor="#eab308" />
              <stop offset="1" stopColor="#ca8a04" />
            </linearGradient>
          </defs>

          {/* Card Peek */}
          <rect
            x="8"
            y="6"
            width="20"
            height="8"
            rx="2"
            fill="#ffffff"
            opacity="0.95"
          />

          {/* Wallet Base Shell */}
          <rect
            x="4"
            y="10"
            width="28"
            height="19"
            rx="4"
            fill="url(#pb-wallet-grad)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />

          {/* Wallet Seam */}
          <path
            d="M4 18.5L18 23L32 18.5"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Golden Rupee Coin */}
          <circle
            cx="24"
            cy="19"
            r="5.5"
            fill="url(#pb-coin-gold)"
            stroke="#ffffff"
            strokeWidth="1"
          />
          <text
            x="24"
            y="21.8"
            textAnchor="middle"
            fill="#713f12"
            fontSize="6.8"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ₹
          </text>
        </svg>
      </div>

      {/* Wordmark Typography */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-black tracking-tight text-lg sm:text-xl flex items-center leading-none ${variant === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              Pocket<span className={variant === 'dark' ? 'text-red-500' : 'text-red-600'}>Buddy</span>
            </span>
            {badgeText && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${variant === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {badgeText}
              </span>
            )}
          </div>
          {tagline && (
            <p className={`hidden sm:block text-[11px] font-medium tracking-normal mt-0.5 leading-none ${variant === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Student &amp; Room Expense Tracker
            </p>
          )}
        </div>
      )}
    </div>
  );
};
