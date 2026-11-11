import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, FlatList, Pressable, ActivityIndicator,
  Alert, Share, StyleSheet, Dimensions, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-native-toast-message';

import { GlobleInfo } from '../context/GlobleInfoContext';
import { SERVER_API_URL, SERVER_URL } from '../server/server';
import { colors } from '../utils/colors';
import { reviews } from '../data/reviews';
import { calcProductPrice, getProductDetailRows, formatValue, money } from '../utils/format';
import { getToken, getJSON, setJSON } from '../utils/storage';

import ProductCard from '../components/ProductCard';
import BargainModal from '../components/BargainModal';
import LensPowerModal from '../components/LensPowerModal';
import Header from '../components/Header';

const W = Dimensions.get('window').width;
const GOLD = '#F5B800';
const toNum = (v) => (v === '' || v == null ? null : parseFloat(v));

export default function ProductDetailsScreen({ route, navigation }) {
  // const { mainCategory, id } = route.params;
  const { id: product_id, mainCategory } = route.params;

  const { saveCheckoutData, updateCounts, getCart } = useContext(GlobleInfo);

  const [item, setItem] = useState({});
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [slide, setSlide] = useState(0);
  const [wished, setWished] = useState(false);
  const [mobileNum, setMobileNum] = useState('');
  const [address, setAddress] = useState(null);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showBargain, setShowBargain] = useState(false);
  const [showLens, setShowLens] = useState(false);
  const [bargainPrice, setBargainPrice] = useState(null);

  const productPrice = calcProductPrice(item, quantity);
  const rows = getProductDetailRows(item);
  const images = item?.images?.length ? item.images : [item?.thumbnail_url].filter(Boolean);

  // ---- load product ----
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${SERVER_API_URL}/api/product/${mainCategory}/${product_id}`)
      .then(({ data }) => {
        setItem(data.data || {});
        setSuggested(data.suggestedProducts || []);
      })
      .catch((e) => console.error('Product error:', e))
      .finally(() => setLoading(false));
  }, [mainCategory, product_id]);

  // ---- wishlist state ----
  useEffect(() => {
    getJSON('wishlist', []).then((list) => setWished(list.some((p) => p.product_id === item?.product_id)));
  }, [item?.product_id]);

  const toggleWishlist = async () => {
    const list = await getJSON('wishlist', []);
    const next = wished ? list.filter((p) => p.product_id !== item.product_id) : [...list, item];
    await setJSON('wishlist', next);
    setWished(!wished);
    updateCounts?.();
  };

  // ---- delivery address ----
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const num = jwtDecode(token).mobile_num;
        setMobileNum(num);
        const { data } = await axios.get(`${SERVER_API_URL}/getallUserinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const u = data.find((x) => String(x.mobile_num) === String(num));
        if (u) setAddress(`${u.city}, ${u.state}, ${u.pincode}`);
      } catch (e) {
        console.log('Address error:', e.message);
      }
    })();
  }, [product_id]);

  // ---- share (native sheet, no extra package) ----
  const share = () =>
    Share.share({ message: `${item?.product_name}\n${SERVER_URL}/product-item/${product_id}` });

  // ---- add to cart (lens = optional data from the lens popup) ----
  const addToCart = async (lens) => {
    try {
      const token = await getToken();
      
      if (!token) {
        Alert.alert('Please login first');
        navigation.replace('LoginPage');
        return false;
      }
      const power = {
        selectLansType: lens?.lensType || null,
        selectedType: lens?.selectedLens?.type || null,
        leftLens: lens?.leftLens || null,
        rightLens: lens?.rightLens || null,
        axis: toNum(lens?.axis),
        add: toNum(lens?.add),
        selectedLensOrProducrPrice: (Number(lens?.selectedLens?.price) || 0) + productPrice,
      };
      const productDetails = {
        mobile_number: mobileNum,
        product_id,
        main_category: mainCategory,
        productQuntity: quantity,
        image: item?.thumbnail_url,
      };
      const form = new FormData();
      form.append('power', JSON.stringify(power));
      form.append('productDetails', JSON.stringify(productDetails));
      if (lens?.prescription) form.append('prescription', lens.prescription);

      const res = await axios.post(`${SERVER_API_URL}/api/addCart`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      if (res.status === 200 || res.status === 201) {
        await getCart?.();
        Toast.show({ type: 'success', text1: 'Added to cart' });
        return true;
      }
    } catch (e) {
      console.error('Add cart error:', e.response?.data || e.message);
      Toast.show({ type: 'error', text1: 'Could not add to cart' });
    }
    return false;
  };

  const buyNow = async () => {
    if (!(await getToken())) return navigation.replace('Login');
    saveCheckoutData({
      power: { selectedLensOrProducrPrice: bargainPrice ?? productPrice },
      product: {
        mobile_number: mobileNum,
        selectedColor: { frameColor: item?.color, lensColor: item?.color },
        product_id,
        main_category: mainCategory,
        productQuntity: quantity,
      },
    });
    navigation.navigate('CheckOutPage');
  };

  const openProduct = (cat, id) => navigation.push('ProductItem', { category: cat, product_id: id });

  if (loading) {
    return (
      <View style={s.loaderContainer}>
        <View style={s.loaderCard}>
          <ActivityIndicator size="large" color="#2874F0" style={s.spinner} />
          <Text style={s.loaderBrand}>Bharat Bargains</Text>
          <Text style={s.loaderText}>Loading best deals for you...</Text>
        </View>
      </View>
    );
  }

  const pct = Number(item?.discount_percent || 0);

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>

      <StatusBar backgroundColor={GOLD} barStyle="light-content" />
      <Header
        onCart={() => navigation.navigate('Cart')}
        onSearch={(q) => navigation.navigate('ProductDisplay', { name: q })}
      />

      <ScrollView>
        {/* image carousel */}
        <View style={s.white}>
          <View style={s.white}>
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p, i) => p + i}
              onMomentumScrollEnd={(e) =>
                setSlide(
                  Math.round(
                    e.nativeEvent.contentOffset.x / Dimensions.get('window').width
                  )
                )
              }
              renderItem={({ item: p }) => (
                <Image
                  source={{ uri: `${SERVER_API_URL}/${p}` }}
                  style={{
                    width: Dimensions.get('window').width,
                    height: 350,
                  }}
                  resizeMode="contain"
                />
              )}
            />
          </View>
          <Pressable style={s.heart} onPress={toggleWishlist} hitSlop={8}>
            <Ionicons name={wished ? 'heart' : 'heart-outline'} size={24} color={wished ? colors.danger : colors.muted} />
          </Pressable>
          <View style={s.dots}>
            {images.map((_, i) => <View key={i} style={[s.dot, i === slide && s.dotOn]} />)}
          </View>
        </View>

        {/* title + rating + price */}
        <View style={[s.white, s.pad, { marginTop: 8 }]}>
          <Text style={s.title}>{item?.product_name}</Text>
          <Text style={s.muted}>{item?.product_type}</Text>

          <View style={s.ratingRow}>
            <View style={s.badge}>
              <Text style={s.badgeTxt}>4.4</Text>
              <Ionicons name="star" size={11} color="#fff" />
            </View>
            <Text style={s.muted}>45 Ratings</Text>
          </View>

          <View style={s.priceRow}>
            {pct > 0 && <Text style={s.pct}>↓{pct}%</Text>}
            {pct > 0 && <Text style={s.mrp}>{money(item?.price)}</Text>}
            <Text style={s.price}>{money(bargainPrice ?? productPrice)}</Text>
          </View>
          <Text style={s.green}>Free Delivery · In Stock</Text>

          <View style={s.qtyRow}>
            <Text style={s.bold}>Quantity</Text>
            <View style={s.stepper}>
              <Pressable style={s.stepBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}><Text style={s.stepTxt}>−</Text></Pressable>
              <Text style={s.qty}>{quantity}</Text>
              <Pressable style={s.stepBtn} onPress={() => setQuantity((q) => Math.min(6, q + 1))}><Text style={s.stepTxt}>+</Text></Pressable>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Pressable style={s.outlineBtn} onPress={() => setShowBargain(true)}>
              <Text style={s.outlineTxt}>Bargain</Text>
            </Pressable>
            {!!item?.power && (
              <Pressable style={s.outlineBtn} onPress={async () => (await getToken() ? setShowLens(true) : navigation.replace('Login'))}>
                <Text style={s.outlineTxt}>Add power</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* delivery */}
        {!!address && (
          <View style={[s.white, s.pad, s.rowBetween, { marginTop: 8 }]}>
            <Ionicons name="location-outline" size={18} color={colors.text} />
            <Text style={{ flex: 1, marginLeft: 8, color: colors.text }} numberOfLines={1}>Deliver to {address}</Text>
          </View>
        )}

        {/* details */}
        <View style={[s.white, s.pad, { marginTop: 8 }]}>
          <Text style={s.h}>Product details</Text>
          {(showAllDetails ? rows : rows.slice(0, 4)).map(([key, label, fmt]) => (
            <View key={key} style={s.detailRow}>
              <Text style={s.detailLabel}>{label}</Text>
              <Text style={s.detailVal}>{formatValue(item[key], fmt)}</Text>
            </View>
          ))}
          {rows.length > 4 && (
            <Pressable onPress={() => setShowAllDetails((v) => !v)}>
              <Text style={s.link}>{showAllDetails ? 'Show less' : 'See all details'}</Text>
            </Pressable>
          )}
        </View>

        {/* suggested */}
        {suggested.length > 0 && (
          <View style={[s.white, s.pad, { marginTop: 8 }]}>
            <Text style={s.h}>You may also like</Text>
            <FlatList
              horizontal
              data={suggested}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => String(p.product_id)}
              ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
              renderItem={({ item: p }) => (
                <ProductCard
                  thumbnail={p.thumbnail_url}
                  title={p.product_title}
                  price={p.price}
                  discountPercent={p.discount_percent}
                  tag={p.sub_category}
                  subtitle={p.product_name}
                  material={p.material_type}
                  onPress={() => openProduct(p.main_category, p.product_id)}
                />
              )}
            />
          </View>
        )}

        {/* reviews */}
        <View style={[s.white, s.pad, { marginTop: 8, marginBottom: 8 }]}>
          <Text style={s.h}>Ratings & reviews</Text>
          {(showAllReviews ? reviews : reviews.slice(0, 3)).map((r) => (
            <View key={r.id} style={s.review}>
              <View style={s.badge}><Text style={s.badgeTxt}>{r.rating}</Text><Ionicons name="star" size={11} color="#fff" /></View>
              <Text style={{ color: colors.text, marginTop: 4 }}>{r.comment}</Text>
              <Text style={s.muted}>{r.user} · {r.date}</Text>
            </View>
          ))}
          {reviews.length > 3 && (
            <Pressable onPress={() => setShowAllReviews((v) => !v)}>
              <Text style={s.link}>{showAllReviews ? 'Show less' : `All ${reviews.length} reviews`}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* sticky bottom bar */}
      <View style={s.bottom}>
        <Pressable style={s.cartBtn} onPress={() => addToCart()}>
          <Text style={s.cartTxt}>Add to cart</Text>
        </Pressable>
        <Pressable style={s.buyBtn} onPress={buyNow}>
          <Text style={s.buyTxt}>Buy now</Text>
        </Pressable>
      </View>

      <BargainModal
        visible={showBargain}
        onClose={() => setShowBargain(false)}
        productId={product_id}
        category={mainCategory}
        onAccepted={setBargainPrice}
      />
      <LensPowerModal
        visible={showLens}
        onClose={() => setShowLens(false)}
        productPrice={productPrice}
        onSubmit={addToCart}
      />
      <Toast />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 12 },
  topTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
  white: { backgroundColor: '#fff' },
  pad: { padding: 14 },
  // slide: { width: W, height: W * 1 },
  slide: {
    width: Dimensions.get('window').width,
    height: 300,
  },
  heart: { position: 'absolute', top: 12, right: 12, backgroundColor: '#fff', borderRadius: 20, padding: 8, elevation: 3 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c2c2c2' },
  dotOn: { backgroundColor: colors.primary, width: 14 },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  bold: { fontWeight: '700', color: colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', backgroundColor: colors.success, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  pct: { color: colors.success, fontSize: 16, fontWeight: '700' },
  mrp: { color: colors.muted, fontSize: 16, textDecorationLine: 'line-through' },
  price: { color: colors.text, fontSize: 26, fontWeight: '700' },
  green: { color: colors.success, fontWeight: '600', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 4 },
  stepBtn: { paddingHorizontal: 14, paddingVertical: 4 },
  stepTxt: { fontSize: 18, fontWeight: '700', color: colors.primary },
  qty: { minWidth: 26, textAlign: 'center', fontWeight: '600' },
  outlineBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8 },
  outlineTxt: { color: colors.primary, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center' },
  h: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  detailRow: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderColor: colors.surface },
  detailLabel: { width: '40%', color: colors.muted },
  detailVal: { flex: 1, color: colors.text },
  link: { color: colors.primary, fontWeight: '700', marginTop: 10 },
  review: { paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.surface },
  bottom: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  cartBtn: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  cartTxt: { fontWeight: '700', fontSize: 15, color: colors.text },
  buyBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: colors.buy },
  buyTxt: { fontWeight: '700', fontSize: 15, color: '#fff' },

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