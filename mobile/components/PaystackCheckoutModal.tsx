import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewNavigation } from "react-native-webview";
import * as Haptics from "expo-haptics";
import { colors, typography } from "../constants/theme";

export interface PaystackCheckoutModalProps {
  visible: boolean;
  authorizationUrl: string;
  reference: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Paystack WebView Checkout Modal
 * Loads Paystack standard authorization URL with redirection handlers
 * for MoMo / Card authorization.
 */
export default function PaystackCheckoutModal({
  visible,
  authorizationUrl,
  onSuccess,
  onCancel
}: PaystackCheckoutModalProps) {
  const [loading, setLoading] = React.useState(true);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const url = navState.url.toLowerCase();

    // Check for success callbacks or redirects
    if (
      url.startsWith("istore://success") ||
      url.startsWith("ghanaapps://success") ||
      url.includes("status=success") ||
      url.includes("/order-success") ||
      url.includes("trxref=")
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      return;
    }

    // Check for user cancellation or payment failure
    if (
      url.includes("cancel") ||
      url.includes("failed") ||
      url.startsWith("istore://cancel") ||
      url.startsWith("ghanaapps://cancel")
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onCancel();
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header bar */}
        <View style={styles.header}>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={handleClose}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>

          <Text style={styles.title}>Paystack</Text>

          <View style={styles.placeholder} />
        </View>

        {/* WebView Container */}
        <View style={styles.webViewContainer}>
          {authorizationUrl ? (
            <WebView
              source={{ uri: authorizationUrl }}
              onNavigationStateChange={handleNavigationStateChange}
              onLoadEnd={() => setLoading(false)}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={styles.loadingText}>Connecting to Paystack...</Text>
                </View>
              )}
              style={styles.webView}
            />
          ) : (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          )}
        </View>

        {/* Security badge footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Secured by Paystack 🔒</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.accent
  },
  title: {
    ...typography.h3,
    fontSize: 17,
    fontWeight: "600",
    color: colors.text
  },
  placeholder: {
    width: 50
  },
  webViewContainer: {
    flex: 1,
    position: "relative"
  },
  webView: {
    flex: 1,
    backgroundColor: colors.background
  },
  loaderContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    zIndex: 10
  },
  loadingText: {
    ...typography.caption,
    marginTop: 12,
    color: colors.textSecondary
  },
  footer: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary
  }
});
