import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { FONTS, SIZES } from '../../constants/theme';

const LoginScreen = ({ navigation }) => {
  const { login, requestPasswordReset } = useAuth();
  const { theme } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password Recovery Modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Enter both your email address and password.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message);
    }
  };

  const handleRequestReset = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Email Needed', 'Enter your registered patron email address.');
      return;
    }
    setResetLoading(true);
    const res = await requestPasswordReset(resetEmail.trim());
    setResetLoading(false);

    if (res.success) {
      setResetOpen(false);
      Alert.alert(
        'Recovery Dispatched',
        'If an account matches that email, a password reset link has been sent.'
      );
    } else {
      Alert.alert('Notice', res.message || 'Could not dispatch reset request.');
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quiet Luxury Crest Masthead */}
          <View style={styles.header}>
            <View style={styles.crestCircle}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.crestImg}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>
              BAZARO
            </Text>
            <Text style={[styles.brandTagline, { color: theme.primary }]}>
              APNAR DESHER BAZAAR
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Sign in to access your Patron Portal, Saved Vault & Bag
            </Text>
          </View>

          {errorMessage ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: 'rgba(185, 28, 28, 0.1)',
                  borderColor: theme.danger,
                },
              ]}
            >
              <Ionicons name="alert-circle" size={18} color={theme.danger} />
              <Text style={[styles.errorBoxText, { color: theme.danger }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <CustomInput
              label="Email Address"
              placeholder="patron@example.com"
              iconName="mail-outline"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMessage('');
              }}
            />

            <CustomInput
              label="Password"
              placeholder="Enter your password"
              iconName="lock-closed-outline"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage('');
              }}
            />

            <TouchableOpacity
              onPress={() => {
                setResetEmail(email.trim());
                setResetOpen(true);
              }}
              style={styles.forgotLinkWrap}
            >
              <Text style={[styles.forgotLinkText, { color: theme.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <CustomButton
              title="Enter Patron Vault"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>
                New to BAZARO?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.linkText, { color: theme.primary }]}>
                  Create Patron Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={resetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setResetOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Recover Access
              </Text>
              <TouchableOpacity onPress={() => setResetOpen(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalHint, { color: theme.textMuted }]}>
              Enter the email linked to your account. We will dispatch a recovery token.
            </Text>
            <CustomInput
              label="Registered Email"
              placeholder="patron@example.com"
              iconName="mail-outline"
              keyboardType="email-address"
              value={resetEmail}
              onChangeText={setResetEmail}
            />
            <CustomButton
              title="Send Recovery Email"
              onPress={handleRequestReset}
              loading={resetLoading}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  crestCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#0D0A08',
    borderWidth: 2,
    borderColor: '#C59B4B',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  crestImg: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontFamily: FONTS.serif,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 19,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    borderRadius: SIZES.radiusMd,
    marginBottom: 16,
    gap: 8,
  },
  errorBoxText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  forgotLinkWrap: {
    alignSelf: 'flex-end',
    marginTop: -6,
    marginBottom: 16,
  },
  forgotLinkText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  loginBtn: {
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13.5,
  },
  linkText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 10, 8, 0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: SIZES.radiusLg,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: FONTS.serif,
    fontSize: 21,
    fontWeight: '700',
  },
  modalHint: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 16,
  },
});

export default LoginScreen;
