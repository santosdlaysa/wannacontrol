import React, { useState } from 'react';
import {
  View,
  Text,
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
import { COLORS } from '../src/lib/constants';

export default function LoginScreen() {
  const { login, loginEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handlePinComplete = async (pin: string) => {
    setIsLoading(true);
    setError(false);
    setErrorMessage('');
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
    setErrorMessage('');
    try {
      await loginEmail(email.trim(), senha);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Credenciais invalidas');
    } finally {
      setIsLoading(false);
    }
  };

  if (showEmailLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.emailContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>CafeControl</Text>
            <Text style={styles.subtitle}>Login com E-mail</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor={COLORS.gray[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor={COLORS.gray[400]}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.emailButton, isLoading && styles.disabledButton]}
              onPress={handleEmailLogin}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.emailButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchLink}
              onPress={() => {
                setShowEmailLogin(false);
                setErrorMessage('');
              }}
            >
              <Text style={styles.switchLinkText}>Entrar com PIN</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pinContainer}>
        <Text style={styles.icon}>&#9749;</Text>
        <Text style={styles.title}>CafeControl</Text>
        <Text style={styles.subtitle}>Digite seu PIN</Text>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Autenticando...</Text>
          </View>
        ) : (
          <PinPad
            onComplete={handlePinComplete}
            onClear={() => {
              setError(false);
              setErrorMessage('');
            }}
            error={error}
            disabled={isLoading}
          />
        )}

        <TouchableOpacity
          style={styles.switchLink}
          onPress={() => {
            setShowEmailLogin(true);
            setErrorMessage('');
            setError(false);
          }}
        >
          <Text style={styles.switchLinkText}>Entrar com e-mail</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  pinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emailContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginBottom: 32,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  switchLink: {
    marginTop: 32,
    padding: 12,
  },
  switchLinkText: {
    fontSize: 14,
    color: COLORS.accent,
    textDecorationLine: 'underline',
  },
  inputContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.gray[800],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  emailButton: {
    width: '100%',
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  emailButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
