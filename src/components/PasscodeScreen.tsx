import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, KeyRound, LockKeyhole, Info, Volume2, VolumeX, ShieldAlert, Cpu } from 'lucide-react';
import { EchelonTheme } from '../types';
import { getColorTokens } from '../utils/theme';
import { hashPin } from '../utils/security';
import { EchelonIcon } from './CoolIcons';

interface PasscodeScreenProps {
  theme: EchelonTheme;
  pinHash: string;
  onUnlock: (pin: string) => boolean;
  onSetPin: (newPin: string) => void;
  selectedGalleryIcon?: 'stealth-matte-gold' | 'vanguard-black-steel' | 'regal-obsidian-gold';
  onResetApp?: () => void;
}

// Retro-alien cyber-tech sound synthesizers using Web Audio API
const playPinSound = (type: 'tick' | 'error' | 'access_granted') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (type === 'tick') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime); // High pitch tick
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'error') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, audioCtx.currentTime); // low buzz
      osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'access_granted') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.08); // C#5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.16); // E5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.24); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    }
  } catch (e) {
    // blocked or unsupported
  }
};

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
  const isLight = theme.mode === 'light';

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');
      if (soundEnabled) playPinSound('tick');
    }
  };

  const handleClear = () => {
    setPin('');
    if (soundEnabled) playPinSound('tick');
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    if (soundEnabled) playPinSound('tick');
  };

  const verifyOrSet = () => {
    if (pin.length < 4) {
      setErrorMsg('DEC_PIN must be complete 4 hexadecimal channels');
      triggerShake();
      if (soundEnabled) playPinSound('error');
      return;
    }

    if (isRegistering) {
      if (step === 1) {
        setConfirmPin(pin);
        setPin('');
        setStep(2);
        if (soundEnabled) playPinSound('access_granted');
      } else {
        if (pin === confirmPin) {
          onSetPin(pin);
          if (soundEnabled) playPinSound('access_granted');
        } else {
          setErrorMsg('CIPHER_MISMATCH: Passcode confirmation does not resolve. Redoing set...');
          setPin('');
          setConfirmPin('');
          setStep(1);
          triggerShake();
          if (soundEnabled) playPinSound('error');
        }
      }
    } else {
      const success = onUnlock(pin);
      if (!success) {
        setWrongAttempts((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            setErrorMsg(`SECURITY BREACH WARNING: Decryption key failed. Wipe threshold imminent. (Attempts: ${next}/4)`);
          } else {
            setErrorMsg('DECRYPTION FAILURE: Access code invalid.');
          }
          return next;
        });
        setPin('');
        triggerShake();
        if (soundEnabled) playPinSound('error');
      } else {
        setWrongAttempts(0);
        if (soundEnabled) playPinSound('access_granted');
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
  };

  return (
    <div id="secure-unlock-screen" className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 ${tokens.bg} font-mono text-xs transition-colors duration-500`}>
      
      {/* Blueprint grid lines layout */}
      <div className={`absolute inset-0 bg-grid-pattern ${isLight ? 'opacity-5' : 'opacity-10'} pointer-events-none select-none`} />
      <div className={`absolute top-0 inset-x-0 h-44 bg-gradient-to-b ${isLight ? 'from-sky-500/5' : 'from-cyan-500/5'} to-transparent blur-3xl pointer-events-none`} />

      <div className={`w-full max-w-sm p-8 rounded-3xl ${tokens.card} ${tokens.glow} border text-center relative overflow-hidden transition-all duration-300 ${shake ? 'animate-bounce' : ''}`}>
        
        {/* Glowing laser scanning horizontal swipe */}
        <div className={`absolute inset-x-0 top-0 h-[1.5px] ${isLight ? 'bg-sky-400/20' : 'bg-cyan-550/30'} pointer-events-none`} />

        {/* Top Header Logo */}
        <div className="flex flex-col items-center mb-5">
          <div className={`h-14 w-14 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#030308] border-stone-850'} rounded-2xl border p-1.5 flex items-center justify-center mb-3 select-none`}>
            <EchelonIcon name={selectedGalleryIcon || 'stealth-matte-gold'} size="100%" />
          </div>

          <h1 className={`text-base font-mono font-black tracking-widest uppercase ${tokens.textPrimary}`}>ECHELON</h1>
          <p className={`text-[10px] lowercase font-bold tracking-wider select-none ${tokens.textSecondary} opacity-70 mt-1`}>• build quiet wealth</p>
        </div>

        {/* Decryption status */}
        <p className={`text-[10px] mb-5 font-mono ${tokens.textSecondary}`}>
          {isRegistering 
            ? (step === 1 ? 'Configure 4-digit passkey:' : 'Confirm 4-digit passkey:') 
            : 'Enter passkey to open ledger:'
          }
        </p>

        {/* Glowing Pin dots indicator */}
        <div className="flex justify-center gap-4 mb-5">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`h-3.5 w-3.5 rounded-full transition-all duration-300 border ${
                pin.length > index
                  ? isLight
                    ? 'bg-teal-650 border-teal-600 scale-110 shadow-xs'
                    : 'bg-amber-550 border-amber-500 scale-110 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                  : isLight
                    ? 'bg-transparent border-stone-300'
                    : 'bg-transparent border-stone-800'
              }`}
            />
          ))}
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
              className="text-[9.5px] text-stone-500 hover:text-stone-300 transition-colors font-mono uppercase"
            >
              Forgot Crypt PIN?
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <p className="text-[10px] text-rose-500 font-extrabold mb-4 animate-pulse uppercase leading-relaxed border border-rose-500/20 bg-rose-500/5 p-2 rounded">
            {errorMsg}
          </p>
        )}

        {/* Hard reset warnings */}
        {wrongAttempts >= 3 && !showForgotConfirm && (
          <div className="my-4 p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-left space-y-2.5">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <span className="text-[11px] font-black text-rose-455 block uppercase text-rose-400">EMERGENCY FLUSH ACTIVATE?</span>
                <p className="text-[9.5px] text-stone-400 mt-1 leading-relaxed">
                  Too many unauthorized decryption failures detected. System integrity requires a hard format of stored caches.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                id="wrong-attempts-reset-yes-btn"
                onClick={executeHardReset}
                className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold font-mono uppercase tracking-wider text-[9px] cursor-pointer"
              >
                FORMAT DATABASE
              </button>
              <button
                type="button"
                id="wrong-attempts-reset-dismiss-btn"
                onClick={() => setWrongAttempts(0)}
                className="py-1.5 px-3 border border-stone-800 hover:bg-stone-900 text-stone-400 rounded text-[9px]"
              >
                DISMISS
              </button>
            </div>
          </div>
        )}

        {/* Custom Forgot PIN Confirmation Card */}
        {showForgotConfirm && (
          <div className="my-4 p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-left space-y-2.5">
            <div className="flex items-start gap-2">
              <Info className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-black block text-rose-400 uppercase">PURGE ECHELON MATRIX?</span>
                <p className="text-[9.5px] text-stone-400 mt-1 leading-normal">
                  Decrypting local storage requires standard PIN. Wiping will delete all registered assets, loan targets, and transaction histories permanently.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                id="forgot-pin-confirm-yes-btn"
                onClick={executeHardReset}
                className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold font-mono uppercase text-[9px] tracking-wider cursor-pointer text-center"
              >
                CONFIRM FORMAT
              </button>
              <button
                type="button"
                id="forgot-pin-confirm-cancel-btn"
                onClick={() => setShowForgotConfirm(false)}
                className="py-1.5 px-3 border border-stone-800 hover:bg-stone-900 text-stone-400 rounded text-[9px]"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Interactive Keypad dial */}
        <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              id={`dial-btn-${num}`}
              onClick={() => handleKeyPress(num)}
              className={`h-11 border transition-all flex items-center justify-center cursor-pointer font-mono text-sm font-extrabold rounded-xl hover:scale-105 active:scale-95 ${
                isLight 
                  ? 'border-stone-250 bg-stone-50 hover:bg-stone-100 text-stone-850 shadow-xs' 
                  : 'border-stone-850/80 bg-zinc-950/40 hover:bg-stone-900/40 text-stone-100/90 hover:border-stone-700'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            id="dial-btn-clear"
            onClick={handleClear}
            className={`h-11 border transition-all flex items-center justify-center cursor-pointer font-mono text-[9.5px] uppercase font-bold rounded-xl ${
              isLight 
                ? 'border-stone-250 bg-stone-50 hover:bg-stone-100 text-pink-600 hover:border-pink-300' 
                : 'border-stone-850/80 bg-zinc-950/40 hover:bg-stone-900/40 text-pink-500 hover:border-pink-500/45'
            }`}
          >
            Clear
          </button>
          <button
            type="button"
            id="dial-btn-0"
            onClick={() => handleKeyPress('0')}
            className={`h-11 border transition-all flex items-center justify-center cursor-pointer font-mono text-sm font-extrabold rounded-xl hover:scale-105 active:scale-95 ${
              isLight 
                ? 'border-stone-250 bg-stone-50 hover:bg-stone-100 text-stone-850 shadow-xs' 
                : 'border-stone-850/80 bg-zinc-950/40 hover:bg-stone-900/40 text-stone-100/90 hover:border-stone-700'
            }`}
          >
            0
          </button>
          <button
            type="button"
            id="dial-btn-backspace"
            onClick={handleBackspace}
            className={`h-11 border transition-all flex items-center justify-center cursor-pointer font-mono text-[9.5px] uppercase font-bold rounded-xl hover:scale-105 active:scale-95 ${
              isLight 
                ? 'border-stone-250 bg-stone-50 hover:bg-stone-100 text-teal-600 hover:border-teal-300 shadow-xs' 
                : 'border-stone-850/80 bg-zinc-950/40 hover:bg-stone-900/40 text-teal-400 hover:border-teal-500/45'
            }`}
          >
            Del
          </button>
        </div>

      </div>
    </div>
  );
}
