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
  const [creditScore, setCreditScore] = useState<number>(650);
  const [creditTier, setCreditTier] = useState<string>("Silver");
  const [summary, setSummary] = useState<any>(null);
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
        setPlans(res.data || []);
        if (res.creditScore) setCreditScore(res.creditScore);
        if (res.creditTier) setCreditTier(res.creditTier);
        if (res.summary) setSummary(res.summary);
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
        Alert.alert("Installment Paid", "Milestone payment recorded successfully! +20 Credit Points earned.");
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
        Alert.alert("Installment Paid", "Thank you! Your milestone payment has been confirmed. +20 Credit Points earned!");
        fetchPlans();
      } catch {
        fetchPlans();
      }
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "platinum":
        return "#7C3AED";
      case "gold":
        return "#D97706";
      case "bronze":
        return "#B45309";
      default:
        return "#0071E3";
    }
  };

  const tierColor = getTierColor(creditTier);
  const totalRemaining = summary?.totalRemainingBalanceGHS ?? plans
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + (p.remainingGHS || 0), 0);
  const totalPaid = summary?.totalPaidSoFarGHS ?? 0;
  const nextPayment = summary?.nextPayment;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. LesTrades Trust Rating / Credit Score Card */}
      <View style={styles.creditCard}>
        <View style={styles.creditCardTop}>
          <View style={styles.creditBadgeRow}>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + "15", borderColor: tierColor + "40" }]}>
              <Ionicons name="shield-checkmark" size={14} color={tierColor} />
              <Text style={[styles.tierBadgeText, { color: tierColor }]}>
                {creditTier.toUpperCase()} TIER
              </Text>
            </View>
            <View style={styles.niaVerifiedPill}>
              <Ionicons name="checkmark-done" size={12} color="#059669" />
              <Text style={styles.niaVerifiedText}>NIA VERIFIED</Text>
            </View>
          </View>
          <Text style={styles.creditTitle}>LesTrades Trust Rating</Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreNumberBlock}>
            <Text style={styles.scoreBig}>{creditScore}</Text>
            <Text style={styles.scoreScale}>/ 850</Text>
          </View>
          <View style={styles.scoreGaugeContainer}>
            <View style={styles.scoreGaugeTrack}>
              <View
                style={[
                  styles.scoreGaugeFill,
                  {
                    width: `${Math.round(((creditScore - 300) / (850 - 300)) * 100)}%`,
                    backgroundColor: tierColor
                  }
                ]}
              />
            </View>
            <Text style={styles.scoreDescription}>
              {creditScore >= 740
                ? "Exceptional · VIP fast-track approval"
                : creditScore >= 670
                ? "Good standing · Eligible for 50% down-payment"
                : "Standard tier · 60% down-payment eligible"}
            </Text>
          </View>
        </View>

        <View style={styles.creditPerksStrip}>
          <View style={styles.perkItem}>
            <Ionicons name="flash" size={14} color={colors.brandAccent} />
            <Text style={styles.perkText}>Instant Approval</Text>
          </View>
          <View style={styles.perkDivider} />
          <View style={styles.perkItem}>
            <Ionicons name="trending-up" size={14} color="#059669" />
            <Text style={styles.perkText}>+20 pts per payment</Text>
          </View>
          <View style={styles.perkDivider} />
          <View style={styles.perkItem}>
            <Ionicons name="ribbon" size={14} color="#D97706" />
            <Text style={styles.perkText}>Apple Warranty</Text>
          </View>
        </View>
      </View>

      {/* 2. Remaining Installment Balance Summary Card */}
      {plans.length > 0 && (
        <View style={styles.balanceSummaryCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>Installment Balance Overview</Text>
            <Text style={styles.balanceSubtitle}>
              {plans.filter((p) => p.status === "active").length} active device plan(s)
            </Text>
          </View>

          <View style={styles.balanceGrid}>
            <View style={styles.balanceStatBox}>
              <Text style={styles.statLabel}>Remaining Balance</Text>
              <Text style={styles.statValueRemaining}>{formatGHS(totalRemaining)}</Text>
              <Text style={styles.statSub}>40% remaining across plans</Text>
            </View>

            <View style={styles.balanceStatBox}>
              <Text style={styles.statLabel}>Total Cleared</Text>
              <Text style={styles.statValuePaid}>{formatGHS(totalPaid)}</Text>
              <Text style={styles.statSub}>60% down + milestones</Text>
            </View>
          </View>

          {nextPayment ? (
            <View style={styles.nextDueBox}>
              <View style={styles.nextDueInfo}>
                <Ionicons name="calendar-outline" size={18} color="#0071E3" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.nextDueLabel}>Next Installment Due</Text>
                  <Text style={styles.nextDueDate}>
                    {new Date(nextPayment.dueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}{" "}
                    · {nextPayment.deviceName}
                  </Text>
                </View>
              </View>
              <View style={styles.nextDueAction}>
                <Text style={styles.nextDueAmount}>{formatGHS(nextPayment.amountGHS)}</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {plans.length > 0 && (
        <Text style={styles.plansSectionTitle}>Your Active Apple Hardware Plans</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable hitSlop={10} onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Installments & Credit</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brandAccent} />
          <Text style={styles.loadingText}>Loading installment balance & credit score...</Text>
        </View>
      ) : plans.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brandAccent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={44} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No Active Installment Plans</Text>
              <Text style={styles.emptySubtitle}>
                When you purchase Apple hardware with 60% down payment and live Ghana Card verification, your scheduled payments and device serial numbers appear here.
              </Text>
              <Pressable style={styles.shopBtn} onPress={() => router.push("/(tabs)/shop")}>
                <Text style={styles.shopBtnText}>Explore Apple Catalog</Text>
              </Pressable>
            </View>
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brandAccent} />
          }
          renderItem={({ item: plan }) => {
            const paidCount = plan.milestones?.filter((m: any) => m.status === "paid").length || 0;
            const totalCount = plan.milestones?.length || 1;
            const progress = paidCount / totalCount;
            const serialNumber = plan.serialNumber || plan.order?.items?.[0]?.serialNumber;
            const imei = plan.imei || plan.order?.items?.[0]?.imei;

            return (
              <View style={styles.planCard}>
                <View style={styles.planCardHeader}>
                  <View style={{ flex: 1 }}>
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

                    {/* Apple Hardware Serial & Warranty Badge */}
                    {serialNumber ? (
                      <View style={styles.deviceSerialBadge}>
                        <Ionicons name="hardware-chip-outline" size={13} color="#0071E3" />
                        <Text style={styles.deviceSerialText}>
                          Serial: {serialNumber}
                        </Text>
                        <View style={styles.warrantyDot} />
                        <Text style={styles.warrantyTagText}>Apple 1-Year Warranty</Text>
                      </View>
                    ) : (
                      <View style={styles.devicePendingSerialBadge}>
                        <Ionicons name="time-outline" size={12} color="#D97706" />
                        <Text style={styles.devicePendingSerialText}>
                          Serial number will be registered upon dispatch
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.planTotalGHS}>{formatGHS(plan.totalAmountGHS)}</Text>
                    <Text style={styles.planRemainingTag}>
                      Remaining: {formatGHS(plan.remainingGHS)}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>60% Down Paid ({formatGHS(plan.downPaymentGHS)})</Text>
                    <Text style={styles.progressVal}>
                      {paidCount} of {totalCount} installments cleared
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
    backgroundColor: "#F5F5F7"
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill
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
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary
  },
  listContent: {
    padding: 16,
    gap: 16
  },
  headerContainer: {
    gap: 16,
    marginBottom: 4
  },
  // Credit Score Card
  creditCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  creditCardTop: {
    marginBottom: 12
  },
  creditBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  niaVerifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#A7F3D0"
  },
  niaVerifiedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669"
  },
  creditTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 6
  },
  scoreNumberBlock: {
    flexDirection: "row",
    alignItems: "baseline"
  },
  scoreBig: {
    fontSize: 40,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -1
  },
  scoreScale: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
    marginLeft: 4
  },
  scoreGaugeContainer: {
    flex: 1
  },
  scoreGaugeTrack: {
    height: 8,
    backgroundColor: "#E5E5EA",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6
  },
  scoreGaugeFill: {
    height: "100%",
    borderRadius: 4
  },
  scoreDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600"
  },
  creditPerksStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9F9FB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14
  },
  perkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  perkText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text
  },
  perkDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#E5E5EA"
  },
  // Balance Overview
  balanceSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA"
  },
  balanceHeader: {
    marginBottom: 12
  },
  balanceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  balanceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  balanceGrid: {
    flexDirection: "row",
    gap: 10
  },
  balanceStatBox: {
    flex: 1,
    backgroundColor: "#F9F9FB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F3"
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase"
  },
  statValueRemaining: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0071E3",
    marginTop: 4
  },
  statValuePaid: {
    fontSize: 17,
    fontWeight: "800",
    color: "#059669",
    marginTop: 4
  },
  statSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
  },
  nextDueBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  nextDueInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  nextDueLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text
  },
  nextDueDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  nextDueAction: {
    alignItems: "flex-end"
  },
  nextDueAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text
  },
  plansSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  // Empty
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E5E5EA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19
  },
  shopBtn: {
    marginTop: 20,
    backgroundColor: colors.text,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill
  },
  shopBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  // Plan Card
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
  deviceSerialBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    borderWidth: 1,
    borderColor: "#CCE4FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
    gap: 4
  },
  deviceSerialText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#0071E3"
  },
  warrantyDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#0071E3",
    marginHorizontal: 2
  },
  warrantyTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669"
  },
  devicePendingSerialBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
    gap: 4
  },
  devicePendingSerialText: {
    fontSize: 10,
    color: "#B45309",
    fontWeight: "600"
  },
  planTotalGHS: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text
  },
  planRemainingTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0071E3",
    marginTop: 2
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
    fontSize: 11,
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
    fontSize: 12,
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
