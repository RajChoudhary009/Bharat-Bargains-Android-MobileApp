// src/screens/CheckOutPage.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import {
  CFEnvironment,
  CFSession,
  CFThemeBuilder,
  CFDropCheckoutPayment,
} from 'cashfree-pg-api-contract';

import { GlobleInfo } from '../context/GlobleInfoContext';
import { SERVER_API_URL } from '../server/server';

// Same colors as AccountScreen
const GOLD = '#F5B800';
const GOLD_DARK = '#C99700';
const BG = '#f1f3f6';
const TEXT = '#212121';
const GREY = '#878787';
const GREEN = '#388e3c';

// Use CFEnvironment.SANDBOX while testing, PRODUCTION for real money
const CASHFREE_MODE = CFEnvironment.PRODUCTION;

const EMPTY_ADDRESS = {
  contact_name: '',
  pincode: '',
  phone_number: '',
  address: '',
  city: '',
  state: '',
  landmark: '',
  house_flat_office_no: '',
  address_type: 'home',
};

/* ------------------------------------------------------------------ */
/* Small input box (label + text box)                                  */
/* ------------------------------------------------------------------ */
const Field = ({ label, value, onChangeText, keyboardType, editable = true, maxLength }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.fieldInput, !editable && styles.fieldDisabled]}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      editable={editable}
      maxLength={maxLength}
      placeholderTextColor="#b0b0b0"
    />
  </View>
);

/* ------------------------------------------------------------------ */
/* Address form (used for both "add new" and "edit")                   */
/* ------------------------------------------------------------------ */
const AddressFields = ({ data, setData, mobile }) => {
  // Change one field
  const set = (key, value) => setData({ ...data, [key]: value });

  return (
    <View>
      <Field label="Name" value={data.contact_name} onChangeText={(t) => set('contact_name', t)} />
      <Field label="Mobile Number" value={String(mobile || '')} editable={false} />
      <Field
        label="Pincode"
        value={String(data.pincode ?? '')}
        onChangeText={(t) => set('pincode', t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={6}
      />
      <Field
        label="Alternate Phone (Optional)"
        value={String(data.phone_number ?? '')}
        onChangeText={(t) => set('phone_number', t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={10}
      />
      <Field
        label="Flat, House No., Building"
        value={data.house_flat_office_no}
        onChangeText={(t) => set('house_flat_office_no', t)}
      />
      <Field label="Address (Area and Street)" value={data.address} onChangeText={(t) => set('address', t)} />
      <Field label="City / District / Town" value={data.city} onChangeText={(t) => set('city', t)} />
      <Field label="State" value={data.state} onChangeText={(t) => set('state', t)} />
      <Field
        label="Landmark (Optional)"
        value={data.landmark}
        onChangeText={(t) => set('landmark', t)}
      />

      {/* Home or Work */}
      <View style={styles.typeRow}>
        {['home', 'work'].map((type) => {
          const on = data.address_type === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, on && styles.typeChipOn]}
              onPress={() => set('address_type', type)}
            >
              <Text style={[styles.typeChipText, on && { color: TEXT, fontWeight: '700' }]}>
                {type === 'home' ? 'Home (All day)' : 'Work (10 AM - 5 PM)'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// All important fields must be filled
const isFormOk = (a) => {
  if (!a.contact_name?.trim()) return 'Please enter the name';
  if (String(a.pincode ?? '').length !== 6) return 'Please enter a 6-digit pincode';
  if (!a.house_flat_office_no?.trim()) return 'Please enter flat or house number';
  if (!a.address?.trim()) return 'Please enter the address';
  if (!a.city?.trim()) return 'Please enter the city';
  if (!a.state?.trim()) return 'Please enter the state';
  return null;
};

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */
const CheckOutPage = ({ navigation }) => {
  const { checkoutData, userData, getCart, logout } = useContext(GlobleInfo);

  const [addressList, setAddressList] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const [editAddress, setEditAddress] = useState(null); // address that is being edited
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const amount = Number(checkoutData?.power?.selectedLensOrProducrPrice) || 0;
  // mobile_num field name of userData may be different in your server. Change if needed.
  const mobile = checkoutData?.product?.mobile_number || userData?.mobile_num || '';

  // Refs keep the latest values for the payment callback (it is set only one time)
  const checkoutRef = useRef(checkoutData);
  checkoutRef.current = checkoutData;
  const payRef = useRef({ addressId: null });

  // If there is nothing to buy, go back
  useEffect(() => {
    if (!checkoutData || Object.keys(checkoutData).length === 0) {
      if (navigation.canGoBack()) navigation.goBack();
    }
  }, [checkoutData]);

  // Header with the login token
  const authConfig = async () => {
    const token = await AsyncStorage.getItem('user_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // If token is expired (401) logout and open the login page
  const onApiError = async (error, message) => {
    console.log('API error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      await logout();
      Alert.alert('Session expired', 'Please login again.');
      navigation.navigate('LoginPage');
    } else {
      Alert.alert('Error', error.response?.data?.message || message);
    }
  };

  /* ---------- get all saved addresses ---------- */
  const fetchAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (!token) {
        Alert.alert('Please login');
        navigation.navigate('LoginPage');
        return;
      }

      const res = await axios.get(`${SERVER_API_URL}/getalladdressinfo`, await authConfig());
      const list = Array.isArray(res.data) ? res.data : [];
      setAddressList(list);

      // Keep the old selected address if it is still there, else select the first one
      setSelectedAddress((old) => list.find((a) => a.addresses_id === old?.addresses_id) || list[0] || null);

      // No saved address: open the "add new address" form
      setShowForm(list.length === 0);
    } catch (error) {
      await onApiError(error, 'Could not load your addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  /* ---------- Cashfree payment ---------- */
  // Step 3: payment is done, ask our server to check it
  const verifyPayment = async (orderId) => {
    try {
      const body = { checkoutData: checkoutRef.current, orderId };
      if (payRef.current.addressId) body.selectedAddressId = payRef.current.addressId;

      const res = await axios.post(`${SERVER_API_URL}/api/cashfree-verify`, body);
      const status = res.data?.paymentData?.payment_status;

      if (status === 'SUCCESS') {
        await getCart(); // refresh the cart
        Alert.alert('Payment successful 🎉', 'Your order is placed.', [
          { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) },
        ]);
      } else {
        Alert.alert('Payment not completed', 'Payment failed or is pending.');
      }
    } catch (error) {
      console.log('Verify error:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not verify the payment.');
    } finally {
      setPaying(false);
    }
  };

  // Step 2: set the callback one time (Cashfree tells us when payment ends)
  useEffect(() => {
    CFPaymentGatewayService.setCallback({
      onVerify(orderID) {
        verifyPayment(orderID);
      },
      onError(error, orderID) {
        setPaying(false);
        Alert.alert('Payment failed', error?.getMessage?.() || 'Something went wrong.');
      },
    });

    return () => CFPaymentGatewayService.removeCallback();
  }, []);

  // Step 1: create the order on our server, then open the Cashfree payment screen
  const startPayment = async (addressId) => {
    if (!amount || amount <= 0) {
      Alert.alert('Invalid amount');
      return;
    }

    setPaying(true);
    try {
      const res = await axios.post(`${SERVER_API_URL}/api/cashfree-order`, {
        amount,
        mobile_number: mobile,
      });

      const sessionId = res.data?.payment_session_id;
      const orderId = res.data?.order_id;

      if (!sessionId || !orderId) {
        Alert.alert('Error', 'Could not start the payment.');
        setPaying(false);
        return;
      }

      payRef.current = { addressId }; // remember which address was used

      const session = new CFSession(sessionId, orderId, CASHFREE_MODE);
      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor(GOLD)
        .setNavigationBarTextColor(TEXT)
        .setButtonBackgroundColor(GOLD)
        .setButtonTextColor(TEXT)
        .build();

      const dropPayment = new CFDropCheckoutPayment(session, null, theme);
      CFPaymentGatewayService.doPayment(dropPayment);
    } catch (error) {
      setPaying(false);
      console.log('Order error:', error.response?.data || error.message);
      Alert.alert('Error', 'Order could not be created.');
    }
  };

  /* ---------- add / edit / delete address ---------- */
  const saveNewAddress = async () => {
    const problem = isFormOk(newAddress);
    if (problem) {
      Alert.alert('Check the form', problem);
      return;
    }

    try {
      const res = await axios.post(
        `${SERVER_API_URL}/addaddress`,
        { ...newAddress, mobile_num: mobile },
        await authConfig()
      );

      if (res.status === 201) {
        setNewAddress(EMPTY_ADDRESS);
        await fetchAddresses();
        startPayment(null); // same as the web page: pay right after saving
      } else {
        Alert.alert('Error', 'Could not save the address.');
      }
    } catch (error) {
      await onApiError(error, 'You can only have up to 10 addresses. Please try again.');
    }
  };

  const updateAddress = async () => {
    const problem = isFormOk(editAddress);
    if (problem) {
      Alert.alert('Check the form', problem);
      return;
    }

    try {
      await axios.put(
        `${SERVER_API_URL}/editaddress/${editAddress.addresses_id}`,
        editAddress,
        await authConfig()
      );
      setEditAddress(null);
      fetchAddresses();
    } catch (error) {
      await onApiError(error, 'Could not update the address.');
    }
  };

  const deleteAddress = (id) => {
    Alert.alert('Delete address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${SERVER_API_URL}/removeaddress/${id}`, await authConfig());
            fetchAddresses();
          } catch (error) {
            await onApiError(error, 'Could not delete the address.');
          }
        },
      },
    ]);
  };

  /* ---------- screen ---------- */
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={GOLD} barStyle="dark-content" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={26} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Checkout</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Amount box */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount to pay</Text>
            <Text style={styles.amountValue}>₹{amount.toFixed(0)}</Text>
          </View>

          {/* Delivery address title */}
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>{addressList.length}</Text>
            </View>
            <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={GOLD} style={{ marginVertical: 30 }} />
          ) : (
            addressList.map((addr) => {
              const selected = selectedAddress?.addresses_id === addr.addresses_id;
              return (
                <TouchableOpacity
                  key={addr.addresses_id}
                  activeOpacity={0.9}
                  style={[styles.addrCard, selected && styles.addrCardOn]}
                  onPress={() => setSelectedAddress(addr)}
                >
                  <View style={styles.addrTop}>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={selected ? GOLD_DARK : '#bdbdbd'}
                    />

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.addrName}>{addr.contact_name}</Text>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>{addr.address_type}</Text>
                        </View>
                      </View>
                      <Text style={styles.addrPhone}>{addr.mobile_num}</Text>
                      <Text style={styles.addrText}>
                        {addr.house_flat_office_no}, {addr.address}, {addr.city}, {addr.state} -{' '}
                        <Text style={{ fontWeight: '700' }}>{addr.pincode}</Text>
                      </Text>
                    </View>

                    <View style={styles.iconCol}>
                      <TouchableOpacity onPress={() => setEditAddress(addr)} style={styles.iconBtn}>
                        <Ionicons name="create-outline" size={20} color={TEXT} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteAddress(addr.addresses_id)} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={20} color="#d32f2f" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Button only on the selected address */}
                  {selected && (
                    <TouchableOpacity
                      style={[styles.deliverBtn, paying && { opacity: 0.7 }]}
                      activeOpacity={0.85}
                      disabled={paying}
                      onPress={() => startPayment(addr.addresses_id)}
                    >
                      {paying ? (
                        <ActivityIndicator color={TEXT} />
                      ) : (
                        <Text style={styles.deliverText}>DELIVER HERE</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {/* Add a new address row */}
          {!loading && addressList.length > 0 && (
            <TouchableOpacity style={styles.addRow} onPress={() => setShowForm(!showForm)}>
              <Ionicons name={showForm ? 'remove' : 'add'} size={22} color={GOLD_DARK} />
              <Text style={styles.addText}>Add a new address</Text>
            </TouchableOpacity>
          )}

          {/* New address form */}
          {!loading && showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>ADD A NEW ADDRESS</Text>

              <AddressFields data={newAddress} setData={setNewAddress} mobile={mobile} />

              <TouchableOpacity
                style={[styles.deliverBtn, paying && { opacity: 0.7 }]}
                activeOpacity={0.85}
                disabled={paying}
                onPress={saveNewAddress}
              >
                {paying ? (
                  <ActivityIndicator color={TEXT} />
                ) : (
                  <Text style={styles.deliverText}>SAVE AND DELIVER HERE</Text>
                )}
              </TouchableOpacity>

              {addressList.length > 0 && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit address popup */}
      <Modal visible={!!editAddress} transparent animationType="slide" onRequestClose={() => setEditAddress(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>EDIT DELIVERY ADDRESS</Text>

            <ScrollView keyboardShouldPersistTaps="handled" style={{ padding: 16 }}>
              {editAddress && (
                <AddressFields data={editAddress} setData={setEditAddress} mobile={editAddress.mobile_num} />
              )}
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setEditAddress(null)}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetUpdate} onPress={updateAddress}>
                <Text style={styles.deliverText}>UPDATE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CheckOutPage;

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GOLD },
  body: { flex: 1, backgroundColor: BG },

  // top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  topTitle: { marginLeft: 16, fontSize: 18, fontWeight: '700', color: TEXT },

  // amount box
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  amountLabel: { fontSize: 14, color: GREY },
  amountValue: { fontSize: 20, fontWeight: '800', color: TEXT },

  // section title
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepText: { fontSize: 12, fontWeight: '800', color: TEXT },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: GREY },

  // address card
  addrCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  addrCardOn: { backgroundColor: '#FFF8E1' },
  addrTop: { flexDirection: 'row', alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  addrName: { fontSize: 15, fontWeight: '700', color: TEXT },
  typeBadge: {
    backgroundColor: '#e8e8e8',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: GREY, textTransform: 'uppercase' },
  addrPhone: { fontSize: 13, color: TEXT, marginTop: 4 },
  addrText: { fontSize: 13, color: '#555', marginTop: 4, lineHeight: 19 },
  iconCol: { marginLeft: 8 },
  iconBtn: { padding: 6 },

  // buttons
  deliverBtn: {
    height: 48,
    borderRadius: 4,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    elevation: 2,
  },
  deliverText: { fontSize: 15, fontWeight: '800', color: TEXT, letterSpacing: 0.5 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { fontSize: 14, fontWeight: '700', color: GOLD_DARK },

  // add new address
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  addText: { marginLeft: 10, fontSize: 14, fontWeight: '700', color: GOLD_DARK },

  // form
  formCard: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  formTitle: { fontSize: 13, fontWeight: '700', color: GREY, marginBottom: 12 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: GREY, marginBottom: 4 },
  fieldInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
    color: TEXT,
  },
  fieldDisabled: { backgroundColor: '#f3f3f3', color: GREY },
  typeRow: { flexDirection: 'row', marginTop: 4 },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  typeChipOn: { backgroundColor: '#FFF8E1', borderColor: GOLD_DARK },
  typeChipText: { fontSize: 12, color: GREY },

  // edit popup
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: '90%',
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GREY,
    padding: 16,
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  sheetActions: { flexDirection: 'row', padding: 12, borderTopWidth: 0.5, borderColor: '#e0e0e0' },
  sheetCancel: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: GOLD_DARK,
    borderRadius: 4,
    marginRight: 8,
  },
  sheetUpdate: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    borderRadius: 4,
  },
});