import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const GOLD = '#F5B800';        
const GOLD_DARK = '#C99700';  
const BLUE = '#2874f0';
const TEXT = '#212121';

/**
 * Flipkart-style header: blue bar, logo, cart icon and search box.
 *
 * Props:
 *  - onCart():           called when the cart icon is pressed
 *  - onSearch(query):    called when the user submits the search
 */
const Header = ({ onCart, onSearch }) => {
  const [q, setQ] = useState('');

  const submit = () => {
    const text = q.trim();
    if (text && onSearch) onSearch(text);
    Alert.alert('Search submitted', `You searched for: "${text}"`);
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.logo}>
          Bharat<Text style={styles.logoAccent}>Bargains</Text>
        </Text>
        <TouchableOpacity onPress={onCart} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="cart-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#717478" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search for products, brands and more"
          placeholderTextColor="#717478"
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={submit}
        />
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    // backgroundColor: BLUE,
    backgroundColor: GOLD, 
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  logoAccent: {
    color: '#ffe500',
    // color:'#ffe500',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: TEXT,
  },
});