import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

import { GlobleInfo } from '../context/GlobleInfoContext';
import { SERVER_API_URL } from '../server/server';

const GOLD = '#F5B800';
const GOLD_DARK = '#C99700';
const TEXT = '#212121';
const GREY = '#878787';

const OTP_SECONDS = 120; // OTP is valid for 2 minutes

const OtpVerify = ({ route, navigation }) => {
  const { phoneNumber } = route.params;
  const { login, logout } = useContext(GlobleInfo);

  // Token and OTP come from the login page. We keep them in state so Resend can change them.
  const [authToken, setAuthToken] = useState(route.params.token);
  const [otp, setOtp] = useState(String(route.params.otp));

  const [enteredOtp, setEnteredOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS);
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Count down every second
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Show the OTP popup after 3 seconds (demo only, no SMS)
  useEffect(() => {
    setShowOtp(false);
    const timer = setTimeout(() => setShowOtp(true), 3000);
    return () => clearTimeout(timer);
  }, [otp]);

  // Turn seconds into mm:ss
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Wrong OTP: make sure no token is saved, then go back to the login page
  const failAndGoToLogin = async () => {
    await logout(); // deletes the token (if any)
    navigation.replace('LoginPage');
  };

  const submitHandler = async () => {
    // OTP time is over
    if (secondsLeft <= 0) {
      Alert.alert('OTP Expired', 'Please tap Resend OTP to get a new one.');
      return;
    }

    if (enteredOtp.length === 0) {
      Alert.alert('Enter OTP', 'Please enter the OTP.');
      return;
    }

    // OTP is correct: save the token and go to Home
    if (enteredOtp === otp) {
      setLoading(true);
      try {
        await login(authToken); // saves the token, loads user and cart
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } catch (error) {
        console.log('Login save error:', error.message);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // OTP is wrong
    Alert.alert('Incorrect OTP', 'The OTP is wrong. Please login again.', [
      { text: 'OK', onPress: failAndGoToLogin },
    ]);
  };

  // Ask the server for a new OTP and token
  const resendOtp = async () => {
    try {
      const response = await axios.post(`${SERVER_API_URL}/api/login`, {
        mobile_num: phoneNumber,
      });
      const data = response.data;

      if (data?.token && data?.otp) {
        setAuthToken(data.token);
        setOtp(String(data.otp));
        setEnteredOtp('');
        setSecondsLeft(OTP_SECONDS);
      } else {
        Alert.alert('Error', 'Could not send a new OTP.');
      }
    } catch (error) {
      console.log('Resend error:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not send a new OTP.');
    }
  };

  const expired = secondsLeft <= 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={GOLD} barStyle="dark-content" />

      {/* Top bar with back arrow */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={failAndGoToLogin} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={26} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Verify OTP</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Demo OTP popup */}
          {showOtp && !expired && (
            <View style={styles.otpPopup}>
              <Text style={styles.otpPopupLabel}>Your OTP</Text>
              <Text style={styles.otpPopupText}>{otp}</Text>
            </View>
          )}

          <Text style={styles.heading}>Please enter the OTP sent to</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.phone}>+91 {phoneNumber}</Text>
            <TouchableOpacity onPress={failAndGoToLogin}>
              <Text style={styles.change}>Change</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            placeholderTextColor="#c0c0c0"
            value={enteredOtp}
            onChangeText={(t) => setEnteredOtp(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />

          {/* Timer and Resend */}
          <View style={styles.timerRow}>
            {expired ? (
              <Text style={styles.expiredText}>OTP expired</Text>
            ) : (
              <Text style={styles.timerText}>OTP expires in {formatTime(secondsLeft)}</Text>
            )}
            <TouchableOpacity onPress={resendOtp}>
              <Text style={styles.resend}>Resend OTP</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={submitHandler}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={TEXT} />
            ) : (
              <Text style={styles.buttonText}>VERIFY</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OtpVerify;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GOLD },

  // top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  topTitle: { marginLeft: 16, fontSize: 18, fontWeight: '700', color: TEXT },

  body: { flex: 1, backgroundColor: '#fff' },

  // demo OTP popup
  otpPopup: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  otpPopupLabel: { fontSize: 11, color: GREY },
  otpPopupText: { fontSize: 22, fontWeight: '800', color: TEXT, letterSpacing: 4 },

  heading: { fontSize: 15, color: GREY, marginTop: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 28 },
  phone: { fontSize: 18, fontWeight: '700', color: TEXT },
  change: { marginLeft: 12, fontSize: 14, fontWeight: '700', color: GOLD_DARK },

  input: {
    height: 56,
    fontSize: 24,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: 10,
    borderBottomWidth: 1.5,
    borderColor: GOLD_DARK,
  },

  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 32,
  },
  timerText: { fontSize: 13, color: GREY },
  expiredText: { fontSize: 13, color: '#d32f2f', fontWeight: '600' },
  resend: { fontSize: 14, fontWeight: '700', color: GOLD_DARK },

  button: {
    height: 50,
    borderRadius: 4,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  buttonText: { fontSize: 16, fontWeight: '800', color: TEXT, letterSpacing: 1 },
});