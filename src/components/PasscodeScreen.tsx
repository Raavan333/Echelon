/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, KeyRound, LockKeyhole, Info } from 'lucide-react';
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

  useEffect(() => {
    setIsRegistering(!pinHash);
    if (!pinHash) {
      setStep(1);
    }
  }, [pinHash]);

  const tokens = getColorTokens(theme);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const verifyOrSet = () => {
    if (pin.length < 4) {
      setErrorMsg('PIN must be 4 digits');
      triggerShake();
      return;
    }

    if (isRegistering) {
      if (step === 1) {
        setConfirmPin(pin);
        setPin('');
        setStep(2);
      } else {
        if (pin === confirmPin) {
          onSetPin(pin);
        } else {
          setErrorMsg('PINs do not match. Resetting...');
          setPin('');
          setConfirmPin('');
          setStep(1);
          triggerShake();
        }
      }
    } else {
      const success = onUnlock(pin);
      if (!success) {
        setWrongAttempts((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            setErrorMsg(`Invalid Vault PIN. Decryption Failed. (Attempts: ${next})`);
          } else {
            setErrorMsg('Invalid Vault PIN. Decryption Failed.');
          }
          return next;
        });
        setPin('');
        triggerShake();
      } else {
        setWrongAttempts(0);
      }
    }
  };

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
    setErrorMsg('System formatted. Set up a brand new 4-digit PIN:');
  };

  return (
    <div id="secure-unlock-screen" className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 transition-colors duration-500 ${tokens.bg}`}>
      
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none select-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-500/30 blur-3xl" />
      </div>

      <div className={`w-full max-w-md p-8 rounded-3xl border ${tokens.card} ${tokens.glow} text-center relative overflow-hidden transition-all duration-300 ${shake ? 'animate-bounce' : ''}`}>
        
        {/* Top Header Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 bg-[#141517] rounded-3xl border border-stone-800 p-1.5 flex items-center justify-center shadow-2xl mb-4 select-none">
            <EchelonIcon name={selectedGalleryIcon || 'stealth-matte-gold'} size="100%" />
          </div>

          <h1 className={`text-2xl font-bold tracking-tight ${tokens.textPrimary}`}>ECHELON</h1>
          <p className={`text-xs uppercase tracking-widest font-mono text-amber-500 mt-1`}>BUILD QUIET WEALTH</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs bg-stone-300/10 px-2.5 py-1 rounded-full text-zinc-400">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>AES-256 Client-Side Payload Cipher</span>
          </div>
        </div>

        {/* Action instruction */}
        <p className={`text-sm mb-6 ${tokens.textSecondary}`}>
          {isRegistering 
            ? (step === 1 ? 'Configure an Offline Access PIN to encrypt your ledgers:' : 'Re-verify Your Security Access PIN:') 
            : 'Enter secure key code to decrypt your private treasury:'
          }
        </p>

        {/* Glowing Pin dots indicator */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`h-4 w-4 rounded-full transition-all duration-200 border ${
                pin.length > index
                  ? 'bg-amber-500 border-amber-500 scale-125 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                  : 'bg-transparent border-stone-600'
              }`}
            />
          ))}
        </div>

        {/* Quick Forgot PIN Option link */}
        {!isRegistering && (
          <div className="mb-4 -mt-3">
            <button
              type="button"
              id="quick-forgot-pin-btn"
              onClick={() => {
                setShowForgotConfirm(true);
                setWrongAttempts(0);
              }}
              className="text-xs text-stone-400 hover:text-amber-500 transition-colors font-medium cursor-pointer underline underline-offset-4 decoration-stone-600 hover:decoration-amber-500"
            >
              Forgot PIN?
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <p className="text-xs text-red-500 font-semibold mb-4 animate-pulse">
            {errorMsg}
          </p>
        )}

        {/* Dynamic Reset prompt on multiple failures */}
        {wrongAttempts >= 3 && !showForgotConfirm && (
          <div className="my-5 p-4 rounded-2xl border border-rose-500/20 bg-rose-950/20 text-left space-y-3 shadow-md">
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-rose-250 block text-rose-200">Perform Security Reset?</span>
                <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                  You have entered the wrong passcode multiple times. Would you like to perform a hard reset and wipe the current database to create a new key?
                </p>
              </div>
            </div>
            <div className="bg-stone-950/60 p-2.5 rounded-xl border border-rose-950/40">
              <span className="text-[9px] uppercase font-bold text-rose-400 font-mono block">⚠️ CRITICAL WARNING</span>
              <p className="text-[9px] text-stone-500 mt-0.5 leading-tight">
                This will perform a hard reset and permanently erase all existing data in the application.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                id="wrong-attempts-reset-yes-btn"
                onClick={executeHardReset}
                className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all shadow cursor-pointer text-center"
              >
                Yes, Reset Application
              </button>
              <button
                type="button"
                id="wrong-attempts-reset-dismiss-btn"
                onClick={() => setWrongAttempts(0)}
                className="py-1.5 px-3 border border-stone-800 hover:bg-stone-850/50 text-stone-300 rounded-xl text-[10px] font-mono transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Custom Forgot PIN Confirmation Card */}
        {showForgotConfirm && (
          <div className="my-5 p-4 rounded-2xl border border-rose-500/30 bg-rose-950/30 text-left space-y-3 shadow-2xl animate-pulse">
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-rose-100 block">Reset Echelon Application?</span>
                <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                  Requesting passcode or database formatting. This will securely erase your local Echelon ledger database files entirely. Like starting the application from scratch, you will immediately configure a brand-new access PIN.
                </p>
              </div>
            </div>
            <div className="bg-stone-950/60 p-2.5 rounded-xl border border-rose-950/50">
              <span className="text-[9px] uppercase font-bold text-rose-400 font-mono block">⚠️ RESET CONSEQUENCES</span>
              <p className="text-[9px] text-stone-500 mt-0.5 leading-tight">
                This action is permanent. All budget targets, current assets list, active loan contracts, and history reports will be completely wiped out.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                id="forgot-pin-confirm-yes-btn"
                onClick={executeHardReset}
                className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all shadow cursor-pointer text-center"
              >
                Yes, Reset Echelon
              </button>
              <button
                type="button"
                id="forgot-pin-confirm-cancel-btn"
                onClick={() => setShowForgotConfirm(false)}
                className="py-1.5 px-3 border border-stone-800 hover:bg-stone-850/50 text-stone-300 rounded-xl text-[10px] font-mono transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Interactive Keypad dial */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              id={`dial-btn-${num}`}
              onClick={() => handleKeyPress(num)}
              className={`h-14 rounded-2xl font-mono text-xl font-bold transition-all border flex items-center justify-center ${tokens.card} ${tokens.textPrimary} hover:scale-105 active:scale-95`}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            id="dial-btn-clear"
            onClick={handleBackspace}
            className={`h-14 rounded-2xl font-mono text-xs font-semibold uppercase flex items-center justify-center ${tokens.card} ${tokens.textSecondary} hover:text-amber-500`}
          >
            Clear
          </button>
          <button
            type="button"
            id="dial-btn-0"
            onClick={() => handleKeyPress('0')}
            className={`h-14 rounded-2xl font-mono text-xl font-bold border flex items-center justify-center ${tokens.card} ${tokens.textPrimary} hover:scale-105`}
          >
            0
          </button>
          <button
            type="button"
            id="dial-btn-confirm"
            onClick={verifyOrSet}
            className="h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all text-xs uppercase flex items-center justify-center tracking-wider shadow-md hover:scale-105 active:scale-95"
          >
            Verify
          </button>
        </div>

        {/* Forgot PIN Purge Mechanism */}
        <div className="pt-5 border-t border-dashed border-stone-300/10 mt-4">
          <p className="text-[10px] text-stone-500 mb-2 leading-relaxed">
            Forget your passcode? Request a hard-reset of your Echelon database. Doing so will permanently delete all records inside this application.
          </p>
          <button
            type="button"
            id="forgot-pin-reset-app-btn"
            onClick={() => setShowForgotConfirm(true)}
            className="text-[10px] text-rose-500 hover:text-rose-400 font-mono font-bold uppercase tracking-wider transition-all border border-rose-500/10 px-3 py-1.5 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer"
          >
            Purge Ledger DB & Reset PIN
          </button>
        </div>

      </div>
    </div>
  );
}
