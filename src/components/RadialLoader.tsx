import React from 'react';

interface RadialLoaderProps {
  size?: number;
  className?: string;
  label?: string;
}

export const RadialLoader: React.FC<RadialLoaderProps> = ({
  size = 58,
  className = '',
  label,
}) => {
  // 12 rounded spokes with spectral gradient transitioning from sky-blue to soft purple & lavender
  // Exact 1:1 match with native radial spinner
  const spokes = [
    { angle: 0, color: '#38bdf8', opacity: 1.0 },       // 12 o'clock: Vibrant sky blue
    { angle: 30, color: '#60a5fa', opacity: 0.95 },     // 1 o'clock: Dodger blue
    { angle: 60, color: '#818cf8', opacity: 0.90 },     // 2 o'clock: Indigo / periwinkle
    { angle: 90, color: '#9382f8', opacity: 0.85 },     // 3 o'clock: Violet
    { angle: 120, color: '#a78bfa', opacity: 0.80 },    // 4 o'clock: Lavender purple
    { angle: 150, color: '#b88cf8', opacity: 0.75 },    // 5 o'clock: Soft purple
    { angle: 180, color: '#c49ef8', opacity: 0.70 },    // 6 o'clock: Lilac
    { angle: 210, color: '#d5c2f8', opacity: 0.60 },    // 7 o'clock: Pale lavender
    { angle: 240, color: '#e2d7fb', opacity: 0.48 },    // 8 o'clock: Soft lilac tint
    { angle: 270, color: '#ccedfd', opacity: 0.45 },    // 9 o'clock: Pale cyan
    { angle: 300, color: '#a5e1fd', opacity: 0.62 },    // 10 o'clock: Light sky blue
    { angle: 330, color: '#6ec8fb', opacity: 0.85 },    // 11 o'clock: Sky blue
  ];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className="relative flex items-center justify-center animate-spin"
        style={{
          width: size,
          height: size,
          animationDuration: '0.85s',
          animationTimingFunction: 'linear',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className="w-full h-full overflow-visible"
        >
          {spokes.map((spoke, i) => (
            <rect
              key={i}
              x="47"
              y="6"
              width="6"
              height="20"
              rx="3"
              ry="3"
              fill={spoke.color}
              opacity={spoke.opacity}
              transform={`rotate(${spoke.angle} 50 50)`}
            />
          ))}
        </svg>
      </div>
      {label && (
        <p className="text-xs font-semibold text-slate-600 tracking-normal select-none">
          {label}
        </p>
      )}
    </div>
  );
};
