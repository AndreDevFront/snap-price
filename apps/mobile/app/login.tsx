import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../src/services/api';
import { useAuthStore } from '../src/store/useAuthStore';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Login ou registro — retorna só o token
      const data = isRegister
        ? await authApi.register({ email, password, name })
        : await authApi.login({ email, password });

      // 2. Busca os dados completos do usuário com o token
      const user = await authApi.me(data.access_token);

      return { token: data.access_token, user };
    },
    onSuccess: ({ token, user }) => {
      setAuth(token, user);
      const firstName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuário';
      Toast.show({
        type: 'success',
        text1: isRegister ? 'Conta criada com sucesso!' : `Bem-vindo de volta, ${firstName}!`,
        text2: isRegister ? 'Aproveite o SnapPrice 🎉' : 'Pronto para avaliar seus itens',
        visibilityTime: 3000,
      });
      router.replace('/(tabs)');
    },
    onError: (error: Error) => {
      const msg = error.message?.toLowerCase() ?? '';
      const isCredentials = msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid');
      Toast.show({
        type: 'error',
        text1: isRegister ? 'Erro ao criar conta' : 'Falha no login',
        text2: isCredentials
          ? 'E-mail ou senha incorretos'
          : 'Verifique sua conexão e tente novamente',
        visibilityTime: 4000,
      });
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>📸 SnapPrice</Text>
          <Text style={styles.tagline}>Avalie qualquer item em segundos</Text>
        </View>

        <View style={styles.form}>
          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {mutation.isError && (
            <Text style={styles.error}>
              {(mutation.error as Error).message}
            </Text>
          )}

          <TouchableOpacity
            style={styles.btn}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnText}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.toggle}>
              {isRegister ? 'Já tenho conta → Entrar' : 'Não tenho conta → Criar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { alignItems: 'center', marginBottom: 40 },
  logoText: { color: '#F9FAFB', fontSize: 32, fontWeight: '800' },
  tagline: { color: '#6B7280', fontSize: 14, marginTop: 8 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#1C1C1C', color: '#F9FAFB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    borderWidth: 1, borderColor: '#2D2D2D',
  },
  btn: {
    backgroundColor: '#F59E0B', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  toggle: { color: '#F59E0B', textAlign: 'center', marginTop: 12, fontSize: 14 },
  error: { color: '#EF4444', fontSize: 13, textAlign: 'center' },
});
