import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { AuthStackParamList } from '../navigation';
import { Colors, Typography, Spacing } from '../constants/theme';
import Screen from '../components/Screen';
import AnimatedTextInput from '../components/AnimatedTextInput';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: email.toLowerCase().trim(), password });
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>SDR</Text>
            <Text style={styles.subtitle}>Text-First Dating</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <AnimatedTextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <Text style={styles.label}>Password</Text>
              <AnimatedTextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                autoComplete="password"
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Don't have an account? Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.xxxl,
    fontFamily: Typography.fontSerif,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.lg,
    fontFamily: Typography.fontSerif,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.buttonPrimary,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  buttonText: {
    color: Colors.bgPrimary,
    fontSize: Typography.base,
    fontFamily: Typography.fontSans,
    fontWeight: '600',
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: Typography.fontSans,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});

export default LoginScreen;
