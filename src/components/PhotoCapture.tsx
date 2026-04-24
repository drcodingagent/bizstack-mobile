import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui';
import { colors, spacing } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
}

export default function PhotoCapture({ visible, onClose, onCapture }: Props) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleOpenGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onCapture(result.assets[0].uri);
      onClose();
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      if (photo?.uri) {
        onCapture(photo.uri);
        onClose();
      }
    } catch {
      Alert.alert('Error', 'Could not take photo.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return null;
  }

  const grantedPerms = permission.granted;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {!grantedPerms ? (
          <View style={styles.permGate}>
            <Ionicons name="camera-outline" size={48} color="#fff" />
            <Text variant="h2" color="#fff" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
              Camera access needed
            </Text>
            <Text variant="body" color="rgba(255,255,255,0.8)" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
              Grant permission to take photos for this job.
            </Text>
            <Pressable
              onPress={requestPermission}
              style={({ pressed }) => [styles.permBtn, pressed && { opacity: 0.85 }]}
            >
              <Text variant="bodyStrong" color="#000">Grant access</Text>
            </Pressable>
            <Pressable onPress={onClose} style={{ marginTop: spacing.lg }}>
              <Text variant="body" color="rgba(255,255,255,0.8)">Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.topBar}>
              <RoundButton icon="close" onPress={onClose} />
              <RoundButton
                icon="camera-reverse"
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              />
            </View>
            <View style={styles.bottomBar}>
              <Pressable onPress={handleOpenGallery} style={styles.galleryBtn}>
                <Ionicons name="images" size={24} color="#fff" />
              </Pressable>
              <Pressable
                onPress={handleCapture}
                disabled={isCapturing}
                style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.95 }] }]}
              >
                {isCapturing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </Pressable>
              <View style={styles.galleryBtn} />
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  );
}

function RoundButton({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.roundBtn, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name={icon} size={22} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: 48,
  },
  galleryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d4d4d4',
  },
  permGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  permBtn: {
    marginTop: spacing['2xl'],
    backgroundColor: '#fff',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
});
