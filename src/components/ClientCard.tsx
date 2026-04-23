import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Client } from '../types';
import { formatPhone } from '../utils/format';

interface Props {
  client: Client;
  onCall: () => void;
  onEmail: () => void;
  onNavigate: () => void;
}

export default function ClientCard({ client, onCall, onEmail, onNavigate }: Props) {
  return (
    <View style={styles.container}>
      {/* Header with avatar */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {client.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{client.full_name}</Text>
          {client.email ? (
            <TouchableOpacity onPress={onEmail}>
              <Text style={styles.email}>{client.email}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {client.phone ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onCall}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        ) : null}
        {client.email ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onEmail}>
            <Text style={styles.actionIcon}>✉️</Text>
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
        ) : null}
        {client.address ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onNavigate}>
            <Text style={styles.actionIcon}>🧭</Text>
            <Text style={styles.actionText}>Navigate</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Address */}
      {client.address ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText}>{client.address}</Text>
        </View>
      ) : null}

      {/* Phone */}
      {client.phone ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📱</Text>
          <Text style={styles.infoText}>{formatPhone(client.phone)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  email: {
    fontSize: 14,
    color: '#4f46e5',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    lineHeight: 20,
  },
});
