import React, { useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { Text } from './ui';
import { colors, radii, spacing } from '../theme';
import { Button } from './ui';

interface Props {
  visible: boolean;
  onSave: (base64: string) => void;
  onClose: () => void;
}

export default function SignaturePad({ visible, onSave, onClose }: Props) {
  const ref = useRef<any>(null);

  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; background: ${colors.bg}; }
    .m-signature-pad--body { border: none; }
    .m-signature-pad--footer { display: none; }
    body, html { background: ${colors.bg}; }
  `;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text variant="body" color={colors.textSecondary}>Cancel</Text>
          </Pressable>
          <Text variant="h3">Client signature</Text>
          <Pressable onPress={() => ref.current?.clearSignature()}>
            <Text variant="body" color={colors.brand}>Clear</Text>
          </Pressable>
        </View>

        <View style={styles.canvas}>
          <SignatureScreen
            ref={ref}
            onOK={(sig: string) => onSave(sig)}
            webStyle={webStyle}
            autoClear={false}
            descriptionText="Sign above"
            confirmText="Save"
            penColor={colors.textPrimary}
            backgroundColor={colors.bg}
          />
        </View>

        <View style={styles.footer}>
          <Button
            label="Save signature"
            onPress={() => ref.current?.readSignature()}
            variant="primary"
            size="xl"
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  canvas: {
    flex: 1,
    margin: spacing.lg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: 40,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
