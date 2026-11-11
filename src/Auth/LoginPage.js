// src/screens/LoginPage.js
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

const LoginPage = ({ navigation }) => {
  const { isLoggedIn, loading: userLoading } = useContext(GlobleInfo);

  const [mobileNum, setMobileNum] = useState('');
  const [loading, setLoading] = useState(false);

  // Go back to the previous screen (or Home if there is no previous screen)
  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  };

  // If the user already has a token (logged in), no need to login again. Go back.
  useEffect(() => {
    if (!userLoading && isLoggedIn) {
      goBack();
    }
  }, [isLoggedIn, userLoading]);

  // Mobile number must be exactly 10 digits
  const isValidMobileNumber = (number) => /^[0-9]{10}$/.test(number);

  const handleSubmit = async () => {
    if (!isValidMobileNumber(mobileNum)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${SERVER_API_URL}/api/login`,
        { mobile_num: mobileNum },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = response.data;
      // console.log("login page token", data.user_token)

      if (data?.user_token && data?.otp) {
        // We do NOT save the token here.
        // We send it to the OTP page. It is saved only after the OTP is correct.
        navigation.replace('OtpVerify', {
          phoneNumber: mobileNum,
          token: data.user_token,
          otp: String(data.otp),
        });
      } else {
        Alert.alert('Login Failed', 'Could not get a valid token or OTP. Please try again.');
      }
    } catch (error) {
      console.log('Login error:', error.response?.data || error.message);
      Alert.alert('Login Failed', 'Something went wrong. Please check the mobile number and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={GOLD} barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Gold top part */}
          <View style={styles.top}>
            <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={28} color={TEXT} />
            </TouchableOpacity>

            <Text style={styles.brand}>Bharat Bargains</Text>
            <Text style={styles.tagline}>Login to get exclusive offers</Text>
          </View>

          {/* White bottom part */}
          <View style={styles.sheet}>
            <Text style={styles.heading}>Login or Sign up</Text>

            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputRow}>
              <Text style={styles.code}>+91</Text>
              <TextInput
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#b0b0b0"
                keyboardType="number-pad"
                style={styles.input}
                value={mobileNum}
                onChangeText={(t) => setMobileNum(t.replace(/[^0-9]/g, ''))}
                maxLength={10}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={TEXT} />
              ) : (
                <Text style={styles.buttonText}>CONTINUE</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.desc}>
              By continuing, you agree to our <Text style={styles.link}>Terms of Use</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginPage;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GOLD },

  // gold top
  top: { backgroundColor: GOLD, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    fontStyle: 'italic',
    color: TEXT,
    marginTop: 24,
  },
  tagline: { fontSize: 15, color: '#3d3d3d', marginTop: 6 },

  // white bottom
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  heading: { fontSize: 22, fontWeight: '700', color: TEXT, marginBottom: 24 },
  label: { fontSize: 13, color: GREY, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderColor: GOLD_DARK,
    marginBottom: 28,
  },
  code: { fontSize: 17, fontWeight: '600', color: TEXT, marginRight: 10 },
  input: { flex: 1, height: 48, fontSize: 17, color: TEXT, letterSpacing: 1 },
  button: {
    height: 50,
    borderRadius: 4,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  buttonText: { fontSize: 16, fontWeight: '800', color: TEXT, letterSpacing: 1 },
  desc: { fontSize: 12, color: GREY, textAlign: 'center', lineHeight: 18, marginTop: 28 },
  link: { color: GOLD_DARK, fontWeight: '600' },
});