import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from 'ui';
import { useAnalyzeStore } from '../src/store/useAnalyzeStore';

// Fallback mock caso acesse direto sem análise
const FALLBACK = {
  name: 'iPhone 13 Pro 128GB',
  category: 'Smartphones',
  condition: 'Bom estado',
  estimatedPrice: 2800,
  priceRange: { min: 2400, max: 3200 },
  confidence: 92,
  platforms: [
    { name: 'Mercado Livre', price: 2950, url: 'https://www.mercadolivre.com.br' },
    { name: 'OLX', price: 2700, url: 'https://www.olx.com.br' },
    { name: 'Facebook', price: 2600, url: 'https://www.facebook.com/marketplace' },
    { name: 'eBay', price: 3100, url: 'https://www.ebay.com' },
  ],
  tips: [
    'Destaque o estado de conservação nas fotos',
    'Informe se possui nota fiscal e acessórios originais',
    'Publique na parte da manhã para maior visibilidade',
  ],
};

export default function ResultScreen() {
  const { currentResult, currentPhoto, clearCurrent } = useAnalyzeStore();
  const data = currentResult ?? FALLBACK;

  const { estimatedPrice, priceRange, confidence } = data;

  const confidenceColor =
    confidence >= 90 ? tokens.colors.success
    : confidence >= 75 ? tokens.colors.warning
    : tokens.colors.error;

  function handleNewAnalysis() {
    clearCurrent();
    router.push('/(tabs)/camera');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resultado</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="share-outline" size={22} color={tokens.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Foto tirada (se disponível) */}
        {currentPhoto && (
          <Image
            source={{ uri: currentPhoto }}
            style={styles.photo}
            resizeMode="cover"
          />
        )}

        {/* Item info */}
        <View style={styles.itemCard}>
          <Text style={styles.itemName}>{data.name}</Text>
          <View style={styles.itemMeta}>
            <View style={styles.metaTag}>
              <Text style={styles.metaTagText}>{data.category}</Text>
            </View>
            <View style={styles.metaTag}>
              <Text style={styles.metaTagText}>{data.condition}</Text>
            </View>
          </View>
        </View>

        {/* Price hero */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Preço estimado</Text>
          <Text style={styles.priceValue}>
            R$ {estimatedPrice.toLocaleString('pt-BR')}
          </Text>
          <Text style={styles.priceRange}>
            Faixa: R$ {priceRange.min.toLocaleString('pt-BR')} — R$ {priceRange.max.toLocaleString('pt-BR')}
          </Text>
          <View style={styles.confidenceSection}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>Confiança da IA</Text>
              <Text style={[styles.confidenceValue, { color: confidenceColor }]}>{confidence}%</Text>
            </View>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${confidence}%`, backgroundColor: confidenceColor }]} />
            </View>
          </View>
        </View>

        {/* Platforms */}
        <Text style={styles.sectionTitle}>Preços por plataforma</Text>
        <View style={styles.platformGrid}>
          {data.platforms.map((p) => (
            <TouchableOpacity key={p.name} style={styles.platformCard} activeOpacity={0.7}>
              <Text style={styles.platformName}>{p.name}</Text>
              <Text style={styles.platformPrice}>R$ {p.price.toLocaleString('pt-BR')}</Text>
              <Ionicons name="open-outline" size={12} color={tokens.colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips */}
        <Text style={styles.sectionTitle}>Dicas para vender melhor</Text>
        <View style={styles.tipsCard}>
          {data.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

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
    padding: 16, gap: 8,
    borderWidth: 1, borderColor: tokens.colors.border,
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
    padding: 16, gap: 12,
    borderWidth: 1, borderColor: tokens.colors.border,
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
