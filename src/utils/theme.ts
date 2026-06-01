/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export function getColorTokens(theme: EchelonTheme): ColorTokens {
  const isDark = theme.mode === 'dark';
  
  if (theme.palette === 'black') {
    return {
      bg: isDark ? 'bg-zinc-950' : 'bg-stone-50',
      card: isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-stone-200 shadow-sm',
      cardHover: isDark ? 'hover:border-amber-500/30 hover:bg-zinc-900' : 'hover:border-stone-400 hover:bg-stone-50/50',
      textPrimary: isDark ? 'text-stone-100' : 'text-stone-900',
      textSecondary: isDark ? 'text-stone-400' : 'text-stone-500',
      accent: isDark ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-amber-400',
      accentHover: isDark ? 'hover:bg-amber-400' : 'hover:bg-stone-850',
      accentText: isDark ? 'text-amber-400' : 'text-stone-950',
      border: isDark ? 'border-zinc-800' : 'border-stone-200',
      borderAccent: isDark ? 'border-amber-500/40' : 'border-stone-900',
      buttonBg: isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-stone-200' : 'bg-stone-200 hover:bg-stone-300 text-stone-900',
      glow: isDark ? 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'shadow-[0_0_10px_rgba(41,37,36,0.06)]',
      badgeBg: isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-stone-150 text-stone-900 border border-stone-200',
      badgeText: isDark ? 'text-amber-400' : 'text-stone-900'
    };
  }
  
  if (theme.palette === 'silver') {
    return {
      bg: isDark ? 'bg-slate-900' : 'bg-slate-50',
      card: isDark ? 'bg-slate-850/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
      cardHover: isDark ? 'hover:border-blue-400/30 hover:bg-slate-850' : 'hover:border-slate-400 hover:bg-slate-50/50',
      textPrimary: isDark ? 'text-slate-100' : 'text-slate-900',
      textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
      accent: isDark ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white',
      accentHover: isDark ? 'hover:bg-blue-500' : 'hover:bg-slate-850',
      accentText: isDark ? 'text-blue-400' : 'text-slate-900',
      border: isDark ? 'border-slate-800' : 'border-slate-200',
      borderAccent: isDark ? 'border-blue-500/40' : 'border-slate-900',
      buttonBg: isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-950',
      glow: isDark ? 'shadow-[0_0_15px_rgba(37,99,235,0.15)]' : 'shadow-[0_0_10px_rgba(148,163,184,0.06)]',
      badgeBg: isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-100 text-slate-900 border border-slate-200',
      badgeText: isDark ? 'text-blue-500' : 'text-slate-900'
    };
  }
  
  if (theme.palette === 'elegant-dark') {
    return {
      bg: 'bg-[#050505]',
      card: 'bg-[#0F0F0F] border-[#262626]',
      cardHover: 'hover:border-[#444444] hover:bg-[#1A1A1A]',
      textPrimary: 'text-[#E5E5E5]',
      textSecondary: 'text-[#888888]',
      accent: 'bg-[#FFFFFF] text-[#050505]',
      accentHover: 'hover:bg-[#D1D5DB]',
      accentText: 'text-[#FFFFFF]',
      border: 'border-[#262626]',
      borderAccent: 'border-[#D1D5DB]',
      buttonBg: 'bg-[#1A1A1A] hover:bg-[#262626] text-[#E5E5E5]',
      glow: 'shadow-[0_0_15px_rgba(255,255,255,0.05)]',
      badgeBg: 'bg-[#1A1A1A] text-[#888888] border border-[#262626]',
      badgeText: 'text-[#E5E5E5]'
    };
  }

  // Midnight Blue default
  return {
    bg: isDark ? 'bg-blue-950' : 'bg-emerald-50/20', // custom light emerald-blue tint
    card: isDark ? 'bg-slate-900/90 border-blue-900/60' : 'bg-white border-blue-150 shadow-sm',
    cardHover: isDark ? 'hover:border-teal-400/30 hover:bg-slate-900' : 'hover:border-blue-300 hover:bg-teal-50/20',
    textPrimary: isDark ? 'text-slate-100' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    accent: isDark ? 'bg-teal-500 text-slate-950' : 'bg-teal-700 text-white',
    accentHover: isDark ? 'hover:bg-teal-400' : 'hover:bg-teal-600',
    accentText: isDark ? 'text-teal-400' : 'text-teal-700',
    border: isDark ? 'border-blue-900/50' : 'border-blue-100',
    borderAccent: isDark ? 'border-teal-500/40' : 'border-teal-500',
    buttonBg: isDark ? 'bg-blue-900/50 hover:bg-blue-900/80 text-teal-300' : 'bg-blue-50 hover:bg-blue-100 text-blue-900',
    glow: isDark ? 'shadow-[0_0_15px_rgba(20,184,166,0.15)]' : 'shadow-[0_0_10px_rgba(20,184,166,0.06)]',
    badgeBg: isDark ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-900 border border-teal-200',
    badgeText: isDark ? 'text-teal-400' : 'text-teal-900'
  };
}
