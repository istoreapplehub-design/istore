import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatGHS } from "../constants/theme";
import { AppHaptics } from "../lib/haptics";
import {
  getMyInstallmentPlans,
  payInstallmentMilestone,
  confirmInstallmentMilestone
} from "../services/api";
import PaystackCheckoutModal from "../components/PaystackCheckoutModal";

export default function InstallmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Paystack milestone payment state
  const [showPaystack, setShowPaystack] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<any>(null);
  const [paystackData, setPaystackData] = useState<{
    authorization_url: string;
    reference: string;
  } | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await getMyInstallmentPlans();
      if (res.success) {
        setPlans(res.data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleRefresh = () => {
    setRefreshing(true);
    AppHaptics.impactLight();
    fetchPlans();
  };

  const handlePayMilestone = async (milestone: any, plan: any) => {
    AppHaptics.selection();
    setActiveMilestone(milestone);

    try {
      const res = await payInstallmentMilestone({
        milestoneId: milestone.id,
        email: plan.applicantEmail || undefined
      });

      if (res.data?.isSimulation) {
        await confirmInstallmentMilestone({
          milestoneId: milestone.id,
          reference: res.data.reference
        });
        AppHaptics.success();
        Alert.alert("Installment Paid", "Milestone payment recorded successfully!");
        fetchPlans();
      } else {
        setPaystackData({
          authorization_url: res.data.authorization_url,
          reference: res.data.reference
        });
        setShowPaystack(true);
      }
    } catch (err: any) {
      Alert.alert("Payment Error", err.message || "Failed to initialize installment payment.");
    }
  };

  const handlePaystackSuccess = async () => {
    setShowPaystack(false);
    if (activeMilestone && paystackData) {
      try {
        await confirmInstallmentMilestone({
          milestoneId: activeMilestone.id,
          reference: paystackData.reference
        });
        AppHaptics.success();
        Alert.alert("Installment Paid", "Thank you! Your milestone payment has been confirmed.");
        fetchPlans();
      } catch {
        fetchPlans();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable hitSlop={10} onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Installment Plans</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brandAccent} />
          <Text style={styles.loadingText}>Loading your installment plans...</Text>
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="calendar-outline" size={44} color={colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No Active Installments</Text>
          <Text style={styles.emptySubtitle}>
            When you purchase Apple hardware with 60% down payment and Ghana Card verification, your scheduled payments appear here.
          </Text>
          <Pressable style={styles.shopBtn} onPress={() => router.push("/(tabs)/shop")}>
            <Text style={styles.shopBtnText}>Explore Apple Catalog</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brandAccent} />
          }
          renderItem={({ item: plan }) => {
            const paidCount = plan.milestones?.filter((m: any) => m.status === "paid").length || 0;
            const totalCount = plan.milestones?.length || 1;
            const progress = paidCount / totalCount;

            return (
              <View style={styles.planCard}>
                <View style={styles.planCardHeader}>
                  <View>
                    <View style={styles.planBadgeRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          plan.status === "active"
                            ? styles.statusActive
                            : plan.status === "completed"
                            ? styles.statusCompleted
                            : styles.statusPending
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>{plan.status.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.frequencyTag}>{plan.frequency.toUpperCase()} SCHEDULE</Text>
                    </View>
                    <Text style={styles.planDeviceName}>
                      {plan.order?.items?.[0]?.name || "Apple Device Package"}
                    </Text>
                    <Text style={styles.planCardNo}>Ghana Card: {plan.ghanaCardNumber}</Text>
                  </View>
                  <Text style={styles.planTotalGHS}>{formatGHS(plan.totalAmountGHS)}</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>60% Down Paid</Text>
                    <Text style={styles.progressVal}>
                      {paidCount} of {totalCount} installments completed
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
                  </View>
                </View>

                {/* Milestones list */}
                <Text style={styles.milestonesSectionTitle}>Scheduled Repayments</Text>
                <View style={styles.milestonesList}>
                  {plan.milestones?.map((m: any) => {
                    const isPaid = m.status === "paid";
                    return (
                      <View key={m.id} style={styles.milestoneItem}>
                        <View style={styles.milestoneLeft}>
                          <Ionicons
                            name={isPaid ? "checkmark-circle" : "time-outline"}
                            size={18}
                            color={isPaid ? "#059669" : colors.textSecondary}
                          />
                          <View style={{ marginLeft: 10 }}>
                            <Text style={styles.milestoneIndexTitle}>
                              Installment {m.milestoneIndex}
                            </Text>
                            <Text style={styles.milestoneDueDate}>
                              Due {new Date(m.dueDate).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.milestoneRight}>
                          <Text style={styles.milestoneAmount}>{formatGHS(m.amountGHS)}</Text>
                          {isPaid ? (
                            <View style={styles.paidBadge}>
                              <Text style={styles.paidBadgeText}>PAID</Text>
                            </View>
                          ) : (
                            <Pressable
                              style={({ pressed }) => [
                                styles.payNowBtn,
                                pressed && { opacity: 0.85 }
                              ]}
                              onPress={() => handlePayMilestone(m, plan)}
                            >
                              <Text style={styles.payNowBtnText}>Pay</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Paystack Modal */}
      {paystackData && (
        <PaystackCheckoutModal
          visible={showPaystack}
          authorizationUrl={paystackData.authorization_url}
          reference={paystackData.reference}
          onSuccess={handlePaystackSuccess}
          onCancel={() => setShowPaystack(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFBFD"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: "#FFFFFF"
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20
  },
  shopBtn: {
    marginTop: 20,
    backgroundColor: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill
  },
  shopBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  listContent: {
    padding: 16,
    gap: 16
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  planCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14
  },
  planBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  statusActive: {
    backgroundColor: "rgba(0,102,204,0.1)"
  },
  statusCompleted: {
    backgroundColor: "rgba(5,150,105,0.1)"
  },
  statusPending: {
    backgroundColor: "rgba(234,179,8,0.1)"
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.brandAccent
  },
  frequencyTag: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary
  },
  planDeviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  planCardNo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  planTotalGHS: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text
  },
  progressContainer: {
    backgroundColor: "#F9F9FB",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669"
  },
  progressVal: {
    fontSize: 11,
    color: colors.textSecondary
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E5EA",
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.brandAccent,
    borderRadius: 3
  },
  milestonesSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10
  },
  milestonesList: {
    gap: 8
  },
  milestoneItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  milestoneLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  milestoneIndexTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  milestoneDueDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  milestoneRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  milestoneAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  },
  paidBadge: {
    backgroundColor: "rgba(5,150,105,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669"
  },
  payNowBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill
  },
  payNowBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700"
  }
});
