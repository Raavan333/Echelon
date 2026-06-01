/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number | string;
}

// 1. Stealth Matte Gold (Image 3)
export function StealthMatteGold({ className = 'h-10 w-10', size = '100%' }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="matte-circle-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2c2d30" />
          <stop offset="100%" stopColor="#0f1011" />
        </radialGradient>
        <linearGradient id="gold-shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe27c" />
          <stop offset="50%" stopColor="#d29ffc" />
          <stop offset="100%" stopColor="#a37000" />
        </linearGradient>
        <linearGradient id="solid-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffeaa7" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>
      </defs>

      {/* Dark gray/black matte circular background */}
      <circle cx="50" cy="50" r="48" fill="url(#matte-circle-grad)" stroke="#1c1d1e" strokeWidth="2" />
      <circle cx="50" cy="50" r="44" stroke="#d4af37" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />

      {/* Golden Hex Outline */}
      <polygon
        points="50,18 78,34 78,66 50,82 22,66 22,34"
        fill="#141517"
        stroke="url(#solid-gold)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Inner gold shield */}
      <path
        d="M50,26 C57,26 62,30 64,36 C64,52 56,66 50,72 C44,66 36,52 36,36 C38,30 43,26 50,26 Z"
        fill="#1a1b1d"
        stroke="url(#solid-gold)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Dollar sign logo */}
      <text
        x="50%"
        y="45%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="url(#solid-gold)"
        fontSize="12"
        fontWeight="black"
        fontFamily="sans-serif"
      >
        $
      </text>

      {/* Beautiful sharp diagonal chart arrow pointing up-right */}
      <path
        d="M32,64 L65,34 M65,34 L54,33 M65,34 L66,45"
        stroke="url(#solid-gold)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 2. Vanguard Black Steel Watch (Image 1)
export function VanguardBlackSteel({ className = 'h-10 w-10', size = '100%' }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="black-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2c2e33" />
          <stop offset="40%" stopColor="#151618" />
          <stop offset="100%" stopColor="#080809" />
        </linearGradient>
        <linearGradient id="dark-bezel" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#111215" />
          <stop offset="50%" stopColor="#31333c" />
          <stop offset="100%" stopColor="#111215" />
        </linearGradient>
        <linearGradient id="metal-arrow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4c505c" />
          <stop offset="50%" stopColor="#1d1e21" />
          <stop offset="100%" stopColor="#0f1012" />
        </linearGradient>
      </defs>

      {/* Outer Watch Bezel Circle */}
      <circle cx="50" cy="50" r="48" fill="url(#dark-bezel)" stroke="#090a0c" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="41" fill="#0b0c0d" stroke="#1c1e22" strokeWidth="1" />

      {/* Bezel Screw Studs / Hour Indicators */}
      <circle cx="50" cy="8" r="1.5" fill="#52b788" /> {/* Green ruby top */}
      <circle cx="92" cy="50" r="1.5" fill="#f25c54" /> {/* Red ruby right */}
      <circle cx="50" cy="92" r="1.5" fill="#3a86c8" /> {/* Blue ruby bottom */}
      <circle cx="8" cy="50" r="1.5" fill="#ffd166" /> {/* Gold ruby left */}
      <circle cx="21" cy="21" r="1" fill="#4a505a" />
      <circle cx="79" cy="21" r="1" fill="#4a505a" />
      <circle cx="79" cy="79" r="1" fill="#4a505a" />
      <circle cx="21" cy="79" r="1" fill="#4a505a" />

      {/* Right side Winding Crown clicker */}
      <rect x="91" y="44" width="4" height="12" rx="1" fill="#18191b" stroke="#31333a" strokeWidth="1" />
      <circle cx="93.5" cy="50" r="1.5" fill="#2c2e33" />

      {/* Hexagonal Metal Container Shield */}
      <polygon
        points="50,22 74,36 74,64 50,78 26,64 26,36"
        fill="url(#black-metallic)"
        stroke="#4a4f5d"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Intertwining Tactical Shield */}
      <path
        d="M50,28 C55,28 59,32 61,37 C61,49 55,60 50,65 C45,60 39,49 39,37 C41,32 45,28 50,28 Z"
        fill="#0d0e10"
        stroke="#272a31"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Center Currency Sigil */}
      <text
        x="50%"
        y="45%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#5a5e6b"
        fontSize="10"
        fontWeight="black"
        fontFamily="sans-serif"
      >
        $
      </text>

      {/* Strong Metallic Diagonal Arrow Upwards */}
      <path
        d="M28,68 L68,36 M68,36 L55,34 M68,36 L66,49"
        stroke="url(#metal-arrow)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arrow sharp cap overlay */}
      <path
        d="M68,36 L57,35 L66,47 Z"
        fill="#2c2d33"
      />
    </svg>
  );
}

// 3. Regal Royal Gold & Diamond Watch (Image 2)
export function RegalObsidianGold({ className = 'h-10 w-10', size = '100%' }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rich-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="30%" stopColor="#d4af37" />
          <stop offset="70%" stopColor="#f39c12" />
          <stop offset="100%" stopColor="#9a7d1e" />
        </linearGradient>
        <linearGradient id="purple-obsidian" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2c1a4d" />
          <stop offset="50%" stopColor="#120c22" />
          <stop offset="100%" stopColor="#050308" />
        </linearGradient>
        <radialGradient id="gems-sparkle" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#00d2ff" />
          <stop offset="100%" stopColor="#0056b3" />
        </radialGradient>
      </defs>

      {/* Outer Luxury watch Bezel bordered with gold */}
      <circle cx="50" cy="50" r="48" fill="url(#purple-obsidian)" stroke="url(#rich-gold)" strokeWidth="3.5" />
      <circle cx="50" cy="50" r="42" stroke="url(#rich-gold)" strokeWidth="1" strokeDasharray="3 2" fill="none" />

      {/* Encrusted Diamond jewel indicators on Bezel */}
      <circle cx="50" cy="7" r="2.5" fill="url(#gems-sparkle)" />
      <circle cx="93" cy="50" r="2.5" fill="url(#gems-sparkle)" />
      <circle cx="50" cy="93" r="2.5" fill="url(#gems-sparkle)" />
      <circle cx="7" cy="50" r="2.5" fill="url(#gems-sparkle)" />

      <circle cx="21" cy="21" r="1.5" fill="#ffd700" />
      <circle cx="79" cy="21" r="1.5" fill="#ffd700" />
      <circle cx="79" cy="79" r="1.5" fill="#ffd700" />
      <circle cx="21" cy="79" r="1.5" fill="#ffd700" />

      {/* Luxurious Gold Crown on right side with blue ruby cabochon */}
      <rect x="91.5" y="43" width="5" height="14" rx="1.5" fill="url(#rich-gold)" stroke="#aa8c2c" strokeWidth="1" />
      <circle cx="94" cy="50" r="1.5" fill="#00d2ff" />

      {/* Carbon Fiber Shield gold core hexagon */}
      <polygon
        points="50,20 76,35 76,65 50,80 24,65 24,35"
        fill="#120b24"
        stroke="url(#rich-gold)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Internal Shield detail with blue glow */}
      <path
        d="M50,26 C56,26 61,30 63,35 C63,49 56,61 50,66 C44,61 37,49 37,35 C39,30 44,26 50,26 Z"
        fill="#090514"
        stroke="#00d2ff"
        strokeOpacity="0.8"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Brilliant deep blue sapphire dollar sign */}
      <text
        x="50%"
        y="45%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#00d2ff"
        fontSize="12"
        fontWeight="black"
        fontFamily="sans-serif"
        style={{ textShadow: '0 0 5px #00d2ff' }}
      >
        $
      </text>

      {/* Majestic diagonal chart arrow in rich shiny gold */}
      <path
        d="M26,67 L68,34 M68,34 L56,33 M68,34 L66,46"
        stroke="url(#rich-gold)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arrow head premium design */}
      <polygon
        points="68,34 56,33 63,40"
        fill="url(#rich-gold)"
      />
    </svg>
  );
}

// 4. Combined Router Component
interface EchelonIconProps {
  name?: string;
  className?: string;
  size?: number | string;
}

export function EchelonIcon({ name, className = 'h-10 w-10', size = '100%' }: EchelonIconProps) {
  const normalized = name || 'stealth-matte-gold';
  switch (normalized) {
    case 'vanguard-black-steel':
      return <VanguardBlackSteel className={className} size={size} />;
    case 'regal-obsidian-gold':
      return <RegalObsidianGold className={className} size={size} />;
    case 'stealth-matte-gold':
    default:
      return <StealthMatteGold className={className} size={size} />;
  }
}
