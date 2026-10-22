import React from 'react';

export const PitchSvg: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Geometric sports arena pitch and court illustration"
      role="img"
    >
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1f2e47" strokeWidth="0.5" strokeOpacity="0.4" />
        </pattern>
        <linearGradient id="courtGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0b1322" />
          <stop offset="100%" stopColor="#070c16" />
        </linearGradient>
      </defs>

      {/* Outer Pitch Border */}
      <rect x="10" y="10" width="580" height="380" rx="8" fill="url(#courtGlow)" stroke="#1e293b" strokeWidth="2" />
      <rect x="25" y="25" width="550" height="350" fill="url(#grid)" />

      {/* Main Touchlines / Sidelines */}
      <rect x="40" y="35" width="520" height="330" rx="4" stroke="#38bdf8" strokeWidth="2.5" strokeOpacity="0.85" />

      {/* Halfway Line */}
      <line x1="300" y1="35" x2="300" y2="365" stroke="#38bdf8" strokeWidth="2.5" strokeOpacity="0.85" />

      {/* Center Circle & Center Spot */}
      <circle cx="300" cy="200" r="60" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.85" />
      <circle cx="300" cy="200" r="4.5" fill="#38bdf8" />

      {/* Left Penalty Box / Basketball Key */}
      <rect x="40" y="105" width="105" height="190" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.85" />
      <rect x="40" y="145" width="40" height="110" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.75" />
      <circle cx="115" cy="200" r="3.5" fill="#38bdf8" />
      <path d="M 145 160 A 45 45 0 0 1 145 240" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.85" />

      {/* Right Penalty Box / Basketball Key */}
      <rect x="455" y="105" width="105" height="190" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.85" />
      <rect x="520" y="145" width="40" height="110" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.75" />
      <circle cx="485" cy="200" r="3.5" fill="#38bdf8" />
      <path d="M 455 160 A 45 45 0 0 0 455 240" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.85" />

      {/* Basketball 3-Point Arcs (Subtle Overlay Geometry) */}
      <path d="M 40 70 L 80 70 A 135 135 0 0 1 80 330 L 40 330" stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 4" strokeOpacity="0.6" />
      <path d="M 560 70 L 520 70 A 135 135 0 0 0 520 330 L 560 330" stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 4" strokeOpacity="0.6" />

      {/* Corner Arcs */}
      <path d="M 40 50 A 15 15 0 0 1 55 35" stroke="#38bdf8" strokeWidth="2" />
      <path d="M 40 350 A 15 15 0 0 0 55 365" stroke="#38bdf8" strokeWidth="2" />
      <path d="M 560 50 A 15 15 0 0 0 545 35" stroke="#38bdf8" strokeWidth="2" />
      <path d="M 560 350 A 15 15 0 0 1 545 365" stroke="#38bdf8" strokeWidth="2" />

      {/* Technical Area Benches */}
      <rect x="180" y="18" width="80" height="12" rx="2" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
      <rect x="340" y="18" width="80" height="12" rx="2" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
    </svg>
  );
};
