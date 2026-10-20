/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on notification row press
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, typography } from "../constants/theme";
import { Order } from "../types";
import { getMyOrders } from "../services/api";
import { useUserStore } from "../store/useUserStore";
import ErrorState from "../components/ErrorState";
import { NOTIFICATIONS_LAST_SEEN_KEY, markNotificationsAsSeen } from "../lib/notifications";
import { AppHaptics } from "../lib/haptics";

interface NotificationEvent {
  id: string;
  orderId: string;
  title: string;
  body: string;
  date: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function buildEvents(orders: Order[]): NotificationEvent[] {
  const events: NotificationEvent[] = [];
  for (const order of orders) {
    const ref = `#${order.id.slice(-6).toUpperCase()}`;
    events.push({
      id: `${order.id}-created`,
      orderId: order.id,
      title: "Order placed",
      body: `We received your order ${ref}. You can follow its progress in My Orders.`,
      date: order.createdAt,
      icon: "receipt-outline"
    });
    if (order.paidAt) {
      events.push({
        id: `${order.id}-paid`,
        orderId: order.id,
        title: "Payment confirmed",
        body: `Payment for order ${ref} was confirmed. We are preparing your devices for dispatch.`,
        date: order.paidAt,
        icon: "checkmark-circle-outline"
      });
    }
    if (order.shippedAt) {
      events.push({
        id: `${order.id}-shipped`,
        orderId: order.id,
        title: "Order shipped",
        body: `Order ${ref} is on the way to ${order.deliveryRegion}.`,
        date: order.shippedAt,
        icon: "car-outline"
      });
    }
    if (order.deliveredAt) {
      events.push({
        id: `${order.id}-delivered`,
        orderId: order.id,
        title: "Delivered",
        body: `Order ${ref} was delivered. Enjoy your new device!`,
        date: order.deliveredAt,
        icon: "home-outline"
      });
    }
    if (order.cancelledAt) {
      events.push({
        id: `${order.id}-cancelled`,
        orderId: order.id,
        title: "Order cancelled",
        body: `Order ${ref} was cancelled. Anything not delivered will not be charged.`,
        date: order.cancelledAt,
        icon: "close-circle-outline"
      });
    }
  }
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function relativeTime(iso: string, nowMs: number): string {
  const diff = nowMs - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GH", { month: "short", day: "numeric" });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { session, userId } = useUserStore();

  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Relative timestamps are rendered values, so the clock lives in state and
  // ticks from an effect instead of calling Date.now() during render.
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await getMyOrders(userId, { page: 1, limit: 50 });
      setEvents(buildEvents(res.data));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load notifications"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    load();
    AsyncStorage.getItem(NOTIFICATIONS_LAST_SEEN_KEY).then((v) => {
      if (v) setLastSeen(Number(v));
    });
  }, [session, load]);

  const markSeen = useCallback(async () => {
    const now = Date.now();
    setLastSeen(now);
    await markNotificationsAsSeen();
  }, []);

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <Ionicons name="notifications-outline" size={44} color={colors.textTertiary} />
          <Text style={typography.h3}>Sign in to see updates</Text>
          <Text style={[typography.bodySmall, { textAlign: "center" }]}>
            Order confirmations, shipping and delivery updates appear here.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.blackPill, pressed && { opacity: 0.7 }]}
            onPress={() => router.replace("/(auth)/login?returnTo=notifications")}
          >
            <Text style={styles.blackPillText}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
          <ErrorState
            error={error}
            onRetry={() => {
              setLoading(true);
              load();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            <Text style={typography.bodySmall}>
              Updates from your I-Dynamic orders.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centerState}>
            <Ionicons name="notifications-off-outline" size={44} color={colors.textTertiary} />
            <Text style={typography.h3}>No notifications yet</Text>
            <Text style={[typography.bodySmall, { textAlign: "center" }]}>
              When you place an order, status updates will show up here.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.blackPill, pressed && { opacity: 0.7 }]}
              onPress={() => router.push("/(tabs)/shop")}
            >
              <Text style={styles.blackPillText}>Start Shopping</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const unread = lastSeen > 0 && new Date(item.date).getTime() > lastSeen;
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => {
                AppHaptics.selection();
                markSeen();
                router.push(`/orders/${item.orderId}`);
              }}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowTime}>{relativeTime(item.date, nowMs)}</Text>
                </View>
                <Text style={styles.rowBody}>{item.body}</Text>
              </View>
              {unread && <View style={styles.unreadDot} />}
            </Pressable>
          );
        }}
        onEndReached={markSeen}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  listContent: {
    padding: 16,
    paddingBottom: 48
  },
  pageHeader: {
    marginBottom: 16
  },
  pageTitle: {
    ...typography.h1,
    marginBottom: 6
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: 32,
    gap: 12
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  rowPressed: {
    backgroundColor: colors.surface
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  rowTime: {
    fontSize: 12,
    color: colors.textTertiary
  },
  rowBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 8
  },
  blackPill: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: 980,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8
  },
  blackPillText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  }
});
