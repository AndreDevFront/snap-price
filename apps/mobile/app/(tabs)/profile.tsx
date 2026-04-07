import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from 'ui';

const MENU_ITEMS = [
  { icon: 'time-outline', label: 'Histórico completo', arrow: true },
  { icon: 'star-outline', label: 'Assinar plano Pro', arrow: true, highlight: true },
  { icon: 'notifications-outline', label: 'Notificações', arrow: true },
  { icon: 'help-circle-outline', label: 'Ajuda e suporte', arrow: true },
  { icon: 'information-circle-outline', label: 'Sobre o SnapPrice', arrow: true },
  { icon: 'log-out-outline', label: 'Sair', arrow: false, danger: true },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>AL</Text>
          </View>
          <Text style={styles.name}>André Luz</Text>
          <Text style={styles.email}>andredevfront@gmail.com</Text>
          {/* Plan badge */}
          <View style={styles.planBadge}>
            <Ionicons name="flash" size={12} color={tokens.colors.primary} />
            <Text style={styles.planText}>Plano Grátis · 3/5 avaliações usadas</Text>
          </View>
        </View>

        {/* Usage bar */}
        <View style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageLabel}>Avaliações este mês</Text>
            <Text style={styles.usageCount}>3 / 5</Text>
          </View>
          <View style={styles.usageBar}>
            <View style={[styles.usageFill, { width: '60%' }]} />
          </View>
          <Text style={styles.usageHint}>Upgrade para Pro e avalie ilimitado por R$ 14,90/mês</Text>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIcon,
                  item.highlight && { backgroundColor: `${tokens.colors.primary}22` },
                  item.danger && { backgroundColor: `${tokens.colors.error}22` },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={
                    item.highlight
                      ? tokens.colors.primary
                      : item.danger
                      ? tokens.colors.error
                      : tokens.colors.textMuted
                  }
                />
              </View>
              <Text
                style={[
                  styles.menuLabel,
                  item.highlight && { color: tokens.colors.primary, fontWeight: '700' },
                  item.danger && { color: tokens.colors.error },
                ]}
              >
                {item.label}
              </Text>
              {item.arrow && (
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={tokens.colors.textFaint}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>SnapPrice v1.0.0 — Sprint 1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bg },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 26, fontWeight: '800', color: tokens.colors.text },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: tokens.colors.text },
  email: { fontSize: 14, color: tokens.colors.textMuted },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${tokens.colors.primary}18`,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, marginTop: 4,
  },
  planText: { fontSize: 12, color: tokens.colors.primary, fontWeight: '600' },
  usageCard: {
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: tokens.colors.surface,
    borderRadius: 14, padding: 16, gap: 10,
    borderWidth: 1, borderColor: tokens.colors.border,
  },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  usageLabel: { fontSize: 14, color: tokens.colors.textMuted, fontWeight: '500' },
  usageCount: { fontSize: 14, fontWeight: '700', color: tokens.colors.text },
  usageBar: {
    height: 8, backgroundColor: tokens.colors.surfaceOffset,
    borderRadius: 4, overflow: 'hidden',
  },
  usageFill: {
    height: '100%', backgroundColor: tokens.colors.primary, borderRadius: 4,
  },
  usageHint: { fontSize: 12, color: tokens.colors.textMuted, lineHeight: 16 },
  menu: { marginHorizontal: 20, gap: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: tokens.colors.surface,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: tokens.colors.border,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: tokens.colors.surfaceOffset,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, color: tokens.colors.text, fontWeight: '500' },
  version: {
    textAlign: 'center', fontSize: 12,
    color: tokens.colors.textFaint, paddingVertical: 32,
  },
});
