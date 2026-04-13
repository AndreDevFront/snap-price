import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from 'ui';
import { useAnalyzeStore } from '../src/store/useAnalyzeStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { historyApi, AnalysisItem } from '../src/services/api';

/** Monta a URL de busca de cada plataforma com o nome do produto */
function buildSearchUrl(platformName: string, productName: string): string {
  const q = encodeURIComponent(productName);
  switch (platformName.toLowerCase()) {
    case 'mercado livre': return `https://lista.mercadolivre.com.br/${q}`;
    case 'olx':           return `https://www.olx.com.br/brasil?q=${q}`;
    case 'facebook':      return `https://www.facebook.com/marketplace/search/?query=${q}`;
    case 'ebay':          return `https://www.ebay.com/sch/i.html?_nkw=${q}`;
    case 'enjoei':        return `https://www.enjoei.com.br/search?q=${q}`;
    case 'shopee':        return `https://shopee.com.br/search?keyword=${q}`;
    case 'americanas':    return `https://www.americanas.com.br/busca/${q}`;
    case 'amazon':        return `https://www.amazon.com.br/s?k=${q}`;
    default:              return `https://www.google.com/search?q=${q}+${encodeURIComponent(platformName)}`;
  }
}

/** Remove plataformas duplicadas (mesmo nome), mantendo a primeira ocorrência */
function deduplicatePlatforms(platforms: any[]): any[] {
  const seen = new Set<string>();
  return platforms.filter((p) => {
    const key = (p.name ?? '').toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toResultShape(item: AnalysisItem) {
  return {
    name: item.item_name,
    category: '',
    condition: '',
    estimatedPrice: item.avg_price,
    priceRange: { min: item.estimated_min, max: item.estimated_max },
    confidence: item.confidence,
    platforms: item.platforms ?? [],
    tips: item.tips ?? [],
    imageUrl: item.image_url ?? null,
  };
}

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { currentResult, currentPhoto, clearCurrent } = useAnalyzeStore();
  const { token } = useAuthStore();

  const [historyData, setHistoryData] = useState<ReturnType<typeof toResultShape> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    setLoading(true);
    historyApi.getById(token, id)
      .then((item) => setHistoryData(toResultShape(item)))
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar o item.'))
      .finally(() => setLoading(false));
  }, [id]);

  const data = historyData ?? currentResult ?? null;

  const confidenceColor =
    !data ? tokens.colors.primary
    : data.confidence >= 90 ? tokens.colors.success
    : data.confidence >= 75 ? tokens.colors.warning
    : tokens.colors.error;

  function handleClose() {
    clearCurrent();
    router.replace('/(tabs)/camera');
  }

  function handleNewAnalysis() {
    clearCurrent();
    router.replace('/(tabs)/camera');
  }

  async function handleOpenPlatform(platform: any) {
    if (!data) return;
    // Usa a URL real retornada pela API; fallback para URL de busca genérica
    const url = (platform.url && platform.url.startsWith('http'))
      ? platform.url
      : buildSearchUrl(platform.name, data.name);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', `Não foi possível abrir ${platform.name}`);
      }
    } catch {
      Alert.alert('Erro', `Não foi possível abrir ${platform.name}`);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={tokens.colors.textMuted} />
        <Text style={styles.emptyText}>Nenhum dado encontrado</Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.replace('/(tabs)/camera')}>
          <Ionicons name="camera" size={18} color={tokens.colors.textInverse} />
          <Text style={styles.ctaBtnText}>Avaliar um item</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const photoUri = historyData?.imageUrl ?? currentPhoto;
  // Deduplica plataformas antes de renderizar
  const platforms = deduplicatePlatforms(data.platforms);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleClose}>
          <Ionicons name="close" size={22} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resultado</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="share-outline" size={22} color={tokens.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        )}

        <View style={styles.itemCard}>
          <Text style={styles.itemName}>{data.name}</Text>
          {(data.category || data.condition) && (
            <View style={styles.itemMeta}>
              {data.category ? (
                <View style={styles.metaTag}><Text style={styles.metaTagText}>{data.category}</Text></View>
              ) : null}
              {data.condition ? (
                <View style={styles.metaTag}><Text style={styles.metaTagText}>{data.condition}</Text></View>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Preço estimado</Text>
          <Text style={styles.priceValue}>
            R$ {data.estimatedPrice.toLocaleString('pt-BR')}
          </Text>
          <Text style={styles.priceRange}>
            Faixa: R$ {data.priceRange.min.toLocaleString('pt-BR')} — R$ {data.priceRange.max.toLocaleString('pt-BR')}
          </Text>
          <View style={styles.confidenceSection}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>Confiança da IA</Text>
              <Text style={[styles.confidenceValue, { color: confidenceColor }]}>{data.confidence}%</Text>
            </View>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${data.confidence}%`, backgroundColor: confidenceColor }]} />
            </View>
          </View>
        </View>

        {platforms.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Preços por plataforma</Text>
            <View style={styles.platformGrid}>
              {platforms.map((p: any, index: number) => (
                <TouchableOpacity
                  key={`${p.name}-${index}`}
                  style={styles.platformCard}
                  activeOpacity={0.7}
                  onPress={() => handleOpenPlatform(p)}
                >
                  <Text style={styles.platformName}>{p.name}</Text>
                  <Text style={styles.platformPrice}>R$ {Number(p.price).toLocaleString('pt-BR')}</Text>
                  <Ionicons name="open-outline" size={12} color={tokens.colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {data.tips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Dicas para vender melhor</Text>
            <View style={styles.tipsCard}>
              {data.tips.map((tip: string, i: number) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.ctaBtn} onPress={handleNewAnalysis} activeOpacity={0.85}>
          <Ionicons name="camera" size={18} color={tokens.colors.textInverse} />
          <Text style={styles.ctaBtnText}>Avaliar outro item</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bg },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  emptyText: { fontSize: 16, color: tokens.colors.textMuted, textAlign: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.border,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: tokens.colors.text },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  photo: { width: '100%', height: 220, borderRadius: 14 },
  itemCard: {
    backgroundColor: tokens.colors.surface, borderRadius: 16,
    padding: 16, gap: 8, borderWidth: 1, borderColor: tokens.colors.border,
  },
  itemName: { fontSize: 18, fontWeight: '700', color: tokens.colors.text },
  itemMeta: { flexDirection: 'row', gap: 8 },
  metaTag: {
    backgroundColor: tokens.colors.surfaceOffset,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
  },
  metaTagText: { fontSize: 12, color: tokens.colors.textMuted, fontWeight: '500' },
  priceCard: { backgroundColor: tokens.colors.primary, borderRadius: 16, padding: 24, gap: 4 },
  priceLabel: { fontSize: 13, color: 'rgba(0,0,0,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceValue: { fontSize: 42, fontWeight: '900', color: tokens.colors.textInverse },
  priceRange: { fontSize: 14, color: 'rgba(0,0,0,0.6)', marginBottom: 16 },
  confidenceSection: { gap: 8 },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  confidenceLabel: { fontSize: 13, color: 'rgba(0,0,0,0.7)' },
  confidenceValue: { fontSize: 13, fontWeight: '700' },
  confidenceBar: { height: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: tokens.colors.text },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  platformCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: tokens.colors.surface, borderRadius: 12,
    padding: 14, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: tokens.colors.border,
  },
  platformName: { fontSize: 12, color: tokens.colors.textMuted, fontWeight: '500' },
  platformPrice: { fontSize: 16, fontWeight: '700', color: tokens.colors.text },
  tipsCard: {
    backgroundColor: tokens.colors.surface, borderRadius: 14,
    padding: 16, gap: 12, borderWidth: 1, borderColor: tokens.colors.border,
  },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.colors.primary, marginTop: 5 },
  tipText: { flex: 1, fontSize: 14, color: tokens.colors.textMuted, lineHeight: 20 },
  ctaBtn: {
    backgroundColor: tokens.colors.primary, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: tokens.colors.textInverse },
});
