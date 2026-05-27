import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/providers/AuthProvider';
import { PinPad } from '../src/components/PinPad';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../src/lib/constants';

type LoginMode = 'choose' | 'pin' | 'email';

export default function LoginScreen() {
  const { login, loginEmail } = useAuth();
  const [mode, setMode] = useState<LoginMode>('choose');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const clearErrors = () => {
    setError(false);
    setErrorMessage('');
  };

  const handlePinComplete = async (pin: string) => {
    setIsLoading(true);
    clearErrors();
    try {
      await login(pin);
    } catch (err: any) {
      setError(true);
      setErrorMessage(err?.message || 'PIN invalido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Preencha e-mail e senha');
      return;
    }
    setIsLoading(true);
    clearErrors();
    try {
      await loginEmail(email.trim(), senha);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Credenciais invalidas');
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de escolha
  if (mode === 'choose') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chooseWrapper}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logoImage}
            />
            <View style={styles.logoTextRow}>
              <Text style={styles.logoLight}>Café</Text>
              <Text style={styles.logoBold}>Control</Text>
            </View>
            <Text style={styles.tagline}>Sistema de Gestao para Cafeterias</Text>
          </View>

          {/* Opções */}
          <View style={styles.optionsCard}>
            <Text style={styles.optionsTitle}>Como deseja entrar?</Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => { clearErrors(); setMode('pin'); }}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionDot, { backgroundColor: COLORS.brand }]} />
                <View>
                  <Text style={styles.optionLabel}>Acesso rapido</Text>
                  <Text style={styles.optionDesc}>Entrar com PIN de 6 digitos</Text>
                </View>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => { clearErrors(); setMode('email'); }}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionDot, { backgroundColor: COLORS.text.tertiary }]} />
                <View>
                  <Text style={styles.optionLabel}>E-mail e senha</Text>
                  <Text style={styles.optionDesc}>Entrar com suas credenciais</Text>
                </View>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>CafeControl © 2025</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Tela de PIN
  if (mode === 'pin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pinWrapper}>
          <View style={styles.logoSection}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logoImageSmall}
            />
            <View style={styles.logoTextRowSmall}>
              <Text style={styles.logoLightSmall}>Café</Text>
              <Text style={styles.logoBoldSmall}>Control</Text>
            </View>
          </View>

          <Text style={styles.modeTitle}>Digite seu PIN</Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.brand} />
              <Text style={styles.loadingText}>Verificando...</Text>
            </View>
          ) : (
            <PinPad
              onComplete={handlePinComplete}
              onClear={clearErrors}
              error={error}
              disabled={isLoading}
            />
          )}

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { clearErrors(); setMode('choose'); }}
          >
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Tela de email
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.emailWrapper}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoSection}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logoImageSmall}
            />
            <View style={styles.logoTextRowSmall}>
              <Text style={styles.logoLightSmall}>Café</Text>
              <Text style={styles.logoBoldSmall}>Control</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entrar com e-mail</Text>

            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="nome@email.com"
                placeholderTextColor={COLORS.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor={COLORS.text.tertiary}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleEmailLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { clearErrors(); setMode('choose'); }}
          >
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  flex: { flex: 1 },

  // === CHOOSE ===
  chooseWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: SPACING.md,
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoLight: {
    fontSize: 30,
    fontWeight: '300',
    color: COLORS.white,
    letterSpacing: 1,
  },
  logoBold: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // Logo small (pin/email)
  logoImageSmall: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginBottom: SPACING.sm,
  },
  logoTextRowSmall: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoLightSmall: {
    fontSize: 20,
    fontWeight: '300',
    color: COLORS.white,
    letterSpacing: 1,
  },
  logoBoldSmall: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: -0.5,
  },

  // Options card
  optionsCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    padding: SPACING.xl,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: SPACING.lg,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  optionDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  optionArrow: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '300',
  },
  optionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  footer: {
    color: 'rgba(255,255,255,0.15)',
    fontSize: 12,
    marginTop: 40,
    letterSpacing: 0.5,
  },

  // === PIN ===
  pinWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  modeTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 24,
    letterSpacing: 0.3,
  },

  // === EMAIL ===
  emailWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    width: '100%',
    ...SHADOWS.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xxl,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    height: 50,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 15,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  submitBtn: {
    height: 50,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // === SHARED ===
  errorBox: {
    backgroundColor: COLORS.dangerBg,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  backBtn: {
    marginTop: 24,
    alignSelf: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  backText: {
    fontSize: 14,
    color: COLORS.brand,
    fontWeight: '600',
  },
});
