import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "../../constants/theme";
import { uploadAdminImage } from "../../services/adminApi";

export interface ImageUploaderProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 6,
  folder = "products"
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");

  const handlePickImages = async () => {
    try {
      Haptics.selectionAsync();

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions in settings to upload product photos."
        );
        return;
      }

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setUploading(true);
      const totalSelected = result.assets.length;
      const uploadedUrls: string[] = [];
      const failedCount: number[] = [];

      for (let i = 0; i < totalSelected; i++) {
        const asset = result.assets[i];
        setProgressText(`Uploading ${i + 1} of ${totalSelected}...`);

        try {
          // Resize if width > 1200 and compress
          const actions: ImageManipulator.Action[] = [];
          if (asset.width && asset.width > 1200) {
            actions.push({ resize: { width: 1200 } });
          }

          const manipulated = await ImageManipulator.manipulateAsync(
            asset.uri,
            actions,
            {
              compress: 0.8,
              format: ImageManipulator.SaveFormat.JPEG
            }
          );

          const filename =
            asset.fileName ||
            `${folder}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

          const uploaded = await uploadAdminImage({
            uri: manipulated.uri,
            name: filename,
            type: "image/jpeg"
          });

          if (uploaded?.url) {
            uploadedUrls.push(uploaded.url);
          }
        } catch {
          failedCount.push(i + 1);
        }
      }

      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (failedCount.length > 0) {
        Alert.alert(
          "Upload Warning",
          `${failedCount.length} image(s) failed to upload. Successfully added ${uploadedUrls.length} image(s).`
        );
      }
    } catch {
      Alert.alert("Error", "An unexpected error occurred while picking images.");
    } finally {
      setUploading(false);
      setProgressText("");
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    Haptics.selectionAsync();
    const filtered = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(filtered);
  };

  const canAddMore = images.length < maxImages;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {images.map((url, idx) => (
          <View key={`${url}-${idx}`} style={styles.thumbnailWrapper}>
            <Image source={{ uri: url }} style={styles.thumbnail} />
            <Pressable
              hitSlop={8}
              disabled={uploading}
              onPress={() => handleRemoveImage(idx)}
              style={styles.removeCircle}
            >
              <Ionicons name="close" size={12} color="#FFFFFF" />
            </Pressable>
            {idx === 0 && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>HERO</Text>
              </View>
            )}
          </View>
        ))}

        {canAddMore && (
          <Pressable
            disabled={uploading}
            onPress={handlePickImages}
            style={({ pressed }) => [
              styles.addTile,
              pressed && { opacity: 0.7 }
            ]}
          >
            {uploading ? (
              <View style={styles.loadingTile}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.progressText}>{progressText}</Text>
              </View>
            ) : (
              <>
                <Ionicons name="camera-outline" size={26} color={colors.accent} />
                <Text style={styles.addText}>+ Add</Text>
                <Text style={styles.counterText}>
                  {images.length}/{maxImages}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  thumbnailWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: colors.border
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  removeCircle: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center"
  },
  heroBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5
  },
  addTile: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 2
  },
  loadingTile: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4
  },
  progressText: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center"
  },
  addText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent
  },
  counterText: {
    fontSize: 10,
    color: colors.textSecondary
  }
});

export default ImageUploader;
