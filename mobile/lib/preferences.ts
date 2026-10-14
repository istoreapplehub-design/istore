import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFS_KEY = "istore-preferences";

export interface AppPreferences {
  defaultRegion: string;
}

const DEFAULTS: AppPreferences = { defaultRegion: "" };

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
  const next = { ...(await getPreferences()), ...patch };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}
