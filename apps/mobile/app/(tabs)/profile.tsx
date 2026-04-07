import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { historyApi } from '../../src/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, isAuthenticated, logout } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['history-stats'],
    queryFn: () => historyApi.stats(token!),
    enabled: !!token,
  });

  const confirmLogout = () => {
    Alert.alert('Sair', 'Deseja sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Meu Perfil</Text>
        <Text style={styles.subtitle}>Faça login para salvar seu histórico em nuvem</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/login')}>
          <Text style={styles.btnText}>Entrar / Criar conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Usuário'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {stats && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Itens avaliados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(stats.avgConfidence * 100)}%</Text>
            <Text style={styles.statLabel}>Precisão média</Text>
          </View>
          <View style={[styles.statCard, styles.statCardFull]}>
            <Text style={styles.statValue}>
              R$ {stats.totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={styles.statLabel}>Valor total em avaliações</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  center: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { color: '#000', fontSize: 32, fontWeight: '800' },
  name: { color: '#F9FAFB', fontSize: 22, fontWeight: '700' },
  email: { color: '#6B7280', fontSize: 14, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: '#1C1C1C', borderRadius: 14, padding: 16, alignItems: 'center' },
  statCardFull: { width: '100%', flex: 0 },
  statValue: { color: '#F59E0B', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#6B7280', fontSize: 12, marginTop: 4, textAlign: 'center' },
  logoutBtn: { margin: 24, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444', paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
  title: { color: '#F9FAFB', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
  btn: { backgroundColor: '#F59E0B', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
