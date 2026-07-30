import { mapKeyToResponse } from './responseClassification';
import type { ActualResponse } from '../types';

/**
 * InputManager — keyboard and touch mapping for CFT.
 * Kept separate from StimulusRenderer / themes so cognitive params stay mode-agnostic.
 */
export class InputManager {
  private response: ActualResponse | null = null;
  private responseTs: number | null = null;
  private onResponse: ((r: ActualResponse, ts: number) => void) | null = null;
  private listening = false;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private leftEl: HTMLElement | null = null;
  private rightEl: HTMLElement | null = null;
  private leftHandler: (() => void) | null = null;
  private rightHandler: (() => void) | null = null;

  reset(): void {
    this.response = null;
    this.responseTs = null;
  }

  getResponse(): { actual: ActualResponse | null; timestamp: number | null } {
    return { actual: this.response, timestamp: this.responseTs };
  }

  hasResponded(): boolean {
    return this.response != null;
  }

  /**
   * Start listening for the first valid mapped response during a stimulus window.
   * Touch targets: elements with ids cft-touch-a / cft-touch-b.
   */
  start(
    nowFn: () => number,
    onResponse?: (r: ActualResponse, ts: number) => void
  ): void {
    if (typeof window === 'undefined') return;
    this.stop();
    this.reset();
    this.onResponse = onResponse ?? null;
    this.listening = true;

    this.keyHandler = (e: KeyboardEvent) => {
      if (!this.listening || this.response != null) return;
      const mapped = mapKeyToResponse(e.key);
      if (!mapped) return;
      e.preventDefault();
      this.commit(mapped, nowFn());
    };
    window.addEventListener('keydown', this.keyHandler);

    this.leftEl = document.getElementById('cft-touch-a');
    this.rightEl = document.getElementById('cft-touch-b');
    this.leftHandler = () => {
      if (!this.listening || this.response != null) return;
      this.commit('a', nowFn());
    };
    this.rightHandler = () => {
      if (!this.listening || this.response != null) return;
      this.commit('b', nowFn());
    };
    this.leftEl?.addEventListener('pointerdown', this.leftHandler);
    this.rightEl?.addEventListener('pointerdown', this.rightHandler);
  }

  stop(): void {
    this.listening = false;
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    if (this.leftEl && this.leftHandler) {
      this.leftEl.removeEventListener('pointerdown', this.leftHandler);
    }
    if (this.rightEl && this.rightHandler) {
      this.rightEl.removeEventListener('pointerdown', this.rightHandler);
    }
    this.leftEl = null;
    this.rightEl = null;
    this.leftHandler = null;
    this.rightHandler = null;
  }

  private commit(actual: ActualResponse, ts: number): void {
    if (this.response != null) return;
    this.response = actual;
    this.responseTs = ts;
    this.onResponse?.(actual, ts);
  }
}
