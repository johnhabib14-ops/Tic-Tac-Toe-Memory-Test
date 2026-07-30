import { TASK_CONFIG } from '../config/taskConfig';
import type { DeviceInfo, DeviceType, InputMethod } from '../types';
import { detectRefreshRate } from './TimingMonitor';

export function detectDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'unknown',
      inputMethod: 'unknown',
      userAgent: '',
      screenWidth: 0,
      screenHeight: 0,
      devicePixelRatio: 1,
      refreshRateHz: null,
      touchCapable: false,
      supported: false,
      supportNotes: ['No window environment'],
    };
  }

  const w = window.screen.width;
  const h = window.screen.height;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const touchCapable =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const ua = navigator.userAgent;

  let deviceType: DeviceType = 'desktop';
  if (/Mobi|Android/i.test(ua) && touchCapable) deviceType = 'phone';
  else if (touchCapable && Math.min(w, h) >= 600) deviceType = 'tablet';

  const notes: string[] = [];
  let supported = true;
  if (vw < TASK_CONFIG.minScreenWidth || vh < TASK_CONFIG.minScreenHeight) {
    supported = false;
    notes.push(
      `Viewport ${vw}×${vh} below minimum ${TASK_CONFIG.minScreenWidth}×${TASK_CONFIG.minScreenHeight}`
    );
    deviceType = 'unsupported';
  }

  const inputMethod: InputMethod = touchCapable ? 'touch' : 'keyboard';

  return {
    deviceType,
    inputMethod,
    userAgent: ua,
    screenWidth: vw,
    screenHeight: vh,
    devicePixelRatio: window.devicePixelRatio || 1,
    refreshRateHz: detectRefreshRate(),
    touchCapable,
    supported,
    supportNotes: notes,
  };
}

export function createAnonymousId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `anon_${Date.now().toString(36)}_${rand}`;
}

export function createSessionId(): string {
  return `rit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createSeed(): number {
  return (Date.now() ^ (Math.random() * 0x100000000)) >>> 0;
}
