import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { SERVER_API_URL } from '../server/server';
import { getUserToken } from '../utils/storage';
import { colors } from '../utils/colors';

// Self-contained: owns its own state + API call.
export default function BargainModal({ visible, onClose, productId, category, onAccepted }) {
  const [offer, setOffer] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState(null);

  const check = async () => {
    if (!offer) return Alert.alert('Please enter your offer price');
    setLoading(true); setMsg(''); setResult(null);
    try {
      const token = await getUserToken();
      if (!token) return Alert.alert('Please login again');
      const { data } = await axios.post(
        `${SERVER_API_URL}/api/check`,
        { product_id: productId, main_category: category, offer_price: Number(offer) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(data); setMsg(data.message);
      if (data.result === 'accepted') onAccepted(Number(data.offered_price));
    } catch (e) {
      const err = e.response?.data;
      setResult(err || { result: 'failed' });
      setMsg(err?.message || 'Bargain request failed');
    } finally {
      setLoading(false);
    }
  };

  const ok = result?.result === 'accepted';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.h}>Make your offer</Text>
          <Text style={s.muted}>Enter the price you want to pay.</Text>
          <View style={s.inputBox}>
            <Text style={{ fontSize: 18 }}>₹</Text>
            <TextInput style={s.input} keyboardType="numeric" value={offer} onChangeText={setOffer} placeholder="Your offer" />
          </View>
          <Pressable style={s.btn} onPress={check} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Check offer</Text>}
          </Pressable>
          {!!msg && (
            <View style={[s.result, { backgroundColor: ok ? '#e8f5e9' : '#fdecea' }]}>
              <Text style={{ color: ok ? colors.success : colors.danger, fontWeight: '600' }}>{msg}</Text>
              {result?.attempts_left !== undefined && <Text style={s.muted}>Attempts left: {result.attempts_left}</Text>}
            </View>
          )}
          <Pressable onPress={onClose}><Text style={s.close}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 18, gap: 10 },
  h: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 10 },
  input: { flex: 1, paddingVertical: 10, fontSize: 16 },
  btn: { backgroundColor: colors.primary, borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700' },
  result: { borderRadius: 4, padding: 10, gap: 2 },
  close: { textAlign: 'center', color: colors.primary, fontWeight: '700', marginTop: 4 },
});
