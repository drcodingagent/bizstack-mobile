import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '../../src/components/ui';
import { Conversation, Message } from '../../src/types';
import {
  getConversation,
  markRead,
  sendMessage,
} from '../../src/api/inbox';
import { colors, radii, spacing } from '../../src/theme';
import { useInboxStore } from '../../src/store/inboxStore';

const QUICK_REPLIES = [
  'On my way',
  'Running late',
  'Job complete',
  'Arrived on site',
  'Need more info',
];

function statusIcon(status: string): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case 'read': return 'checkmark-done';
    case 'delivered': return 'checkmark-done-outline';
    default: return 'checkmark-outline';
  }
}

function statusColor(status: string): string {
  return status === 'read' ? colors.brand : colors.textMuted;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const conversationId = Number(id);
  const refreshUnread = useInboxStore((s) => s.refreshUnread);

  const insets = useSafeAreaInsets();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [body, setBody] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, () => setKeyboardShown(true));
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const { conversation: conv, messages: msgs } = await getConversation(conversationId);
      setConversation(conv);
      setMessages(msgs);
      await markRead(conversationId);
      refreshUnread();
    } catch {
      Alert.alert('Error', 'Could not load messages.');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setBody('');
    setShowQuickReplies(false);
    setIsSending(true);
    try {
      const msg = await sendMessage(conversationId, trimmed);
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      await markRead(conversationId);
      refreshUnread();
    } catch {
      Alert.alert('Error', 'Message failed to send.');
      setBody(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setIsSending(true);
    try {
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as File;
      const msg = await sendMessage(conversationId, body.trim() || '📷 Photo', [file]);
      setMessages((prev) => [...prev, msg]);
      setBody('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      Alert.alert('Error', 'Could not send photo.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {conversation?.subject ?? '…'}
          </Text>
          {conversation?.client && (
            <Text variant="caption" color={colors.textSecondary}>
              {conversation.client.name}
            </Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              showDate={
                index === 0 ||
                new Date(messages[index - 1].created_at).toDateString() !==
                  new Date(item.created_at).toDateString()
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="bodySm" color={colors.textTertiary}>
                No messages yet. Say hello!
              </Text>
            </View>
          }
        />

        {/* Quick replies */}
        {showQuickReplies && (
          <View style={styles.quickReplies}>
            <FlatList
              data={QUICK_REPLIES}
              keyExtractor={(q) => q}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSend(item)}
                  style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.75 }]}
                >
                  <Text variant="caption" color={colors.brand} style={{ fontWeight: '600' }}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Composer */}
        <View
          style={[
            styles.composer,
            { paddingBottom: keyboardShown ? spacing.sm : insets.bottom || spacing.md },
          ]}
        >
          <Pressable onPress={handleAttachPhoto} style={styles.composerAction} hitSlop={8}>
            <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => setShowQuickReplies((v) => !v)}
            style={[styles.composerAction, showQuickReplies && styles.composerActionActive]}
            hitSlop={8}
          >
            <Ionicons
              name="flash-outline"
              size={22}
              color={showQuickReplies ? colors.brand : colors.textSecondary}
            />
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={() => handleSend(body)}
            blurOnSubmit={false}
          />

          <Pressable
            onPress={() => handleSend(body)}
            disabled={!body.trim() || isSending}
            style={({ pressed }) => [
              styles.sendBtn,
              (!body.trim() || isSending) && styles.sendBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.onBrand} />
            ) : (
              <Ionicons name="send" size={18} color={colors.onBrand} />
            )}
          </Pressable>
        </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  showDate,
}: {
  message: Message;
  showDate: boolean;
}) {
  const isOutbound = message.sender?.type === 'User';

  return (
    <>
      {showDate && (
        <View style={styles.dateDivider}>
          <Text variant="caption" color={colors.textTertiary}>
            {new Date(message.created_at).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      )}
      <View style={[styles.bubbleRow, isOutbound && styles.bubbleRowOut]}>
        {!isOutbound && (
          <View style={styles.avatar}>
            <Text variant="caption" color={colors.textSecondary} style={{ fontWeight: '700' }}>
              {message.sender?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isOutbound ? styles.bubbleOut : styles.bubbleIn]}>
          {!isOutbound && message.sender?.name && (
            <Text variant="caption" color={colors.brand} style={{ fontWeight: '600', marginBottom: 2 }}>
              {message.sender.name}
            </Text>
          )}
          <Text variant="body" color={isOutbound ? colors.onBrand : colors.textPrimary}>
            {message.body}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text variant="caption" color={isOutbound ? 'rgba(255,255,255,0.65)' : colors.textTertiary}>
              {timeLabel(message.created_at)}
            </Text>
            {isOutbound && (
              <Ionicons
                name={statusIcon(message.status)}
                size={13}
                color={message.status === 'read' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
  },
  dateDivider: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  bubbleRowOut: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  bubbleIn: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleOut: {
    backgroundColor: colors.brand,
    borderBottomRightRadius: 4,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  quickReplies: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  composerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  composerActionActive: {
    backgroundColor: colors.brandSoft,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 9 : 8,
    paddingBottom: 8,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.textMuted,
  },
});
