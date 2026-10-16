import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function useCountdown(endsAt: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, endsAt - now);

  return {
    expired: remaining === 0,
    hours: Math.floor(remaining / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1000)
  };
}

interface CountdownTimerProps {
  endsAt: number;
  /** Ink block digits (default) or a compact inline string. */
  variant?: "blocks" | "inline";
  label?: string;
}

export function CountdownTimer({
  endsAt,
  variant = "blocks",
  label
}: CountdownTimerProps) {
  const { hours, minutes, seconds, expired } = useCountdown(endsAt);

  const units = useMemo(
    () => [
      { value: pad(hours), caption: "HRS" },
      { value: pad(minutes), caption: "MIN" },
      { value: pad(seconds), caption: "SEC" }
    ],
    [hours, minutes, seconds]
  );

  if (expired) {
    return <Text style={styles.expired}>Flash sale has ended</Text>;
  }

  if (variant === "inline") {
    return (
      <View style={styles.inlineRow}>
        {label ? <Text style={styles.inlineLabel}>{label}</Text> : null}
        <Text style={styles.inlineValue}>
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.blockRow}>
      {label ? <Text style={styles.blockLabel}>{label}</Text> : null}
      {units.map((unit, index) => (
        <React.Fragment key={unit.caption}>
          <View style={styles.blockGroup}>
            <View style={styles.block}>
              <Text style={styles.blockValue}>{unit.value}</Text>
            </View>
            <Text style={styles.blockCaption}>{unit.caption}</Text>
          </View>
          {index < units.length - 1 ? <Text style={styles.colon}>:</Text> : null}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  blockRow: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    marginRight: 10,
    marginTop: 9,
    letterSpacing: 0.2
  },
  blockGroup: {
    alignItems: "center"
  },
  block: {
    minWidth: 38,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(225, 29, 72, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.45)",
    alignItems: "center",
    justifyContent: "center"
  },
  blockCaption: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.65)",
    marginTop: 5
  },
  blockValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5
  },
  colon: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.brandRed,
    marginHorizontal: 5,
    marginTop: 8
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(225, 29, 72, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.45)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  inlineLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)"
  },
  inlineValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"]
  },
  expired: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary
  }
});

export default CountdownTimer;
