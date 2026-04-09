import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { historyApi, AnalysisItem } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function HistoryScreen() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['history'],
    queryFn: () => historyApi.list(token!),
    enabled: !!token,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => historyApi.remove(token!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['history'] }),
  });

  const confirmDelete = useCallback((id: string, name: string) => {
    Alert.alert('Remover', `Remover "${name}" do histórico?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }, [deleteMutation]);

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Faça login para ver o histórico</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/login')}>
          <Text style={styles.btnText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#F59E0B" /></View>;
  }

  const items = data?.items ?? [];
  const stats = data?.stats;

  // confidence vem como 0-100 direto da API (ex: 85.0 = 85%)
  const fmtConfidence = (v: number) => `${Math.round(v)}%`;
  const fmtPrice = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <View style={styles.container}>
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Avaliações</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fmtConfidence(stats.avg_confidence)}</Text>
            <Text style={styles.statLabel}>Precisão média</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>R$ {fmtPrice(stats.total_value)}</Text>
            <Text style={styles.statLabel}>Valor total</Text>
          </View>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#F59E0B" />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Nenhuma avaliação ainda</Text>
            <Text style={styles.emptySubtitle}>Fotografe um item para começar</Text>
          </View>
        }
        renderItem={({ item }: { item: AnalysisItem }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
            onLongPress={() => confirmDelete(item.id, item.item_name)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardName} numberOfLines={1}>{item.item_name}</Text>
              <Text style={styles.cardConfidence}>{fmtConfidence(item.confidence)}</Text>
            </View>
            <Text style={styles.cardPrice}>
              R$ {fmtPrice(item.estimated_min)} – R$ {fmtPrice(item.estimated_max)}
            </Text>
            <Text style={styles.cardDate}>
              {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32, backgroundColor: '#0F0F0F' },
  statsRow: { flexDirection: 'row', gap: 8, padding: 16 },
  statCard: { flex: 1, backgroundColor: '#1C1C1C', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { color: '#F59E0B', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#6B7280', fontSize: 11, marginTop: 2, textAlign: 'center' },
  card: { backgroundColor: '#1C1C1C', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { color: '#F9FAFB', fontSize: 15, fontWeight: '600', flex: 1 },
  cardConfidence: { color: '#10B981', fontSize: 13, fontWeight: '600', marginLeft: 8 },
  cardPrice: { color: '#F59E0B', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  cardDate: { color: '#6B7280', fontSize: 12 },
  emptyTitle: { color: '#F9FAFB', fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: '#6B7280', fontSize: 14 },
  btn: { backgroundColor: '#F59E0B', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
