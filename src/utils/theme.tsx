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
    case 'skyblue-peacock':
      tokens = {
        bg: 'bg-[#ecf3f6]', // Soft cool duck-egg/slate-blue light
        card: 'bg-white border-[#c9dadf] shadow-xs',
        cardHover: 'hover:bg-[#f4f7f9] hover:border-[#86a8b3]',
        textPrimary: 'text-[#1e3d4a]', // highly readable deep petroleum/marine
        textSecondary: 'text-[#3d5a6c]', // legible secondary cool blue-gray
        accent: 'bg-[#2f6a7d] text-white font-medium',
        accentHover: 'hover:bg-[#1e4a59]',
        accentText: 'text-[#2f6a7d] font-bold',
        border: 'border-[#cbdfe4]',
        borderAccent: 'border-[#558291]',
        buttonBg: 'bg-[#dfecf0] hover:bg-[#cee1e7] text-[#1e3d4a]',
        glow: 'shadow-[0_2px_12px_rgba(47,106,125,0.06)]',
        badgeBg: 'bg-[#ebf4f6] text-[#2f6a7d] border border-[#cbdfe4]',
        badgeText: 'text-[#2f6a7d]'
      };
      break;

    case 'hotpink-marble':
      tokens = {
        bg: 'bg-[#f4ebeb]', // soft dusty light rose-quartz grey
        card: 'bg-[#faf5f5] border-[#d8c3c3] shadow-xs',
        cardHover: 'hover:bg-[#fdf3f3] hover:border-[#b39191]',
        textPrimary: 'text-[#4a3434]', // deep chocolate coffee - highly legible
        textSecondary: 'text-[#6e5656]', 
        accent: 'bg-[#a35252] text-white font-medium',
        accentHover: 'hover:bg-[#853c3c]',
        accentText: 'text-[#a35252] font-bold',
        border: 'border-[#e4d3d3]',
        borderAccent: 'border-[#a37272]',
        buttonBg: 'bg-[#ebdcd1] hover:bg-[#ebd5cf] text-[#4a3434]',
        glow: 'shadow-[0_2px_12px_rgba(163,82,82,0.06)]',
        badgeBg: 'bg-[#f5e9e9] text-[#a35252] border border-[#ebd3d3]',
        badgeText: 'text-[#a35252]'
      };
      break;

    case 'skyblue':
      tokens = {
        bg: 'bg-[#ebf1f5]', // Very soothing, cloudy cool grey-blue
        card: 'bg-white border-[#cad4dc] shadow-xs',
        cardHover: 'hover:bg-[#f3f6f9] hover:border-[#8da0b0]',
        textPrimary: 'text-[#243e56]', // deep sea blue, highly legible
        textSecondary: 'text-[#475b6e]',
        accent: 'bg-[#3b6082] text-white font-medium',
        accentHover: 'hover:bg-[#2b4864]',
        accentText: 'text-[#3b6082] font-bold',
        border: 'border-[#cbd5e0]',
        borderAccent: 'border-[#5a86ad]',
        buttonBg: 'bg-[#e2edf6] hover:bg-[#d0e0ee] text-[#243e56]',
        glow: 'shadow-[0_2px_12px_rgba(59,96,130,0.06)]',
        badgeBg: 'bg-[#e9f1f7] text-[#3b6082] border border-[#cbd5e0]',
        badgeText: 'text-[#3b6082]'
      };
      break;

    case 'pure-light':
      tokens = {
        bg: 'bg-[#f0f2f5]', // Cool clean slate-dust
        card: 'bg-white border-[#ced4da] shadow-xs',
        cardHover: 'hover:bg-[#f8f9fa] hover:border-[#adb5bd]',
        textPrimary: 'text-[#212529]', // dark slate-charcoal (very readable)
        textSecondary: 'text-[#495057]',
        accent: 'bg-[#343a40] text-white font-medium',
        accentHover: 'hover:bg-[#212529]',
        accentText: 'text-[#343a40] font-bold',
        border: 'border-[#dee2e6]',
        borderAccent: 'border-[#495057]',
        buttonBg: 'bg-[#e9ecef] hover:bg-[#dee2e6] text-[#212529]',
        glow: 'shadow-[0_2px_12px_rgba(33,37,41,0.05)]',
        badgeBg: 'bg-[#e9ecef] text-[#343a40] border border-[#dee2e6]',
        badgeText: 'text-[#343a40]'
      };
      break;

    case 'sand-drift':
      tokens = {
        bg: 'bg-[#f4efe8]', // Warm but soft soothing sand dune oatmeal (no bright blinding yellow)
        card: 'bg-white border-[#dcd3c5] shadow-xs',
        cardHover: 'hover:bg-[#faf7f3] hover:border-[#bda585]',
        textPrimary: 'text-[#4e3f30]', // gorgeous elegant deep espresso wood, ultra legible
        textSecondary: 'text-[#70604f]',
        accent: 'bg-[#8c6f4f] text-white font-medium',
        accentHover: 'hover:bg-[#70553a]',
        accentText: 'text-[#8c6f4f] font-bold',
        border: 'border-[#e8e2d8]',
        borderAccent: 'border-[#a88d6c]',
        buttonBg: 'bg-[#efece6] hover:bg-[#e4dfd4] text-[#4e3f30]',
        glow: 'shadow-[0_2px_12px_rgba(140,111,79,0.06)]',
        badgeBg: 'bg-[#f8f6f2] text-[#8c6f4f] border border-[#e8e2d8]',
        badgeText: 'text-[#8c6f4f]'
      };
      break;

    case 'lavender-blush':
      tokens = {
        bg: 'bg-[#ede9f2]', // Soft, dreamy pastel lavender-mist
        card: 'bg-white border-[#cfc4db] shadow-xs',
        cardHover: 'hover:bg-[#f6f3f8] hover:border-[#9b86b3]',
        textPrimary: 'text-[#3e2365]', // Deep navy-purple, highly readable
        textSecondary: 'text-[#5d4481]',
        accent: 'bg-[#6d4c9f] text-white font-medium',
        accentHover: 'hover:bg-[#583b83]',
        accentText: 'text-[#6d4c9f] font-bold',
        border: 'border-[#ddd5e7]',
        borderAccent: 'border-[#9278bd]',
        buttonBg: 'bg-[#eeddf3] hover:bg-[#e4cced] text-[#3e2365]',
        glow: 'shadow-[0_2px_12px_rgba(109,76,159,0.06)]',
        badgeBg: 'bg-[#f4eef9] text-[#6d4c9f] border border-[#ddd5e7]',
        badgeText: 'text-[#6d4c9f]'
      };
      break;

    case 'mint-fresh':
      tokens = {
        bg: 'bg-[#ebf2ee]', // calm cool eucalyptus/sage light green
        card: 'bg-white border-[#cad7cf] shadow-xs',
        cardHover: 'hover:bg-[#f3f7f5] hover:border-[#8ca697]',
        textPrimary: 'text-[#1e3c2c]', // beautiful deep pine green, ultra legible
        textSecondary: 'text-[#3a5848]',
        accent: 'bg-[#3b7556] text-white font-medium',
        accentHover: 'hover:bg-[#2b5a40]',
        accentText: 'text-[#3b7556] font-bold',
        border: 'border-[#cbded3]',
        borderAccent: 'border-[#5fa37b]',
        buttonBg: 'bg-[#e2ede7] hover:bg-[#cfded4] text-[#1e3c2c]',
        glow: 'shadow-[0_2px_12px_rgba(59,117,86,0.05)]',
        badgeBg: 'bg-[#e9f2ee] text-[#3b7556] border border-[#cbded3]',
        badgeText: 'text-[#3b7556]'
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
        bg: 'bg-[#020206]',
        card: 'bg-[#080811]/95 border border-cyan-500/25 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md',
        cardHover: 'hover:border-pink-500/40 hover:bg-[#0c0d1e]/95 hover:shadow-[0_0_25px_rgba(236,72,153,0.2)]',
        textPrimary: 'text-[#00f3ff] drop-shadow-[0_0_2px_rgba(0,243,255,0.3)] font-mono',
        textSecondary: 'text-stone-400 font-mono text-[11px]',
        accent: 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-stone-950 font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(0,243,255,0.4)]',
        accentHover: 'hover:opacity-90 hover:scale-105 transition-allDuration-300',
        accentText: 'text-[#00f3ff] font-mono font-bold',
        border: 'border-cyan-500/20',
        borderAccent: 'border-fuchsia-500/40',
        buttonBg: 'bg-[#0c0f1d] border border-cyan-500/20 hover:border-pink-500/50 text-cyan-400 hover:text-[#00f3ff] hover:bg-[#11172a] transition-all',
        glow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]',
        badgeBg: 'bg-cyan-500/10 text-[#00f3ff] border border-cyan-500/30 font-mono text-[10px]',
        badgeText: 'text-[#00f3ff]'
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
