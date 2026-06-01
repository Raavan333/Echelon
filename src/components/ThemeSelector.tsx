/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Moon, Sparkles, Sliders, Palette } from 'lucide-react';
import { EchelonTheme } from '../types';
import { getColorTokens } from '../utils/theme';

interface ThemeSelectorProps {
  theme: EchelonTheme;
  onChangeTheme: (theme: EchelonTheme) => void;
}

export default function ThemeSelector({ theme, onChangeTheme }: ThemeSelectorProps) {
  const tokens = getColorTokens(theme);

  const toggleMode = () => {
    onChangeTheme({
      ...theme,
      mode: theme.mode === 'dark' ? 'light' : 'dark'
    });
  };

  const selectPalette = (palette: 'black' | 'silver' | 'blue' | 'elegant-dark') => {
    onChangeTheme({
      ...theme,
      palette
    });
  };

  return (
    <div id="theme-selector-widget" className={`p-4 rounded-2xl border ${tokens.card} ${tokens.glow} flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300`}>
      <div className="flex items-center gap-2.5">
        <Palette className="h-5 w-5 text-amber-500" />
        <div>
          <h3 className={`text-sm font-bold ${tokens.textPrimary}`}>Vault Finish & Style</h3>
          <p className="text-xs text-stone-500">Pick premium metal coatings and theme preference</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Dark/Light mode slider toggle */}
        <button
          type="button"
          id="theme-mode-toggle"
          onClick={toggleMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs font-semibold select-none transition-all ${tokens.buttonBg} active:scale-95`}
        >
          {theme.mode === 'dark' ? (
            <>
              <Moon className="h-3.5 w-3.5 text-amber-500" />
              <span>Obsidian (Dark)</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span>Alabaster (Light)</span>
            </>
          )}
        </button>

        {/* Palettes selection */}
        <div className="flex items-center gap-1 bg-stone-300/10 p-1 rounded-xl border border-stone-400/10">
          <button
            type="button"
            id="palette-select-black"
            onClick={() => selectPalette('black')}
            className={`px-3 py-1 text-xs rounded-lg transition-all font-semibold ${
              theme.palette === 'black'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : `text-stone-400 hover:text-stone-200`
            }`}
          >
            Premium Black
          </button>
          
          <button
            type="button"
            id="palette-select-silver"
            onClick={() => selectPalette('silver')}
            className={`px-3 py-1 text-xs rounded-lg transition-all font-semibold ${
              theme.palette === 'silver'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : `text-stone-400 hover:text-stone-200`
            }`}
          >
            Royal Silver
          </button>
          
          <button
            type="button"
            id="palette-select-blue"
            onClick={() => selectPalette('blue')}
            className={`px-3 py-1 text-xs rounded-lg transition-all font-semibold ${
              theme.palette === 'blue'
                ? 'bg-teal-500 text-stone-950 font-bold shadow-sm'
                : `text-stone-400 hover:text-stone-200`
            }`}
          >
            Midnight Blue
          </button>

          <button
            type="button"
            id="palette-select-elegant"
            onClick={() => selectPalette('elegant-dark')}
            className={`px-3 py-1 text-xs rounded-lg transition-all font-semibold ${
              theme.palette === 'elegant-dark'
                ? 'bg-white text-black font-bold shadow-sm'
                : `text-stone-400 hover:text-stone-200`
            }`}
          >
            Elegant Dark
          </button>
        </div>
      </div>
    </div>
  );
}
