import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, KeyRound, LockKeyhole, Info, Volume2, VolumeX, ShieldAlert, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EchelonTheme } from '../types';
import { getColorTokens, isThemeLight } from '../utils/theme';
import { hashPin } from '../utils/security';
import { EchelonIcon } from './CoolIcons';

// Retro-alien cyber-tech sound synthesizers using Web Audio API
const playPinSound = (type: 'tick' | 'error' | 'access_granted') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (type === 'tick') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(440.00, audioCtx.currentTime + 0.08);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'error') {
      const now = audioCtx.currentTime;
      const freqs = [293.66, 277.18]; // Double soft minor third decay (non-jarring)
      freqs.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        
        gain.gain.setValueAtTime(0.03, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.25);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.27);
      });
    } else if (type === 'access_granted') {
      const now = audioCtx.currentTime;
      const freqs = [329.63, 415.30, 493.88, 587.33, 739.99]; // EMaj9 luxurious sweep chord
      freqs.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now + i * 0.04);
        
        gain.gain.setValueAtTime(0.0, now + i * 0.04);
        gain.gain.linearRampToValueAtTime(0.035, now + i * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.38);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.4);
      });
    }
  } catch (e) {
    // blocked or unsupported
  }
};

const triggerPhysicalHaptic = (type: 'tap' | 'heavy' | 'double') => {
  try {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      if (type === 'tap') {
        window.navigator.vibrate(10);
      } else if (type === 'double') {
        window.navigator.vibrate([60, 40, 60]);
      } else if (type === 'heavy') {
        window.navigator.vibrate(100);
      }
    }
  } catch (_) {}
};

interface PasscodeScreenProps {
  theme: EchelonTheme;
  pinHash: string;
  onUnlock: (pin: string) => boolean;
  onSetPin: (newPin: string) => void;
  selectedGalleryIcon?: 'stealth-matte-gold' | 'vanguard-black-steel' | 'regal-obsidian-gold';
  onResetApp?: () => void;
}

export default function PasscodeScreen({ 
  theme, 
  pinHash, 
  onUnlock, 
  onSetPin,
  selectedGalleryIcon = 'stealth-matte-gold',
  onResetApp,
}: PasscodeScreenProps) {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(!pinHash);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Set, Step 2: Confirm
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);
  const [showPin, setShowPin] = useState<boolean>(false);

  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [showForgotConfirm, setShowForgotConfirm] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    setIsRegistering(!pinHash);
    if (!pinHash) {
      setStep(1);
    }
  }, [pinHash]);

  const tokens = getColorTokens(theme);
  const isLight = isThemeLight(theme);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');
      if (soundEnabled) playPinSound('tick');
      triggerPhysicalHaptic('tap');
    }
  };

  const handleClear = () => {
    setPin('');
    if (soundEnabled) playPinSound('tick');
    triggerPhysicalHaptic('tap');
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    if (soundEnabled) playPinSound('tick');
    triggerPhysicalHaptic('tap');
  };

  const verifyOrSet = () => {
    if (pin.length < 4) {
      setErrorMsg('DEC_PIN must be complete 4 hexadecimal channels');
      triggerShake();
      if (soundEnabled) playPinSound('error');
      triggerPhysicalHaptic('double');
      return;
    }

    if (isRegistering) {
      if (step === 1) {
        setConfirmPin(pin);
        setPin('');
        setStep(2);
        if (soundEnabled) playPinSound('access_granted');
        triggerPhysicalHaptic('tap');
      } else {
        if (pin === confirmPin) {
          onSetPin(pin);
          if (soundEnabled) playPinSound('access_granted');
          triggerPhysicalHaptic('heavy');
        } else {
          setErrorMsg('CIPHER_MISMATCH: Passcode confirmation does not resolve. Redoing set...');
          setPin('');
          setConfirmPin('');
          setStep(1);
          triggerShake();
          if (soundEnabled) playPinSound('error');
          triggerPhysicalHaptic('double');
        }
      }
    } else {
      const success = onUnlock(pin);
      if (!success) {
        setWrongAttempts((prev) => {
          const next = prev + 1;
          if (next >= 4) {
            setErrorMsg('MAX ATTEMPTS EXCEEDED: INITIATING SECURE DATABASE SHIFT & GENERAL FLUSH...');
            setTimeout(() => {
              executeHardReset();
            }, 1200);
          } else if (next >= 3) {
            setErrorMsg(`SECURITY BREACH WARNING: Decryption key failed. Wipe threshold imminent. (Attempts: ${next}/4)`);
          } else {
            setErrorMsg(`DECRYPTION FAILURE: Access code invalid. (Attempts: ${next}/4)`);
          }
          return next;
        });
        setPin('');
        triggerShake();
        if (soundEnabled) playPinSound('error');
        triggerPhysicalHaptic('double');
      } else {
        setWrongAttempts(0);
        if (soundEnabled) playPinSound('access_granted');
        triggerPhysicalHaptic('heavy');
      }
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      const timer = setTimeout(() => {
        verifyOrSet();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const executeHardReset = () => {
    if (onResetApp) {
      onResetApp();
    } else {
      localStorage.clear();
    }
    setWrongAttempts(0);
    setIsRegistering(true);
    setStep(1);
    setPin('');
    setConfirmPin('');
    setShowForgotConfirm(false);
    setErrorMsg('DATABASE RE-INSTANTIATED: Setup a new 4-digit security code:');
    if (soundEnabled) playPinSound('access_granted');
    triggerPhysicalHaptic('heavy');
  };

  return (
    <div id="secure-unlock-screen" className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 ${tokens.bg} font-sans text-xs transition-colors duration-500`}>
      
      {/* Blueprint grid lines layout */}
      <div className={`absolute inset-0 bg-grid-pattern ${isLight ? 'opacity-5' : 'opacity-10'} pointer-events-none select-none`} />
      <div className={`absolute top-0 inset-x-0 h-44 bg-gradient-to-b ${isLight ? 'from-sky-500/5' : 'from-cyan-500/5'} to-transparent blur-3xl pointer-events-none`} />

      <div className={`w-full max-w-md p-8 sm:p-11 py-10 sm:py-12 rounded-3xl ${tokens.card} ${tokens.glow} border text-center relative overflow-hidden transition-all duration-300 premium-reflecting-top ${shake ? 'animate-shake' : ''}`}>
        
        {/* Glowing laser scanning horizontal swipe */}
        <div className={`absolute inset-x-0 top-0 h-[1.5px] ${isLight ? 'bg-sky-400/20' : 'bg-cyan-500/30'} pointer-events-none`} />

        {/* Top Header Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className={`h-15 w-15 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#030308] border-stone-850'} rounded-2xl border p-1.5 flex items-center justify-center mb-4 select-none`}>
              <EchelonIcon name={selectedGalleryIcon || 'stealth-matte-gold'} size="100%" />
            </div>
            {/* Gallery system notification badge with subtle ping */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pink-500 border border-[#0d0d15] text-[7.5px] font-black text-white items-center justify-center font-mono">1</span>
            </span>
          </div>

          <h1 className={`text-xl font-display font-bold tracking-widest uppercase ${tokens.textPrimary}`}>ECHELON</h1>
          <p className={`text-[10px] uppercase font-bold tracking-widest select-none ${tokens.textSecondary} opacity-70 mt-1.5`}>• build quiet wealth •</p>
        </div>

        {/* Decryption status */}
        <p className={`text-[11px] mb-5 font-sans font-medium uppercase tracking-wider ${tokens.textSecondary}`}>
          {isRegistering 
            ? (step === 1 ? 'Configure 4-digit passkey:' : 'Confirm 4-digit passkey:') 
            : 'Enter passkey to open ledger:'
          }
        </p>

        {/* Glowing Pin dots indicator */}
        <div className="flex justify-center gap-4.5 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`h-4 w-4 rounded-full transition-all duration-350 border ${
                pin.length > index
                  ? isLight
                    ? 'bg-teal-650 border-teal-600 scale-110 shadow-xs'
                    : 'bg-amber-500 border-amber-400 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.7)]'
                  : isLight
                    ? 'bg-transparent border-stone-300'
                    : 'bg-transparent border-white/10'
              }`}
            />
          ))}
        </div>

        {/* Secure Phone Gallery Notification alert (without revealing sensitive data) */}
        <div id="lockscreen-gallery-integrity-alert" className={`mb-5 p-2 rounded-xl border ${isLight ? 'border-[#00f3ff]/30 bg-[#00f3ff]/5' : 'border-[#00f3ff]/10 bg-[#00f3ff]/5'} flex items-center justify-center gap-2 select-none max-w-[280px] mx-auto`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f3ff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00f3ff]"></span>
          </span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            System: Phone Gallery Alert Active
          </span>
        </div>

        {/* Forgot PIN/Format Option link */}
        {!isRegistering && (
          <div className="mb-4">
            <button
              type="button"
              id="quick-forgot-pin-btn"
              onClick={() => {
                setShowForgotConfirm(true);
                setWrongAttempts(0);
              }}
              className="text-[10px] text-stone-500 hover:text-stone-300 transition-colors font-sans uppercase font-bold tracking-wider cursor-pointer"
            >
              Forgot Crypt PIN?
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <p className={`text-[10.5px] text-rose-500 font-extrabold mb-5 animate-pulse uppercase leading-relaxed border border-rose-500/25 bg-rose-500/5 p-2.5 rounded-xl font-sans transition-all duration-300 ${wrongAttempts >= 3 ? 'border-rose-500 bg-rose-950/40 text-rose-400 scale-[1.02] shadow-[0_0_12px_rgba(239,68,68,0.5)]' : ''}`}>
            {errorMsg}
          </p>
        )}

        {/* Hard reset warnings */}
        <AnimatePresence>
          {wrongAttempts >= 3 && !showForgotConfirm && (
            <motion.div 
              key="emergency-flush-box"
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 180 }}
              className="my-4 p-4.5 rounded-xl border border-rose-500/35 bg-rose-950/20 text-left space-y-3 overflow-hidden text-stone-300 font-sans"
            >
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 text-rose-550 shrink-0 mt-0.5 animate-bounce text-rose-500" />
                <div>
                  <span className="text-[11.5px] font-black text-rose-400 block uppercase">EMERGENCY FLUSH ACTIVATE?</span>
                  <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                    Too many unauthorized decryption failures detected. System integrity requires a hard format of stored caches.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  id="wrong-attempts-reset-yes-btn"
                  onClick={executeHardReset}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold font-sans uppercase tracking-wider text-[9.5px] cursor-pointer"
                >
                  FORMAT DATABASE
                </button>
                <button
                  type="button"
                  id="wrong-attempts-reset-dismiss-btn"
                  onClick={() => setWrongAttempts(0)}
                  className="py-2 px-3.5 border border-white/10 hover:bg-white/5 text-stone-300 rounded-lg text-[9.5px] cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Forgot PIN Confirmation Card */}
        <AnimatePresence>
          {showForgotConfirm && (
            <motion.div 
              key="forgot-pin-box"
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 180 }}
              className="my-4 p-4.5 rounded-xl border border-rose-500/35 bg-rose-950/20 text-left space-y-3 overflow-hidden text-stone-300 font-sans"
            >
              <div className="flex items-start gap-2.5">
                <Info className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11.5px] font-black block text-rose-400 uppercase">PURGE ECHELON MATRIX?</span>
                  <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                    Decrypting local storage requires standard PIN. Wiping will delete all registered assets, loan targets, and transaction histories permanently.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  id="forgot-pin-confirm-yes-btn"
                  onClick={executeHardReset}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold font-sans uppercase text-[9.5px] tracking-wider cursor-pointer text-center"
                >
                  CONFIRM FORMAT
                </button>
                <button
                  type="button"
                  id="forgot-pin-confirm-cancel-btn"
                  onClick={() => setShowForgotConfirm(false)}
                  className="py-2 px-3.5 border border-white/10 hover:bg-white/5 text-stone-300 rounded-lg text-[9.5px] cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Keypad dial */}
        <div className="grid grid-cols-3 gap-3.5 max-w-sm mx-auto mb-2 mt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              id={`dial-btn-${num}`}
              onClick={() => handleKeyPress(num)}
              className={`h-11 sm:h-13 border transition-all duration-200 flex items-center justify-center cursor-pointer font-mono text-base font-black rounded-xl hover:scale-105 active:scale-95 ${
                isLight 
                  ? 'border-stone-250 bg-stone-50 hover:bg-stone-100 text-stone-850 shadow-xs' 
                  : 'border-white/5 bg-[#171f2c]/50 hover:bg-[#1f293b]/70 text-stone-100 hover:border-white/15'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            id="dial-btn-clear"
            onClick={handleClear}
            className={`h-11 sm:h-13 border transition-all duration-200 flex items-center justify-center cursor-pointer font-sans text-[11px] sm:text-[11.5px] uppercase font-bold rounded-xl ${
              isLight 
                ? 'border-stone-250 bg-stone-50 hover:bg-stone-100 text-rose-600 hover:border-rose-300' 
                : 'border-white/5 bg-[#171f2c]/50 hover:bg-[#1f293b]/70 text-rose-450 text-rose-400 hover:border-rose-500/40'
            }`}
          >
            Clear
          </button>
          <button
            type="button"
            id="dial-btn-0"
            onClick={() => handleKeyPress('0')}
            className={`h-11 sm:h-13 border transition-all duration-200 flex items-center justify-center cursor-pointer font-mono text-base font-black rounded-xl hover:scale-105 active:scale-95 ${
              isLight 
                ? 'border-stone-250 bg-stone-50 hover:bg-stone-100 text-stone-850 shadow-xs' 
                : 'border-white/5 bg-[#171f2c]/50 hover:bg-[#1f293b]/70 text-stone-100 hover:border-white/15'
              }`}
          >
            0
          </button>
          <button
            type="button"
            id="dial-btn-backspace"
            onClick={handleBackspace}
            className={`h-11 sm:h-13 border transition-all duration-200 flex items-center justify-center cursor-pointer font-sans text-[11px] sm:text-[11.5px] uppercase font-bold rounded-xl hover:scale-105 active:scale-95 ${
              isLight 
                ? 'border-stone-250 bg-stone-50 hover:bg-stone-100 text-teal-600 hover:border-teal-300 shadow-xs' 
                : 'border-white/5 bg-[#171f2c]/50 hover:bg-[#1f293b]/70 text-teal-400 hover:border-teal-500/40'
            }`}
          >
            Del
          </button>
        </div>

      </div>
    </div>
  );
}
