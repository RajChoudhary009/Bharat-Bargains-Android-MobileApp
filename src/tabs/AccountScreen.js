import React, { useState, useCallback, useContext } from 'react';
import {
  Text,
  View,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {GlobleInfo} from '../context/GlobleInfoContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';

const GOLD = '#F5B800';
const GOLD_DARK = '#C99700';
const BG = '#f1f3f6';
const TEXT = '#212121';
const GREY = '#878787';

// AsyncStorage keys: apne login code ke hisaab se badlo
const TOKEN_KEY = 'token';
const NAME_KEY = 'userName';

/*
 * screen: App.js me registered screen ka naam. null ho to "Coming soon" alert aayega.
 * Jab koi screen bana lo, bas yahan uska naam likh do.
 */
const QUICK_ACTIONS = [
  { icon: 'cube-outline', label: 'Orders', screen: null },
  { icon: 'heart-outline', label: 'Wishlist', screen: null },
  { icon: 'ticket-outline', label: 'Coupons', screen: null },
  { icon: 'headset-outline', label: 'Help Centre', screen: null },
];

const SECTIONS = [
  {
    title: 'Account Settings',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', screen: null },
      { icon: 'card-outline', label: 'Saved Cards & Wallet', screen: null },
      { icon: 'location-outline', label: 'Saved Addresses', screen: null },
      { icon: 'language-outline', label: 'Select Language', screen: null },
      { icon: 'notifications-outline', label: 'Notification Settings', screen: null },
    ],
  },
  {
    title: 'My Activity',
    items: [
      { icon: 'star-outline', label: 'Reviews', screen: null },
      { icon: 'chatbubble-ellipses-outline', label: 'Questions & Answers', screen: null },
    ],
  },
  {
    title: 'Earn with Bharat Bargains',
    items: [{ icon: 'storefront-outline', label: 'Sell on Bharat Bargains', screen: null }],
  },
  {
    title: 'Feedback & Information',
    items: [
      { icon: 'document-text-outline', label: 'Terms, Policies and Licenses', screen: null },
      { icon: 'help-circle-outline', label: 'Browse FAQs', screen: null },
    ],
  },
];

const AccountScreen = ({ navigation }) => {
  // const {userData} = React.useContext(userData);
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState('');

  // Screen par aate hi login status dobara check hota hai
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          const savedName = await AsyncStorage.getItem(NAME_KEY);
          setLoggedIn(!!token);
          setName(savedName || '');
        } catch (e) {
          setLoggedIn(false);
        }
      })();
    }, [])
  );

  const go = (screen) => {
    if (screen) navigation.navigate(screen);
    else Alert.alert('Coming soon', 'this section is coming soon...');
  };

  const goLogin = () => navigation.navigate('LoginPage');
  const goSignup = () => navigation.navigate('LoginPage', { mode: 'signup' });

  const logout = () => {
    Alert.alert('Logout', 'Kya aap logout karna chahte ho?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([TOKEN_KEY, NAME_KEY]);
          } catch (e) {}
          setLoggedIn(false);
          setName('');
          navigation.reset({ index: 0, routes: [{ name: 'LoginPage' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={GOLD} barStyle="dark-content" />
      <Header
        onCart={() => navigation.navigate('CartTab')}
        onSearch={(q) => navigation.navigate('Eyewear', { eyewear_types: q })}
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* ---------- profile / login card ---------- */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>

          {loggedIn ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.hello}>Hello,</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {name || 'Shopper'}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={styles.hello}>Welcome to Bharat Bargains</Text>
              <View style={styles.authRow}>
                <TouchableOpacity style={styles.loginBtn} onPress={goLogin} activeOpacity={0.85}>
                  <Text style={styles.loginText}>LOGIN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.signupBtn} onPress={goSignup} activeOpacity={0.85}>
                  <Text style={styles.signupText}>SIGN UP</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ---------- quick action tiles (2 x 2) ---------- */}
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((q) => (
            <TouchableOpacity
              key={q.label}
              style={styles.quickTile}
              activeOpacity={0.8}
              onPress={() => go(q.screen)}
            >
              <Ionicons name={q.icon} size={20} color={TEXT} />
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ---------- sections ---------- */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.row, i === section.items.length - 1 && styles.rowLast]}
                activeOpacity={0.7}
                onPress={() => go(item.screen)}
              >
                <Ionicons name={item.icon} size={20} color={GOLD_DARK} />
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#bdbdbd" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* ---------- logout ---------- */}
        {loggedIn && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>Bharat Bargains · v1.0.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GOLD },
  body: { flex: 1, backgroundColor: BG },

  // profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  hello: { fontSize: 14, color: GREY },
  userName: { fontSize: 18, fontWeight: '700', color: TEXT, marginTop: 2 },
  authRow: { flexDirection: 'row', marginTop: 10 },
  loginBtn: {
    flex: 1,
    height: 38,
    borderRadius: 4,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  loginText: { color: TEXT, fontSize: 13, fontWeight: '800' },
  signupBtn: {
    flex: 1,
    height: 38,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: GOLD_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupText: { color: GOLD_DARK, fontSize: 13, fontWeight: '800' },

  // quick tiles
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
    backgroundColor: BG,
  },
  quickTile: {
    width: '46%',
    marginHorizontal: '2%',
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  quickLabel: { marginLeft: 10, fontSize: 14, fontWeight: '600', color: TEXT },

  // sections
  section: { backgroundColor: '#fff', marginTop: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GREY,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderColor: '#eeeeee',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, marginLeft: 14, fontSize: 15, color: TEXT },

  // logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 8,
    paddingVertical: 15,
  },
  logoutText: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: '#d32f2f' },

  version: { textAlign: 'center', color: GREY, fontSize: 12, marginTop: 16 },
});
















































// import React, { useContext } from 'react';
// import { Text, View, StatusBar, StyleSheet, Dimensions, Alert, } from 'react-native';
// import Header from '../components/Header';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { GlobleInfo } from '../context/GlobleInfoContext';

// const { width: W } = Dimensions.get('window');
// const CARD_W = W / 2;
// const BLUE = '#2874f0';
// const GOLD = '#F5B800';
// const BG = '#f1f3f6';
// const TEXT = '#212121';
// const GREY = '#878787';

// const AccountScreen = ({ navigation }) => {
//     const { logout } = useContext(GlobleInfo);

//     const logoutUser = () => {
//         Alert.alert('Logout', 'Are you sure you want to logout?', [
//             { text: 'Cancel', style: 'cancel' },
//             {
//                 text: 'Logout',
//                 style: 'destructive',
//                 onPress: async () => {
//                     try {
//                         await logout();
//                         navigation.replace('LoginPage');
//                     } catch (error) {
//                         console.error('Logout failed:', error);
//                     }
//                 },
//             }
//         ]);
//     };
    
    

//     return (
//         <SafeAreaView style={styles.safe} edges={['top']}>
//             <StatusBar backgroundColor={GOLD} barStyle="light-content" />
//             <Header
//                 onCart={() => navigation.navigate('Cart')}
//                 onSearch={(q) => navigation.navigate('ProductDisplay', { name: q })}
//             />

//             <View>
//                 <Text>AccountScreen</Text>
//                 <Text onPress={() => navigation.replace('LoginPage')}>SignUp/LogIn</Text>
//                 <Text onPress={logoutUser}>SignOut</Text>
//             </View>

//         </SafeAreaView>
//     )

// };

// const styles = StyleSheet.create({
//     safe: { flex: 1, backgroundColor: '#fff' },
//     center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
//     emptyText: { color: GREY, marginTop: 10, fontSize: 14 },

// })
// export default AccountScreen;
