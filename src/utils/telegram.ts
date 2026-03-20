// Telegram Mini App Utilities
// Using the global Telegram WebApp object from telegram-web-app.js

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
}

// Check if running inside Telegram
export function isTelegramEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as unknown as { Telegram?: unknown }).Telegram;
}

// Get Telegram WebApp object
function getWebApp(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as { Telegram?: { WebApp?: Record<string, unknown> } };
  return win.Telegram?.WebApp || null;
}

// Initialize Telegram Mini App
export function initTelegramApp(): void {
  const webApp = getWebApp();
  if (webApp) {
    // WebApp is already initialized by the script
    console.log('Telegram Mini App initialized');
  }
}

// Get Telegram user info
export function getTelegramUser(): TelegramUser | null {
  const webApp = getWebApp();
  if (!webApp) return null;

  const initData = webApp.initData as Record<string, unknown> | undefined;
  const user = initData?.user as Record<string, unknown> | undefined;
  
  if (!user) return null;
  
  return {
    id: user.id as number,
    firstName: (user.first_name as string) || '',
    lastName: user.last_name as string | undefined,
    username: user.username as string | undefined,
    languageCode: user.language_code as string | undefined,
    photoUrl: user.photo_url as string | undefined,
  };
}

// Get start parameter from launch
export function getStartParam(): string | null {
  const webApp = getWebApp();
  if (!webApp) return null;
  
  return (webApp.initDataUnsafe as Record<string, unknown>)?.start_param as string | null || null;
}

// Get platform info
export function getPlatform(): 'android' | 'ios' | 'desktop' | 'unknown' {
  const webApp = getWebApp();
  if (!webApp) return 'unknown';
  
  const platform = webApp.platform as string;
  
  if (platform === 'android') return 'android';
  if (platform === 'ios') return 'ios';
  if (platform === 'tdesktop' || platform === 'macos') return 'desktop';
  return 'unknown';
}

// Get theme colors
export function getThemeColors(): Record<string, string> {
  const webApp = getWebApp();
  
  if (!webApp) {
    return {
      bgColor: '#ffffff',
      textColor: '#000000',
      hintColor: '#999999',
      linkColor: '#2481cc',
      buttonColor: '#2481cc',
      buttonTextColor: '#ffffff',
      secondaryBgColor: '#f0f0f0',
    };
  }
  
  const themeParams = (webApp.themeParams as Record<string, string>) || {};
  
  return {
    bgColor: themeParams.bg_color || '#ffffff',
    textColor: themeParams.text_color || '#000000',
    hintColor: themeParams.hint_color || '#999999',
    linkColor: themeParams.link_color || '#2481cc',
    buttonColor: themeParams.button_color || '#2481cc',
    buttonTextColor: themeParams.button_text_color || '#ffffff',
    secondaryBgColor: themeParams.secondary_bg_color || '#f0f0f0',
  };
}

// Show Telegram alert
export function showAlert(message: string): void {
  const webApp = getWebApp();
  
  if (webApp && typeof webApp.showAlert === 'function') {
    (webApp.showAlert as (msg: string) => void)(message);
  } else {
    alert(message);
  }
}

// Show Telegram confirmation
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const webApp = getWebApp();
    
    if (webApp && typeof webApp.showConfirm === 'function') {
      (webApp.showConfirm as (msg: string, callback: (ok: boolean) => void) => void)(message, (ok: boolean) => resolve(ok));
    } else {
      resolve(confirm(message));
    }
  });
}

// Haptic feedback
export function triggerHaptic(type: 'impact' | 'notification' | 'selection' = 'impact'): void {
  const webApp = getWebApp();
  if (!webApp) return;
  
  const haptic = webApp.HapticFeedback as Record<string, unknown> | undefined;
  if (!haptic) return;
  
  switch (type) {
    case 'impact':
      (haptic.impactOccurred as ((style: string) => void) | undefined)?.('medium');
      break;
    case 'notification':
      (haptic.notificationOccurred as ((type: string) => void) | undefined)?.('success');
      break;
    case 'selection':
      (haptic.selectionChanged as (() => void) | undefined)?.();
      break;
  }
}

// Expand to fullscreen
export function expandApp(): void {
  const webApp = getWebApp();
  if (webApp && typeof webApp.expand === 'function') {
    (webApp.expand as () => void)();
  }
}

// Close the mini app
export function closeApp(): void {
  const webApp = getWebApp();
  if (webApp && typeof webApp.close === 'function') {
    (webApp.close as () => void)();
  }
}

// Enable closing confirmation
export function enableClosingConfirmation(): void {
  const webApp = getWebApp();
  if (webApp && typeof webApp.enableClosingConfirmation === 'function') {
    (webApp.enableClosingConfirmation as () => void)();
  }
}

// Disable closing confirmation
export function disableClosingConfirmation(): void {
  const webApp = getWebApp();
  if (webApp && typeof webApp.disableClosingConfirmation === 'function') {
    (webApp.disableClosingConfirmation as () => void)();
  }
}

// Set up back button
export function setupBackButton(callback: () => void): void {
  const webApp = getWebApp();
  if (!webApp) return;
  
  const backButton = webApp.BackButton as Record<string, unknown> | undefined;
  if (backButton) {
    (backButton.show as (() => void) | undefined)?.();
    (backButton.onClick as ((cb: () => void) => void) | undefined)?.(callback);
  }
}

// Hide back button
export function hideBackButton(): void {
  const webApp = getWebApp();
  if (!webApp) return;
  
  const backButton = webApp.BackButton as Record<string, unknown> | undefined;
  if (backButton && typeof backButton.hide === 'function') {
    backButton.hide();
  }
}

// Set up main button
export function setupMainButton(text: string, callback: () => void, isActive = true): void {
  const webApp = getWebApp();
  if (!webApp) return;
  
  const mainButton = webApp.MainButton as Record<string, unknown> | undefined;
  if (mainButton) {
    if (typeof mainButton.setText === 'function') mainButton.setText(text);
    if (typeof mainButton.show === 'function') mainButton.show();
    if (typeof mainButton.onClick === 'function') mainButton.onClick(callback);
    
    if (isActive) {
      if (typeof mainButton.enable === 'function') mainButton.enable();
    } else {
      if (typeof mainButton.disable === 'function') mainButton.disable();
    }
  }
}

// Hide main button
export function hideMainButton(): void {
  const webApp = getWebApp();
  if (!webApp) return;
  
  const mainButton = webApp.MainButton as Record<string, unknown> | undefined;
  if (mainButton && typeof mainButton.hide === 'function') {
    mainButton.hide();
  }
}