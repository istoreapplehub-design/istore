import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFS_KEY = "istore-preferences";

export interface AppPreferences {
  defaultRegion: string;
  orderNotifications: boolean;
  promotionsNotifications: boolean;
  hapticFeedback: boolean;
}

const DEFAULTS: AppPreferences = {
  defaultRegion: "",
  orderNotifications: true,
  promotionsNotifications: false,
  hapticFeedback: true
};

export async function getPreferences(): Promise<AppPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppPreferences>) };
  } catch {
    return DEFAULTS;
  }
}

export async function savePreferences(patch: Partial<AppPreferences>): Promise<AppPreferences> {
  const current = await getPreferences();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}
