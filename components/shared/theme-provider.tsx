'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
type GlassIntensity = 'default' | 'low';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  glassIntensity: GlassIntensity;
  toggleGlassIntensity: () => void;
  animationsEnabled: boolean;
  toggleAnimationsEnabled: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [glassIntensity, setGlassIntensity] = useState<GlassIntensity>('default');
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('nexus-theme') as Theme;
    if (savedTheme === 'light') {
      setTheme('light');
      document.documentElement.classList.add('light-mode');
    }

    const savedGlass = localStorage.getItem('nexus-glass-intensity') as GlassIntensity;
    if (savedGlass === 'low') {
      setGlassIntensity('low');
      document.documentElement.classList.add('low-glass');
    }

    const savedAnim = localStorage.getItem('nexus-animations-enabled');
    if (savedAnim === 'false') {
      setAnimationsEnabled(false);
      document.documentElement.classList.add('no-animations');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('nexus-theme', next);
      if (next === 'light') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
      return next;
    });
  };

  const toggleGlassIntensity = () => {
    setGlassIntensity(prev => {
      const next = prev === 'default' ? 'low' : 'default';
      localStorage.setItem('nexus-glass-intensity', next);
      if (next === 'low') {
        document.documentElement.classList.add('low-glass');
      } else {
        document.documentElement.classList.remove('low-glass');
      }
      return next;
    });
  };

  const toggleAnimationsEnabled = () => {
    setAnimationsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('nexus-animations-enabled', String(next));
      if (!next) {
        document.documentElement.classList.add('no-animations');
      } else {
        document.documentElement.classList.remove('no-animations');
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      glassIntensity,
      toggleGlassIntensity,
      animationsEnabled,
      toggleAnimationsEnabled
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

