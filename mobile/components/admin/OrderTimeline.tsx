import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";

export interface TimelineEvent {
  label: string;
  at: string | null;
  done: boolean;
  trackingNumber?: string | null;
  courier?: string | null;
}

export interface OrderTimelineProps {
  timeline: TimelineEvent[];
}

function formatTimestamp(isoString: string | null): string {
  if (!isoString) return "Pending";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(d);
  } catch {
    return isoString;
  }
}

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No timeline events available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {timeline.map((event, index) => {
        const isLast = index === timeline.length - 1;
        const nextDone = !isLast && timeline[index + 1]?.done;

        return (
          <View key={`${event.label}-${index}`} style={styles.row}>
            {/* Left Indicator Column */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.circle,
                  event.done ? styles.circleDone : styles.circlePending
                ]}
              >
                {event.done && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>

              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    nextDone ? styles.connectorDone : styles.connectorPending
                  ]}
                />
              )}
            </View>

            {/* Right Content Column */}
            <View
              style={[
                styles.contentCol,
                !isLast && { paddingBottom: 20 }
              ]}
            >
              <Text
                style={[
                  styles.label,
                  event.done ? styles.labelDone : styles.labelPending
                ]}
              >
                {event.label}
              </Text>

              {event.at ? (
                <Text style={styles.timeText}>
                  {formatTimestamp(event.at)}
                </Text>
              ) : (
                <Text style={styles.timePending}>Waiting...</Text>
              )}

              {event.trackingNumber ? (
                <View style={styles.trackingBadge}>
                  <Ionicons name="airplane-outline" size={13} color={colors.accent} />
                  <Text style={styles.trackingText}>
                    {event.courier ? `${event.courier} · ` : ""}
                    {event.trackingNumber}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4
  },
  emptyContainer: {
    paddingVertical: 12
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary
  },
  row: {
    flexDirection: "row"
  },
  indicatorCol: {
    width: 24,
    alignItems: "center"
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  circleDone: {
    backgroundColor: colors.accent
  },
  circlePending: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border
  },
  connector: {
    width: 2,
    flex: 1,
    marginVertical: 4
  },
  connectorDone: {
    backgroundColor: colors.accent
  },
  connectorPending: {
    backgroundColor: colors.border
  },
  contentCol: {
    flex: 1,
    marginLeft: 14,
    paddingTop: 2
  },
  label: {
    fontSize: 15,
    letterSpacing: -0.2
  },
  labelDone: {
    fontWeight: "600",
    color: colors.text
  },
  labelPending: {
    fontWeight: "400",
    color: colors.textSecondary
  },
  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  timePending: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
    fontStyle: "italic"
  },
  trackingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    backgroundColor: "rgba(23, 23, 23, 0.08)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  trackingText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: colors.accent,
    fontWeight: "600"
  }
});

export default OrderTimeline;
