import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from 'ui';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { historyApi, AnalysisItem } from '../../src/services/api';

function HistoryCard({ item }: { item: AnalysisItem }) {
  const confidenceColor =
    item.confidence >= 90
      ? tokens.colors.success
      : item.confidence >= 75
      ? tokens.colors.warning
      : tokens.colors.error;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push('/result')}
    >
      <View style={styles.cardEmoji}>
        <Text style={styles.emoji}>📦</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>{item.item_name}</Text>
        <View style={styles.confidenceRow}>
          <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}22` }]}>
            <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              {Math.round(item.confidence)}% confiança
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardPrice}>
          R$ {item.estimated_min.toLocaleString('pt-BR')} – R$ {item.estimated_max.toLocaleString('pt-BR')}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={tokens.colors.textFaint} />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user, token, isAuthenticated } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuário';

  const { data } = useQuery({
    queryKey: ['history'],
    queryFn: () => historyApi.list(token!),
    enabled: !!token,
  });

  const items = data?.items?.slice(0, 4) ?? [];
  const stats = data?.stats;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {firstName} 👋</Text>
          <Text style={styles.subtitle}>Avalie seus itens usados</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={tokens.colors.text} />
        </TouchableOpacity>
      </View>

      {/* CTA Banner */}
      <TouchableOpacity
        style={styles.ctaBanner}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/camera')}
      >
        <View style={styles.ctaLeft}>
          <Text style={styles.ctaTag}>IA + Câmera</Text>
          <Text style={styles.ctaTitle}>Avaliar novo item</Text>
          <Text style={styles.ctaDesc}>Aponte a câmera e descubra{`\n`}o preço em segundos</Text>
        </View>
        <Text style={styles.ctaEmoji}>📸</Text>
      </TouchableOpacity>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Avaliações', value: String(stats?.total ?? 0), icon: 'albums-outline' },
          { label: 'Precisão média', value: stats ? `${Math.round(stats.avg_confidence)}%` : '—', icon: 'analytics-outline' },
          { label: 'Plano', value: 'Grátis', icon: 'flash-outline' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon as any} size={18} color={tokens.colors.primary} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* History */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Histórico recente</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
          <Text style={styles.seeAll}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma avaliação ainda</Text>
            <Text style={styles.emptySubText}>Fotografe um item para começar</Text>
          </View>
        ) : (
          items.map((item) => <HistoryCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: tokens.colors.text },
  subtitle: { fontSize: 14, color: tokens.colors.textMuted, marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: tokens.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  ctaBanner: {
    marginHorizontal: 20, backgroundColor: tokens.colors.primary, borderRadius: 16,
    padding: 20, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  ctaLeft: { flex: 1 },
  ctaTag: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  ctaDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  ctaEmoji: { fontSize: 48 },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: tokens.colors.surface, borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: tokens.colors.border,
  },
  statValue: { fontSize: 16, fontWeight: '700', color: tokens.colors.text },
  statLabel: { fontSize: 11, color: tokens.colors.textMuted, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: tokens.colors.text },
  seeAll: { fontSize: 14, color: tokens.colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: tokens.colors.text, fontSize: 16, fontWeight: '600' },
  emptySubText: { color: tokens.colors.textMuted, fontSize: 14 },
  card: {
    backgroundColor: tokens.colors.surface, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: tokens.colors.border,
  },
  cardEmoji: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: tokens.colors.surfaceOffset, alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  cardContent: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: tokens.colors.text, marginBottom: 6 },
  confidenceRow: { flexDirection: 'row' },
  confidenceBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, gap: 4,
  },
  confidenceDot: { width: 6, height: 6, borderRadius: 3 },
  confidenceText: { fontSize: 11, fontWeight: '600' },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardPrice: { fontSize: 13, fontWeight: '700', color: tokens.colors.text },
  cardDate: { fontSize: 11, color: tokens.colors.textFaint },
});
