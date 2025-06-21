import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  signLanguage: boolean;
  signLanguageType: 'ASL' | 'BSL' | 'ISL';
  voiceSpeed: number;
  transcriptionEnabled: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string) => void;
}

const defaultSettings: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReader: true,
  signLanguage: false,
  signLanguageType: 'ASL',
  voiceSpeed: 1.0,
  transcriptionEnabled: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export default function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('accessibility-settings', JSON.stringify(updated));
  };

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, announceToScreenReader }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}