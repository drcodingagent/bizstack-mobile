import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

interface Props {
  visible: boolean;
  onSave: (base64: string) => void;
  onClose: () => void;
}

export default function SignaturePad({ visible, onSave, onClose }: Props) {
  const ref = useRef<any>(null);

  const handleOK = (signature: string) => {
    // signature is base64 data URL
    onSave(signature);
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const style = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: #f9fafb;
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body,html {
      background-color: #f9fafb;
    }
  `;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Client Signature</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.canvasContainer}>
          <SignatureScreen
            ref={ref}
            onOK={handleOK}
            webStyle={style}
            autoClear={false}
            descriptionText="Sign above"
            confirmText="Save"
            penColor="#111827"
            backgroundColor="#f9fafb"
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={() => ref.current?.readSignature()}>
            <Text style={styles.saveBtnText}>Save Signature</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  clearText: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '600',
  },
  canvasContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footer: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
