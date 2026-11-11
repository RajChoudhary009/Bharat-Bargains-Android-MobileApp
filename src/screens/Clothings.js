import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { fixColor } from '../utils/colors';
import { SERVER_API_URL } from '../server/server';
import Header from '../components/Header';
import ProductTile, { finalPriceOf } from '../components/ProductTile';
import { GlobleInfo } from '../context/GlobleInfoContext'; // fix path if your folder differs

const { width: W } = Dimensions.get('window');
const CARD_W = W / 2;
const BLUE = '#2874f0';
const GOLD = '#F5B800';
const BG = '#f1f3f6';
const TEXT = '#212121';
const GREY = '#878787';

const SORT_OPTIONS = [
  'Price: All item',
  'Price: High to Low',
  'Price: Low to High',
  'Newest First',
];




/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */
// const Footwears = ({ navigation, route }) => {
// web: useParams() -> RN: route.params

const Bags = ({ navigation, route }) => {
  const { Clothings_types } = route?.params || {};

  const ctx = useContext(GlobleInfo);
  const updateCounts = ctx?.updateCounts;

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
  const [sortOpen, setSortOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);

  /* ---------- fetch products ---------- */
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${SERVER_API_URL}/api/clothing`);
        if (!cancelled) setAllProducts(res.data?.data || []);
        // console.log('COLORS:', (res.data?.data || []).map(p => `${p.product_id}: ${p.color} | ${p.same_color_type}`));
      } catch (e) {
        console.error('Error fetching products:', e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- wishlist (localStorage -> AsyncStorage) ---------- */
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('wishlist');
        setWishlistItems(stored ? JSON.parse(stored) : []);
      } catch (e) {
        console.log('wishlist read error', e.message);
      }
    })();
  }, []);

  const toggleWishlist = useCallback(
    async (product) => {
      const exists = wishlistItems.some((i) => i.product_id === product.product_id);
      const updated = exists
        ? wishlistItems.filter((i) => i.product_id !== product.product_id)
        : [...wishlistItems, product];
      setWishlistItems(updated); // no page reload needed in RN
      try {
        await AsyncStorage.setItem('wishlist', JSON.stringify(updated));
        updateCounts && updateCounts();
      } catch (e) {
        console.log('wishlist save error', e.message);
      }
    },
    [wishlistItems, updateCounts]
  );

  /* ---------- colors grouped by same_color_type ---------- */
  const colorsByType = useMemo(() => {
    const groups = {};
    allProducts.forEach((p) => {
      if (!groups[p.same_color_type]) groups[p.same_color_type] = [];
      groups[p.same_color_type].push({
        productId: p.product_id,
        color: fixColor(p.color),
        // color: (p.color || '').trim().toLowerCase() || '#FFFFFF',
      });
    });
    return groups;
  }, [allProducts]);

  /* ---------- sorting (the web version never actually sorted) ---------- */
  const products = useMemo(() => {
    const list = [...allProducts];
    switch (sortOption) {
      case 'Price: High to Low':
        return list.sort((a, b) => finalPriceOf(b) - finalPriceOf(a));
      case 'Price: Low to High':
        return list.sort((a, b) => finalPriceOf(a) - finalPriceOf(b));
      case 'Newest First':
        return list.sort((a, b) => {
          if (a.created_at && b.created_at) return new Date(b.created_at) - new Date(a.created_at);
          return (Number(b.product_id) || 0) - (Number(a.product_id) || 0);
        });
      default:
        return list;
    }
  }, [allProducts, sortOption]);

  /* ---------- navigation ---------- */
  const openProduct = (p) =>
    navigation.navigate('ProductItem', { id: p.product_id, mainCategory: p.main_category });
  const openColor = (id) => navigation.navigate('ProductItem', { id });

  const title = [Clothings_types].filter(Boolean).join(' · ') || 'Clothings';

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color="#2874F0" style={styles.spinner} />
          <Text style={styles.loaderBrand}>Bharat Bargains</Text>
          <Text style={styles.loaderText}>Loading best deals for you...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={GOLD} barStyle="light-content" />
      <Header
        onCart={() => navigation.navigate('Cart')}
        onSearch={(q) => navigation.navigate('ProductDisplay', { name: q })}
      />

      {/* title + sort bar */}
      <View style={styles.titleBar}>
    
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle} numberOfLines={1}>
            {title} {!loading && <Text style={styles.count}>{products.length} items</Text>}
          </Text>

        </View>
      </View>

      <View style={styles.sortBar}>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortOpen(true)}>
          <Ionicons name="swap-vertical" size={18} color={BLUE} />
          <Text style={styles.sortLabel}>SORT BY</Text>
          <Text style={styles.sortValue} numberOfLines={1}>
            {sortOption}
          </Text>
          <Ionicons name="chevron-down" size={16} color={GREY} />
        </TouchableOpacity>
      </View>

      {/* product grid */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item, i) => `${item.product_id}-${i}`}
          style={{ backgroundColor: '#fff' }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="glasses-outline" size={48} color="#c2c2c2" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductTile
              product={item}
              colors={colorsByType[item.same_color_type] || []}
              isWished={wishlistItems.some((w) => w.product_id === item.product_id)}
              onToggleWish={toggleWishlist}
              onOpen={openProduct}
              onOpenColor={openColor}
            />
          )}
        />
      )}

      {/* sort bottom sheet */}
      <Modal visible={sortOpen} transparent animationType="slide" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSortOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>SORT BY</Text>
          {SORT_OPTIONS.map((opt) => {
            const active = opt === sortOption;
            return (
              <TouchableOpacity
                key={opt}
                style={styles.sheetRow}
                onPress={() => {
                  setSortOption(opt);
                  setSortOpen(false);
                }}
              >
                <Text style={[styles.sheetText, active && { color: BLUE, fontWeight: '700' }]}>{opt}</Text>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={active ? BLUE : '#bdbdbd'}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Bags;

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BLUE },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { color: GREY, marginTop: 10, fontSize: 14 },

  // title + sort bar
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pageTitle: { fontSize: 16, fontWeight: '700', color: TEXT, textTransform: 'capitalize' },
  count: { fontSize: 12, color: GREY, marginTop: 1 },
  sortBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  sortBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11 },
  sortLabel: { fontSize: 12, fontWeight: '700', color: BLUE, marginLeft: 6 },
  sortValue: { flex: 1, fontSize: 12, color: TEXT, marginLeft: 8 },

  // sort sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GREY,
    padding: 16,
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  sheetText: { fontSize: 15, color: TEXT },


  // Activity Indicater
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',   // beech me (vertical)
    alignItems: 'center',       // beech me (horizontal)
    backgroundColor: '#F1F3F6', // Flipkart ka light grey background
  },
  loaderCard: {
    backgroundColor: '#fff',
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  spinner: {
    transform: [{ scale: 1.6 }], // bada spinner, Android aur iOS dono pe
  },
  loaderBrand: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '800',
    color: '#2874F0',
    fontStyle: 'italic',
  },
  loaderText: {
    marginTop: 6,
    fontSize: 13,
    color: '#7A7A7A',
  },

});