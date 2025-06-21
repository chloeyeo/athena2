import React, { useState } from 'react';
import { Accessibility, Volume2, Eye, Type, Languages, Contrast } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export default function AccessibilityToolbar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { settings, updateSettings } = useAccessibility();

  return (
    <div className="fixed top-0 right-0 z-50 bg-white shadow-lg border-l border-b border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 flex items-center space-x-2 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500"
        aria-label="Accessibility settings"
        aria-expanded={isExpanded}
      >
        <Accessibility className="w-5 h-5 text-primary-600" />
        <span className="text-sm font-medium">Accessibility</span>
      </button>

      {isExpanded && (
        <div className="p-4 w-80 border-t border-gray-200 bg-white">
          <h3 className="font-semibold text-gray-900 mb-4">Accessibility Settings</h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Type className="w-4 h-4" />
                <span className="text-sm">Large Text</span>
              </span>
              <input
                type="checkbox"
                checked={settings.largeText}
                onChange={(e) => updateSettings({ largeText: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Contrast className="w-4 h-4" />
                <span className="text-sm">High Contrast</span>
              </span>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => updateSettings({ highContrast: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span className="text-sm">Reduced Motion</span>
              </span>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Languages className="w-4 h-4" />
                <span className="text-sm">Sign Language</span>
              </span>
              <input
                type="checkbox"
                checked={settings.signLanguage}
                onChange={(e) => updateSettings({ signLanguage: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            {settings.signLanguage && (
              <div className="ml-6 space-y-2">
                <label className="text-sm text-gray-600">Sign Language Type:</label>
                <select
                  value={settings.signLanguageType}
                  onChange={(e) => updateSettings({ signLanguageType: e.target.value as 'ASL' | 'BSL' | 'ISL' })}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ASL">American Sign Language (ASL)</option>
                  <option value="BSL">British Sign Language (BSL)</option>
                  <option value="ISL">Irish Sign Language (ISL)</option>
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center space-x-2 mb-2">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm">Voice Speed</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.voiceSpeed}
                onChange={(e) => updateSettings({ voiceSpeed: parseFloat(e.target.value) })}
                className="w-full"
                aria-label="Voice speed control"
              />
              <div className="text-xs text-gray-500 text-center">{settings.voiceSpeed}x</div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Changes are saved automatically and apply immediately.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}