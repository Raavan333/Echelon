/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EchelonTheme } from '../types';

export interface ColorTokens {
  bg: string;
  card: string;
  cardHover: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  accentText: string;
  border: string;
  borderAccent: string;
  buttonBg: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
}

export function getColorTokens(theme: EchelonTheme, customAccentColor?: string): ColorTokens {
  const isDark = theme.mode === 'dark';
  
  // Base configuration
  let tokens: ColorTokens;

  // Intercept custom themes immediately
  if (theme.palette && theme.palette.startsWith('custom-')) {
    tokens = {
      bg: 'custom-theme-bg',
      card: 'custom-theme-card border shadow-md',
      cardHover: 'custom-theme-card-hover',
      textPrimary: 'custom-theme-text-primary',
      textSecondary: 'custom-theme-text-secondary',
      accent: 'custom-theme-accent font-semi',
      accentHover: 'hover:opacity-90',
      accentText: 'custom-theme-accent-text',
      border: 'custom-theme-border',
      borderAccent: 'custom-theme-border-accent',
      buttonBg: 'custom-theme-button-bg font-semi hover:opacity-95',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      badgeBg: 'custom-theme-badge-bg border',
      badgeText: 'custom-theme-badge-text'
    };
    return tokens;
  }

  switch (theme.palette) {
    case 'skyblue':
      tokens = {
        bg: 'bg-sky-100',
        card: 'bg-white border-sky-200/80 shadow-sm',
        cardHover: 'hover:bg-sky-50/50 hover:border-sky-400',
        textPrimary: 'text-sky-950',
        textSecondary: 'text-sky-800/80',
        accent: 'bg-sky-600 text-white font-medium',
        accentHover: 'hover:bg-sky-700',
        accentText: 'text-sky-600',
        border: 'border-sky-200',
        borderAccent: 'border-sky-500',
        buttonBg: 'bg-sky-200 hover:bg-sky-300 text-sky-950',
        glow: 'shadow-[0_0_15px_rgba(14,165,233,0.15)]',
        badgeBg: 'bg-sky-100 text-sky-800 border border-sky-200',
        badgeText: 'text-sky-950'
      };
      break;

    case 'pure-light':
      tokens = {
        bg: 'bg-stone-50',
        card: 'bg-white border-stone-200 shadow-sm',
        cardHover: 'hover:bg-stone-50/50 hover:border-stone-400',
        textPrimary: 'text-stone-900',
        textSecondary: 'text-stone-600',
        accent: 'bg-stone-900 text-white font-medium',
        accentHover: 'hover:bg-stone-850',
        accentText: 'text-stone-900',
        border: 'border-stone-200',
        borderAccent: 'border-stone-900',
        buttonBg: 'bg-stone-200 hover:bg-stone-300 text-stone-900',
        glow: 'shadow-[0_0_10px_rgba(41,37,36,0.05)]',
        badgeBg: 'bg-stone-100 text-stone-900 border border-stone-200',
        badgeText: 'text-stone-900'
      };
      break;

    case 'sand-drift':
      tokens = {
        bg: 'bg-[#fdf6e3]',
        card: 'bg-[#f5ecdf] border-[#e4d4c1] shadow-sm',
        cardHover: 'hover:bg-[#eae0d2] hover:border-[#b58900]',
        textPrimary: 'text-[#2c2421]',
        textSecondary: 'text-[#5c4f48]',
        accent: 'bg-[#b58900] text-white font-medium',
        accentHover: 'hover:bg-[#a07800]',
        accentText: 'text-[#b58900]',
        border: 'border-[#e4d4c1]',
        borderAccent: 'border-[#b58900]',
        buttonBg: 'bg-[#ebd9c1] hover:bg-[#e0caa9] text-[#2c2421]',
        glow: 'shadow-[0_0_12px_rgba(181,137,0,0.15)]',
        badgeBg: 'bg-[#f5ecdf] text-[#b58900] border border-[#e4d4c1]',
        badgeText: 'text-[#2c2421]'
      };
      break;

    case 'lavender-blush':
      tokens = {
        bg: 'bg-[#faf5ff]',
        card: 'bg-white border-purple-200 shadow-md',
        cardHover: 'hover:bg-purple-50/50 hover:border-purple-400',
        textPrimary: 'text-[#3b0764]',
        textSecondary: 'text-[#581c87]',
        accent: 'bg-[#8b5cf6] text-white font-medium',
        accentHover: 'hover:bg-[#7c3aed]',
        accentText: 'text-[#8b5cf6]',
        border: 'border-purple-200',
        borderAccent: 'border-purple-500',
        buttonBg: 'bg-purple-100 hover:bg-purple-200 text-[#3b0764]',
        glow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
        badgeBg: 'bg-purple-50 text-purple-750 border border-purple-200',
        badgeText: 'text-[#3b0764]'
      };
      break;

    case 'mint-fresh':
      tokens = {
        bg: 'bg-[#f0fdf4]',
        card: 'bg-white border-emerald-200 shadow-sm',
        cardHover: 'hover:bg-emerald-50/50 hover:border-emerald-400',
        textPrimary: 'text-emerald-950',
        textSecondary: 'text-emerald-800',
        accent: 'bg-emerald-600 text-white font-medium',
        accentHover: 'hover:bg-emerald-700',
        accentText: 'text-emerald-600',
        border: 'border-emerald-200',
        borderAccent: 'border-emerald-500',
        buttonBg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.12)]',
        badgeBg: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
        badgeText: 'text-emerald-950'
      };
      break;
    case 'stealth-gold':
      tokens = {
        bg: 'bg-[#08080a]',
        card: 'bg-[#111115]/90 border-amber-500/10 shadow-[0_4px_24px_rgba(0,0,0,0.8)]',
        cardHover: 'hover:border-amber-500/30 hover:bg-[#14141d]/90',
        textPrimary: 'text-zinc-100',
        textSecondary: 'text-zinc-400',
        accent: 'bg-amber-500 text-stone-950 font-medium',
        accentHover: 'hover:bg-amber-400',
        accentText: 'text-amber-400',
        border: 'border-zinc-800/80',
        borderAccent: 'border-amber-500/40',
        buttonBg: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.18)]',
        badgeBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        badgeText: 'text-amber-400'
      };
      break;

    case 'black-steel':
      tokens = {
        bg: 'bg-[#050505]',
        card: 'bg-[#0e0f11] border-zinc-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.9)]',
        cardHover: 'hover:border-zinc-600 hover:bg-[#121417]',
        textPrimary: 'text-zinc-100',
        textSecondary: 'text-zinc-400',
        accent: 'bg-zinc-100 text-black font-semibold',
        accentHover: 'hover:bg-zinc-200',
        accentText: 'text-zinc-100',
        border: 'border-zinc-800',
        borderAccent: 'border-zinc-400',
        buttonBg: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
        glow: 'shadow-[0_0_15px_rgba(255,255,255,0.12)]',
        badgeBg: 'bg-zinc-800 text-zinc-200 border border-zinc-700',
        badgeText: 'text-zinc-100'
      };
      break;

    case 'royal-emerald':
      tokens = {
        bg: 'bg-[#020a05]',
        card: 'bg-[#03160a] border-emerald-950 shadow-[inset_0_1px_1px_rgba(16,185,129,0.08)]',
        cardHover: 'hover:border-[#22c55e]/40 hover:bg-[#062010]',
        textPrimary: 'text-[#ecfdf5]',
        textSecondary: 'text-[#82a38f]',
        accent: 'bg-emerald-500 text-[#020a05] font-medium',
        accentHover: 'hover:bg-emerald-400',
        accentText: 'text-emerald-400',
        border: 'border-emerald-900/60',
        borderAccent: 'border-emerald-500/40',
        buttonBg: 'bg-[#0b2b14] hover:bg-[#103b1c] text-emerald-300',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.22)]',
        badgeBg: 'bg-[#062010] text-[#34d399] border border-[#10b981]/20',
        badgeText: 'text-emerald-400'
      };
      break;

    case 'rose-amethyst':
      tokens = {
        bg: 'bg-[#050409]',
        card: 'bg-[#0d091a] border-purple-950/80 shadow-[0_4px_24px_rgba(0,0,0,0.85)]',
        cardHover: 'hover:border-fuchsia-500/40 hover:bg-[#110c22]',
        textPrimary: 'text-purple-550 text-[#f3f0fa]',
        textSecondary: 'text-purple-300/60',
        accent: 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-stone-950 font-medium',
        accentHover: 'hover:opacity-95',
        accentText: 'text-fuchsia-400',
        border: 'border-purple-900/50',
        borderAccent: 'border-fuchsia-500/40',
        buttonBg: 'bg-purple-950 hover:bg-purple-900 text-fuchsia-300',
        glow: 'shadow-[0_0_20px_rgba(217,70,239,0.22)]',
        badgeBg: 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-550/20',
        badgeText: 'text-fuchsia-400'
      };
      break;

    case 'platinum-silver':
      tokens = {
        bg: 'bg-[#0b0c0e]',
        card: 'bg-[#111317] border-zinc-800 shadow-md',
        cardHover: 'hover:border-cyan-400/40 hover:bg-[#15171d]',
        textPrimary: 'text-slate-100',
        textSecondary: 'text-slate-400',
        accent: 'bg-[#22d3ee] text-slate-950 font-medium',
        accentHover: 'hover:bg-cyan-300',
        accentText: 'text-cyan-455 text-cyan-400',
        border: 'border-zinc-800/80',
        borderAccent: 'border-cyan-455 border-cyan-400/50',
        buttonBg: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
        glow: 'shadow-[0_0_15px_rgba(34,211,238,0.2)]',
        badgeBg: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20',
        badgeText: 'text-cyan-300'
      };
      break;

    case 'slate-amber':
      tokens = {
        bg: 'bg-[#090b0e]',
        card: 'bg-[#101318] border-zinc-800 shadow-lg',
        cardHover: 'hover:border-amber-600/40 hover:bg-[#14181f]',
        textPrimary: 'text-[#e5e7eb]',
        textSecondary: 'text-[#9ca3af]',
        accent: 'bg-[#f97316] text-[#090b0e] font-semibold',
        accentHover: 'hover:bg-orange-500',
        accentText: 'text-orange-500',
        border: 'border-zinc-800/60',
        borderAccent: 'border-orange-500/40',
        buttonBg: 'bg-[#1a202c] hover:bg-[#20293a] text-orange-400',
        glow: 'shadow-[0_0_15px_rgba(249,115,22,0.18)]',
        badgeBg: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
        badgeText: 'text-orange-400'
      };
      break;

    case 'black':
      tokens = {
        bg: isDark ? 'bg-zinc-1000 bg-black' : 'bg-stone-50',
        card: isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-stone-200 shadow-sm',
        cardHover: isDark ? 'hover:border-amber-500/20 hover:bg-zinc-900/40' : 'hover:border-stone-400 hover:bg-stone-50/50',
        textPrimary: isDark ? 'text-stone-300' : 'text-stone-900',
        textSecondary: isDark ? 'text-stone-400' : 'text-stone-500',
        accent: isDark ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-amber-400',
        accentHover: isDark ? 'hover:bg-amber-400' : 'hover:bg-stone-850',
        accentText: isDark ? 'text-amber-400' : 'text-stone-950',
        border: isDark ? 'border-zinc-900' : 'border-stone-200',
        borderAccent: isDark ? 'border-amber-500/30' : 'border-stone-900',
        buttonBg: isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-stone-200' : 'bg-stone-200 hover:bg-stone-300 text-stone-900',
        glow: isDark ? 'shadow-[0_0_15px_rgba(245,158,11,0.12)]' : 'shadow-[0_0_10px_rgba(41,37,36,0.04)]',
        badgeBg: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-stone-150 text-stone-900 border border-stone-200',
        badgeText: isDark ? 'text-amber-400' : 'text-stone-900'
      };
      break;

    case 'silver':
      tokens = {
        bg: isDark ? 'bg-slate-950' : 'bg-slate-50',
        card: isDark ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200 shadow-sm',
        cardHover: isDark ? 'hover:border-blue-500/20 hover:bg-slate-900/40' : 'hover:border-slate-400 hover:bg-slate-50/50',
        textPrimary: isDark ? 'text-slate-300' : 'text-slate-900',
        textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
        accent: isDark ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white',
        accentHover: isDark ? 'hover:bg-blue-500' : 'hover:opacity-95',
        accentText: isDark ? 'text-blue-400' : 'text-slate-900',
        border: isDark ? 'border-slate-900' : 'border-slate-200',
        borderAccent: isDark ? 'border-blue-500/30' : 'border-slate-900',
        buttonBg: isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-950',
        glow: isDark ? 'shadow-[0_0_15px_rgba(37,99,235,0.12)]' : 'shadow-[0_0_10px_rgba(148,163,184,0.04)]',
        badgeBg: isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-100 text-slate-900 border border-slate-200',
        badgeText: isDark ? 'text-blue-500' : 'text-slate-900'
      };
      break;

    case 'elegant-dark':
      tokens = {
        bg: 'bg-[#020202]',
        card: 'bg-[#0c0c0c] border-[#181818]',
        cardHover: 'hover:border-[#333333] hover:bg-[#121212]',
        textPrimary: 'text-[#f5f5f5]',
        textSecondary: 'text-[#909090]',
        accent: 'bg-[#ffffff] text-[#020202] font-semibold',
        accentHover: 'hover:bg-[#e5e5e5]',
        accentText: 'text-[#ffffff]',
        border: 'border-[#181818]',
        borderAccent: 'border-[#cccccc]',
        buttonBg: 'bg-[#151515] hover:bg-[#1f1f1f] text-[#f5f5f5]',
        glow: 'shadow-[0_0_15px_rgba(255,255,255,0.05)]',
        badgeBg: 'bg-[#151515] text-[#909090] border border-[#222222]',
        badgeText: 'text-[#f5f5f5]'
      };
      break;

    default:
      // Fallback
      tokens = {
        bg: isDark ? 'bg-[#030712]' : 'bg-slate-50',
        card: isDark ? 'bg-[#1f2937]/35 border-gray-800' : 'bg-white border-gray-200 shadow-sm',
        cardHover: isDark ? 'hover:border-teal-400/20 hover:bg-gray-800/40' : 'hover:border-gray-300 hover:bg-gray-50',
        textPrimary: isDark ? 'text-gray-100' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-400' : 'text-gray-500',
        accent: isDark ? 'bg-teal-500 text-stone-950' : 'bg-teal-700 text-white',
        accentHover: isDark ? 'hover:bg-teal-400' : 'hover:bg-teal-600',
        accentText: isDark ? 'text-teal-400' : 'text-teal-700',
        border: isDark ? 'border-gray-800/80' : 'border-gray-200',
        borderAccent: isDark ? 'border-teal-500/30' : 'border-teal-500',
        buttonBg: isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800',
        glow: isDark ? 'shadow-[0_0_15px_rgba(20,184,166,0.12)]' : 'shadow-[0_0_10px_rgba(20,184,166,0.04)]',
        badgeBg: isDark ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-900 border border-teal-200',
        badgeText: isDark ? 'text-[#0d9488]' : 'text-teal-900'
      };
      break;
  }

  // Dynamic Hex Override if customAccentColor is specified manually by user
  if (customAccentColor && customAccentColor.startsWith('#')) {
    tokens.accent = `bg-[${customAccentColor}] text-black font-semibold`;
    tokens.accentText = `text-[${customAccentColor}]`;
    tokens.borderAccent = `border-[${customAccentColor}]/40`;
    tokens.glow = `shadow-[0_0_15px_${customAccentColor}33]`;
  }

  return tokens;
}

export function renderPremiumProgressBar(
  pct: number, 
  style: 'ultra-thin' | 'neon-glow' | 'carbon-solid' = 'ultra-thin', 
  colorClass: string = 'bg-amber-500',
  customAccentColor?: string
) {
  const widthVal = `${Math.max(0, Math.min(100, pct))}%`;
  
  // Custom hex color support
  const bgStyle = customAccentColor && customAccentColor.startsWith('#')
    ? { backgroundColor: customAccentColor }
    : undefined;

  let shadowColor = customAccentColor && customAccentColor.startsWith('#')
    ? customAccentColor
    : 'rgba(245,158,11,0.6)';
  if (!customAccentColor) {
    if (colorClass.includes('emerald') || colorClass.includes('green')) shadowColor = 'rgba(16,185,129,0.6)';
    if (colorClass.includes('rose') || colorClass.includes('red')) shadowColor = 'rgba(239,68,68,0.6)';
    if (colorClass.includes('blue') || colorClass.includes('cyan')) shadowColor = 'rgba(37,99,235,0.6)';
  }

  if (style === 'ultra-thin') {
    return (
      <div className="w-full h-0.5 rounded-full bg-stone-200/5 dark:bg-stone-850 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${!bgStyle ? colorClass : ''}`} 
          style={{ width: widthVal, ...bgStyle }} 
        />
      </div>
    );
  }
  
  if (style === 'neon-glow') {
    return (
      <div className="w-full h-1 rounded-full bg-stone-500/10 dark:bg-stone-900 overflow-visible relative">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${!bgStyle ? colorClass : ''}`} 
          style={{ 
            width: widthVal,
            boxShadow: `0 0 10px ${shadowColor}, 0 0 4px ${shadowColor}`,
            ...bgStyle
          }} 
        />
      </div>
    );
  }
  
  return (
    <div className="w-full h-2 rounded-md bg-stone-900/60 border border-stone-800/40 p-0.5 overflow-hidden flex items-center justify-start">
      <div 
        className={`h-full rounded-sm transition-all duration-500 ${!bgStyle ? colorClass : ''}`} 
        style={{ width: widthVal, ...bgStyle }} 
      />
    </div>
  );
}
