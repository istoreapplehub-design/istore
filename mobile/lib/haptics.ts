import * as Haptics from "expo-haptics";
import { getPreferences } from "./preferences";

let hapticsEnabled = true;

// Cache on load
getPreferences().then((p) => {
  if (typeof p.hapticFeedback === "boolean") {
    hapticsEnabled = p.hapticFeedback;
  }
});

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export const AppHaptics = {
  selection: () => {
    if (hapticsEnabled) {
      void Haptics.selectionAsync();
    }
  },
  impactLight: () => {
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  impactMedium: () => {
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  impactHeavy: () => {
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  success: () => {
    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  warning: () => {
    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
  error: () => {
    if (hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }
};
