import { Platform } from 'react-native';

export type HapticKind =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'rigid'
  | 'soft'
  | 'success'
  | 'warning'
  | 'error';

// Only the slice of expo-haptics that is used, typed locally so the package type-checks
// for consumers who have not installed the optional peer.
type HapticsModule = {
  selectionAsync(): Promise<void>;
  impactAsync(style: string): Promise<void>;
  notificationAsync(type: string): Promise<void>;
};

let mod: HapticsModule | null = null;
try {
  // Optional peer dependency. Metro treats a require inside try/catch as optional.
  mod = require('expo-haptics') as HapticsModule;
} catch {
  mod = null;
}

let enabled = true;

/** Turns every haptic in the library on or off. Set by `PenguinProvider`. */
export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

const impact: Partial<Record<HapticKind, string>> = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  rigid: 'rigid',
  soft: 'soft',
};

const notification: Partial<Record<HapticKind, string>> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
};

/**
 * Fires a haptic. Safe to call anywhere: it does nothing on web, when haptics are disabled,
 * or when expo-haptics is not installed. From a worklet, call it through `scheduleOnRN`.
 */
export function haptic(kind: HapticKind = 'light') {
  if (!enabled || !mod || Platform.OS === 'web') return;
  let result: Promise<void> | undefined;
  if (kind === 'selection') {
    result = mod.selectionAsync();
  } else if (impact[kind]) {
    result = mod.impactAsync(impact[kind]);
  } else if (notification[kind]) {
    result = mod.notificationAsync(notification[kind]);
  }
  // A device without a taptic engine rejects; that is never worth surfacing.
  result?.catch(() => {});
}
