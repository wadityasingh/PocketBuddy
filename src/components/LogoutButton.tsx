import React from 'react';

interface LogoutButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onClick,
  className = '',
  size = 'md',
}) => {
  // Dimensions matching the circular logout button from the reference design
  const dimensions = {
    sm: 'w-9 h-9',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
  };

  return (
    <button
      id="header-logout-btn"
      type="button"
      onClick={onClick}
      className={`relative rounded-full shrink-0 group transition-all duration-150 active:scale-95 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 ${dimensions[size]} ${className}`}
      title="Log Out of PocketBuddy"
      aria-label="Log Out"
    >
      {/* 3D Circular Button SVG Replica based on the user's reference design */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)] group-hover:drop-shadow-[0_3px_6px_rgba(225,29,72,0.22)] transition-all"
      >
        <defs>
          {/* Outer Bevel Gradient */}
          <linearGradient id="logoutBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f1f5f9" />
            <stop offset="85%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Inner Disc Radial Shading (Subtle 3D domed white surface) */}
          <radialGradient id="logoutFaceGrad" cx="45%" cy="40%" r="55%" fx="40%" fy="35%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f8fafc" />
            <stop offset="95%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </radialGradient>

          {/* Hover highlight gradient */}
          <radialGradient id="logoutHoverGrad" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#fff1f2" />
            <stop offset="85%" stopColor="#ffe4e6" />
            <stop offset="100%" stopColor="#fecdd3" />
          </radialGradient>

          {/* Inner Top Specular Light Highlight */}
          <linearGradient id="logoutHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Shadow & Bevel Ring */}
        <circle cx="50" cy="50" r="48" fill="url(#logoutBevelGrad)" stroke="#cbd5e1" strokeWidth="1" />

        {/* Inner Subtle Recessed Rim */}
        <circle cx="50" cy="50" r="45" fill="#e2e8f0" />

        {/* Main Circular Button Face */}
        <circle
          cx="50"
          cy="49.5"
          r="43"
          fill="url(#logoutFaceGrad)"
          className="group-hover:opacity-90 transition-opacity"
        />

        {/* Top Glare Arc */}
        <ellipse cx="50" cy="20" rx="28" ry="12" fill="url(#logoutHighlight)" />

        {/* LOGOUT Bold Typography */}
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fill="#090d16"
          fontSize="17.5"
          fontWeight="900"
          letterSpacing="1.2"
          fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          className="group-hover:fill-rose-700 transition-colors"
        >
          LOGOUT
        </text>

        {/* Subtle Bottom Rim Shade */}
        <path
          d="M 12 55 A 41 41 0 0 0 88 55"
          stroke="#94a3b8"
          strokeWidth="1.5"
          fill="none"
          opacity="0.35"
        />
      </svg>
    </button>
  );
};
