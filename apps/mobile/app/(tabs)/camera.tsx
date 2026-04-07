import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from 'ui';
import { useAnalyze } from '../../src/hooks/useAnalyze';

const { width: SCREEN_W } = Dimensions.get('window');

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { analyze, isLoading } = useAnalyze();

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={tokens.colors.primary} />
          <Text style={styles.permissionTitle}>Câmera necessária</Text>
          <Text style={styles.permissionDesc}>
            O SnapPrice precisa da câmera para fotografar itens e estimar seus preços de mercado.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Permitir acesso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || isLoading) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) analyze(photo.uri);
    } catch {
      Alert.alert('Erro', 'Não foi possível capturar a foto. Tente novamente.');
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash ? 'on' : 'off'}
      />

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
            <Text style={styles.loadingTitle}>Analisando item...</Text>
            <Text style={styles.loadingDesc}>A IA está avaliando o preço de mercado</Text>
          </View>
        </View>
      )}

      {/* Top bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Avaliar item</Text>
        <TouchableOpacity
          style={[styles.iconBtn, flash && { backgroundColor: tokens.colors.primary }]}
          onPress={() => setFlash((f) => !f)}
        >
          <Ionicons name={flash ? 'flash' : 'flash-off'} size={22} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Viewfinder */}
      <View style={styles.viewfinder}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>Centralize o item dentro da área</Text>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.sideBtn}>
          <Ionicons name="images-outline" size={26} color="#fff" />
          <Text style={styles.sideBtnLabel}>Galeria</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shutterBtn, isLoading && { opacity: 0.5 }]}
          onPress={handleCapture}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sideBtn}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
        >
          <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          <Text style={styles.sideBtnLabel}>Virar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const VIEWFINDER_SIZE = SCREEN_W * 0.75;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 16, backgroundColor: tokens.colors.bg,
  },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: tokens.colors.text, textAlign: 'center' },
  permissionDesc: { fontSize: 15, color: tokens.colors.textMuted, textAlign: 'center', lineHeight: 22 },
  permissionBtn: {
    backgroundColor: tokens.colors.primary, paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: 12, marginTop: 8,
  },
  permissionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center', justifyContent: 'center', zIndex: 99,
  },
  loadingCard: {
    backgroundColor: tokens.colors.surface, borderRadius: 20,
    padding: 32, alignItems: 'center', gap: 12, width: '80%',
    borderWidth: 1, borderColor: tokens.colors.border,
  },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: tokens.colors.text },
  loadingDesc: { fontSize: 14, color: tokens.colors.textMuted, textAlign: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  viewfinder: {
    position: 'absolute', top: '50%', left: '50%',
    width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE,
    marginTop: -VIEWFINDER_SIZE / 2, marginLeft: -VIEWFINDER_SIZE / 2,
  },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#fff' },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 4 },
  hintContainer: { position: 'absolute', bottom: '38%', left: 0, right: 0, alignItems: 'center' },
  hintText: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, overflow: 'hidden',
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 48, paddingTop: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sideBtn: { alignItems: 'center', gap: 4, width: 70 },
  sideBtnLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  shutterBtn: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
});
