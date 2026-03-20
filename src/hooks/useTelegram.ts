import { useEffect, useState, useCallback } from 'react';
import {
  initTelegramApp,
  getTelegramUser,
  getStartParam,
  getPlatform,
  getThemeColors,
  isTelegramEnvironment,
  expandApp,
  triggerHaptic,
  showAlert,
  showConfirm,
  setupBackButton,
  hideBackButton,
  TelegramUser,
} from '../utils/telegram';

export interface UseTelegramResult {
  isReady: boolean;
  isTelegram: boolean;
  user: TelegramUser | null;
  startParam: string | null;
  platform: 'android' | 'ios' | 'desktop' | 'unknown';
  themeColors: Record<string, string>;
  expand: () => void;
  haptic: (type?: 'impact' | 'notification' | 'selection') => void;
  alert: (message: string) => void;
  confirm: (message: string) => Promise<boolean>;
  setupBack: (callback: () => void) => void;
  hideBack: () => void;
}

export function useTelegram(): UseTelegramResult {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [startParam, setStartParam] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | 'unknown'>('unknown');
  const [themeColors, setThemeColors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize Telegram Mini App
    initTelegramApp();
    
    // Get user info
    const telegramUser = getTelegramUser();
    setUser(telegramUser);
    
    // Get start parameter (for joining games via link)
    const param = getStartParam();
    setStartParam(param);
    
    // Get platform
    setPlatform(getPlatform());
    
    // Get theme colors
    setThemeColors(getThemeColors());
    
    // Mark as ready
    setIsReady(true);
    
    // Auto-expand to fullscreen
    expandApp();
  }, []);

  const haptic = useCallback((type: 'impact' | 'notification' | 'selection' = 'impact') => {
    triggerHaptic(type);
  }, []);

  const alert = useCallback((message: string) => {
    showAlert(message);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return showConfirm(message);
  }, []);

  const setupBack = useCallback((callback: () => void) => {
    setupBackButton(callback);
  }, []);

  return {
    isReady,
    isTelegram: isTelegramEnvironment(),
    user,
    startParam,
    platform,
    themeColors,
    expand: expandApp,
    haptic,
    alert,
    confirm,
    setupBack,
    hideBack: hideBackButton,
  };
}