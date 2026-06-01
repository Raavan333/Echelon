/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  outerIcon?: 'stealth-matte-gold' | 'vanguard-black-steel' | 'regal-obsidian-gold';
  innerIcon?: 'stealth-matte-gold' | 'vanguard-black-steel' | 'regal-obsidian-gold';
}

export default function PasscodeScreen({ 
  theme, 
  pinHash, 
  onUnlock, 
  onSetPin,
  outerIcon = 'stealth-matte-gold',
  innerIcon = 'regal-obsidian-gold',
}: PasscodeScreenProps) {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(!pinHash);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Set, Step 2: Confirm
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);
  const [showPin, setShowPin] = useState<boolean>(false);

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
        setErrorMsg('Invalid Vault PIN. Decryption Failed.');
        setPin('');
        triggerShake();
      }
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
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
            <EchelonIcon name={outerIcon} size="100%" />
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

        {/* Error notification */}
        {errorMsg && (
          <p className="text-xs text-red-500 font-semibold mb-4 animate-pulse">
            {errorMsg}
          </p>
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
        <div className="pt-5 border-t border-dashed border-stone-800 mt-4">
          <p className="text-[10px] text-stone-500 mb-2 leading-relaxed">
            Forget your passcode? You can hard-reset your Echelon database. Doing so will permanently delete all records inside this browser storage namespace.
          </p>
          <button
            type="button"
            id="forgot-pin-reset-app-btn"
            onClick={() => {
              if (window.confirm("CRITICAL WARNING: This will permanently purge and wipe out ALL of your locally encrypted treasury data, assets, budget, and configurations. There is NO recovery. Do you want to format and reset your PIN?")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="text-[10px] text-rose-500 hover:text-rose-400 font-mono font-bold uppercase tracking-wider transition-all border border-rose-500/10 px-3 py-1.5 rounded-xl bg-rose-500/5 hover:bg-rose-500/10"
          >
            Purge Ledger DB & Reset PIN
          </button>
        </div>

      </div>
    </div>
  );
}
