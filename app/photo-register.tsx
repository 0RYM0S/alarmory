import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/src/hooks/useTheme';
import { setPhotoMissionDraft } from '@/src/state/photoMissionDraft';
import {
  requestCameraPermission,
  requestMediaLibraryPermission,
} from '@/src/utils/permissions';

export default function PhotoRegisterScreen() {
  const { colors } = useTheme();
  const { draftKey, currentUri } = useLocalSearchParams<{
    draftKey: string;
    currentUri: string;
  }>();

  const initialUri = useMemo(() => currentUri?.trim() ?? '', [currentUri]);
  const [selectedUri, setSelectedUri] = useState(initialUri);
  const [isPicking, setIsPicking] = useState(false);

  async function pickFromGallery() {
    const granted = await requestMediaLibraryPermission();
    if (!granted) {
      Alert.alert('Permission required', 'Gallery access is needed to choose an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedUri(result.assets[0].uri);
    }
  }

  async function takeNewPhoto() {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert('Permission required', 'Camera access is needed to take a target photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedUri(result.assets[0].uri);
    }
  }

  async function pickFromFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (uri) {
      setSelectedUri(uri);
    }
  }

  function showSourceOptions() {
    Alert.alert('Choose target image', 'Select how you want to set the mission image.', [
      {
        text: 'Pick File',
        onPress: () => {
          void runPicker(pickFromFile);
        },
      },
      {
        text: 'Gallery',
        onPress: () => {
          void runPicker(pickFromGallery);
        },
      },
      {
        text: 'Take Photo',
        onPress: () => {
          void runPicker(takeNewPhoto);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  }

  function handlePreviewPress() {
    if (!selectedUri) {
      showSourceOptions();
      return;
    }

    Alert.alert('Target image', 'Do you want to change the current image?', [
      {
        text: 'Change Image',
        onPress: showSourceOptions,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  }

  async function runPicker(action: () => Promise<void>) {
    if (isPicking) return;

    try {
      setIsPicking(true);
      await action();
    } finally {
      setIsPicking(false);
    }
  }

  function handleSave() {
    if (!draftKey || !selectedUri) {
      return;
    }

    setPhotoMissionDraft(draftKey, selectedUri);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant + '33' }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>REGISTER PHOTO</Text>
        <Pressable
          onPress={handleSave}
          style={styles.headerBtn}
          disabled={!selectedUri}
        >
          <Text
            style={[
              styles.headerBtnTextRight,
              { color: selectedUri ? colors.primary : colors.onSurfaceVariant },
            ]}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: colors.primary }]}>PHOTO TARGET</Text>
        <Text style={[styles.title, { color: colors.onSurface }]}>Set the mission reference image</Text>
        <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>
          Choose an image from files, gallery, or camera. This image will be saved on the alarm and shown
          on the photo mission screen as the target to match.
        </Text>

        <Pressable
          onPress={handlePreviewPress}
          disabled={isPicking}
          style={({ pressed }) => [
            styles.previewPressable,
            pressed && styles.previewPressed,
          ]}
        >
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            {selectedUri ? (
              <>
                <Image source={{ uri: selectedUri }} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewBadge}>
                  <MaterialIcons name="edit" size={14} color="#FFFFFF" />
                  <Text style={styles.previewBadgeText}>Change</Text>
                </View>
              </>
            ) : (
              <View style={[styles.emptyPreview, { backgroundColor: colors.surfaceContainerHighest }]}>
                <MaterialIcons name="add-a-photo" size={36} color={colors.primary} />
                <Text style={[styles.emptyPreviewTitle, { color: colors.onSurface }]}>Choose target image</Text>
                <Text style={[styles.emptyPreviewText, { color: colors.onSurfaceVariant }]}>
                  Tap to pick a file, choose from gallery, or take a new photo
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        <View style={[styles.infoCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
          <Text style={[styles.infoLabel, { color: colors.primary }]}>HOW IT WORKS</Text>
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            Save Target stores the selected image for this alarm. When the photo mission runs, the chosen target
            image is shown in the mission UI and used as the reference image.
          </Text>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={!selectedUri}
          style={[
            styles.primaryButton,
            {
              backgroundColor: selectedUri ? colors.primaryDim : colors.surfaceContainerHighest,
            },
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: selectedUri ? '#FFFFFF' : colors.onSurfaceVariant },
            ]}
          >
            Save Target
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  headerBtn: { minWidth: 60 },
  headerBtnText: { fontSize: 16, fontWeight: '500' },
  headerBtnTextRight: { fontSize: 16, fontWeight: '500', textAlign: 'right' },
  content: { padding: 20, gap: 16 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  body: { fontSize: 14, lineHeight: 22 },
  previewPressable: { marginTop: 8, borderRadius: 20 },
  previewPressed: { opacity: 0.92 },
  previewCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 260,
  },
  previewImage: {
    width: '100%',
    height: 280,
  },
  previewBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyPreview: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyPreviewTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyPreviewText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
