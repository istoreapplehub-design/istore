import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyOrders } from "../services/api";

export const NOTIFICATIONS_LAST_SEEN_KEY = "istore-notifications-last-seen";

/**
 * Checks if the user has any unread notifications by comparing the latest order activity
 * against the last seen timestamp stored in AsyncStorage.
 */
export async function checkHasUnreadNotifications(userId?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const [res, lastSeenRaw] = await Promise.all([
      getMyOrders(userId, { page: 1, limit: 1 }).catch(() => null),
      AsyncStorage.getItem(NOTIFICATIONS_LAST_SEEN_KEY)
    ]);

    if (!res || !res.data || res.data.length === 0) {
      return false;
    }

    const latestOrder = res.data[0];
    const latestTimestamp = new Date(
      latestOrder.deliveredAt ||
        latestOrder.shippedAt ||
        latestOrder.paidAt ||
        latestOrder.cancelledAt ||
        latestOrder.updatedAt ||
        latestOrder.createdAt
    ).getTime();

    if (!lastSeenRaw) {
      return true;
    }

    const lastSeenTime = Number(lastSeenRaw);
    return latestTimestamp > lastSeenTime;
  } catch {
    return false;
  }
}

/**
 * Marks all notifications as seen by storing the current timestamp.
 */
export async function markNotificationsAsSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_LAST_SEEN_KEY, String(Date.now()));
  } catch {
    // Ignore storage failure
  }
}
