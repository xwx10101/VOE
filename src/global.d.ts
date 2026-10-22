import type { KeyBridge } from './types';

declare global {
  interface Window {
    ldx?: KeyBridge;
  }
}

export {};
