import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Header from '../components/Header'; // <- your separate Header file (fix path if needed)

import { SERVER_API_URL } from '../server/server';

const IMG = {
  aviator: require('../Assets/images/goggles/aviator-vector.webp'),
  catsEye: require('../Assets/images/goggles/cats-eye.webp'),
  rectangle: require('../Assets/images/goggles/rectangle-vector.webp'),
  round: require('../Assets/images/goggles/round-vector.webp'),
  square: require('../Assets/images/goggles/square-vector.webp'),
  wayfarer: require('../Assets/images/goggles/wayfarer-vector.webp'),
  pawerGlass: require('../Assets/images/power_glass.png'),
  computerGlassMen: require('../Assets/images/computer-glass-men.webp'),
  sunglasses: require('../Assets/images/sunglasses-image.webp'),
  prescription: require('../Assets/images/prescription-glasses.webp'),
  zeroPawer: require('../Assets/images/zero-power-glasses.webp'),
  mangal1: require('../Assets/images/zero-power-glasses.webp'),
  mangal2: require('../Assets/images/zero-power-glasses.webp'),
  mangal3: require('../Assets/images/zero-power-glasses.webp'),
  thewedding: require('../Assets/images/zero-power-glasses.webp'),
  thewedding2: require('../Assets/images/zero-power-glasses.webp'),
  feet: require('../Assets/images/zero-power-glasses.webp'),
  verShoe: require('../Assets/images/zero-power-glasses.webp'),
  purse: require('../Assets/images/zero-power-glasses.webp'),
  purse2: require('../Assets/images/zero-power-glasses.webp'),
  // (kept exactly as in your web code: the names are swapped there)
  bridal101: require('../Assets/images/zero-power-glasses.webp'),
  bridal102: require('../Assets/images/zero-power-glasses.webp'),
};

const { width: W } = Dimensions.get('window');
const BLUE = '#2874f0';
const GOLD = '#F5B800';  
const BG = '#f1f3f6';
const TEXT = '#212121';

const SLIDER_ORDER = ['eyewear', 'jewellery', 'purse-nd-bags', 'footwear', 'clothings'];

const uploadUri = (file) => (file ? { uri: `${SERVER_API_URL}/uploads/${file}` } : null);
const rootUri = (path) => ({ uri: `${SERVER_API_URL}/${path}` });

/* ------------------------------------------------------------------ */
/* Small reusable pieces                                               */
/* ------------------------------------------------------------------ */
const SectionTitle = ({ children, style }) => (
  <View style={[styles.sectionTitleWrap, style]}>
    <Text style={styles.sectionTitle}>{children}</Text>
    <View style={styles.hr} />
  </View>
);

// Brand heading + wide banner (Helius / Lykos / Blinkers / EyePoppin blocks)
const BrandBanner = ({ headings, image, onPress }) => (
  <View style={styles.card}>
    {headings.map((h, i) => (
      <Text key={i} style={styles.brandName}>
        {h.brand_name}
      </Text>
    ))}
    <View style={styles.hr} />
    {image ? (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <Image source={uploadUri(image)} style={styles.wideBanner} resizeMode="cover" />
      </TouchableOpacity>
    ) : null}
  </View>
);

// Two image cards with text (the "Eyeglasses-container" blocks)
const DualCards = ({ title, items, onPress }) => (
  <View style={styles.card}>
    <SectionTitle>{title}</SectionTitle>
    <View style={styles.dualRow}>
      {items.map((it, i) => (
        <TouchableOpacity key={i} style={styles.dualItem} activeOpacity={0.9} onPress={onPress}>
          <Image source={it.img} style={styles.dualImg} resizeMode="cover" />
          <Text style={styles.dualTag}>{it.tag}</Text>
          <Text style={styles.dualTitle} numberOfLines={2}>
            {it.title}
          </Text>
          <Text style={styles.dualCta}>{it.cta} ›</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// Full-width cards with background image + arrow (the "eyeglasses-grid" blocks)
const OverlayCards = ({ headings, items, onPressItem }) => (
  <View style={styles.card}>
    {headings.map((h, i) => (
      <Text key={i} style={styles.brandName}>
        {h.brand_name}
      </Text>
    ))}
    <View style={styles.hr} />
    {items.map((it, i) => (
      <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => onPressItem(it)}>
        <ImageBackground
          source={it.img}
          style={styles.overlayCard}
          imageStyle={{ borderRadius: 10 }}
          resizeMode="cover"
        >
          <View style={styles.overlayShade} />
          <View style={{ flex: 1 }}>
            <Text style={styles.overlayTitle}>{it.title}</Text>
            <Text style={styles.overlayDesc}>{it.desc}</Text>
          </View>
          <Text style={styles.overlayArrow}>›</Text>
        </ImageBackground>
      </TouchableOpacity>
    ))}
  </View>
);

/* ------------------------------------------------------------------ */
/* Product card used in "New Arrival"                                  */
/* ------------------------------------------------------------------ */
const ProductCard = ({ item, onPress }) => {
  const isEyewear = item.category === 'products';
  const title = (isEyewear ? item.product_title : item.product_name) || '';
  const price = Number(isEyewear ? item.product_price : item.price) || 0;
  const discount = Number(isEyewear ? item.discount : item.discount_percent) || 0;
  const image = isEyewear ? item.product_thumnail_img : item.thumbnail_url;
  const gender = isEyewear ? item.gender : item.sub_category;
  const highlight = (isEyewear ? item.highlights : item.description) || '';
  const finalPrice = price - (price * discount) / 100;

  return (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.9} onPress={onPress}>
      <Image source={rootUri(image)} style={styles.productImg} resizeMode="contain" />
      <Text style={styles.productTitle} numberOfLines={1}>
        {title.slice(0, 20)}
      </Text>
      <Text style={styles.productDesc} numberOfLines={2}>
        {highlight.slice(0, 35)}...
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.finalPrice}>₹{finalPrice.toFixed(0)}</Text>
        {discount > 0 && <Text style={styles.originalPrice}>₹{price}</Text>}
      </View>
      {discount > 0 && <Text style={styles.discountText}>{discount}% off</Text>}
      {!!gender && <Text style={styles.forGender}>For {gender}</Text>}
      <Text style={styles.taxText}>Inclusive of all taxes</Text>
    </TouchableOpacity>
  );
};


// screen names
const CATEGORY_SCREENS = {
  'eyewear': 'Eyewear',
  'footwear': 'Footwear',
  'clothings': 'Clothings',
  'jewellery': 'Jewellery',
  'purse-nd-bags': 'Bags',
};


// Main screen                                                     
const HomeScreen = ({ navigation }) => {
  const [bannerData, setBannerData] = useState([]);
  const [brandHeading, setBrandHeading] = useState([]);
  const [newArrivel, setNewArrivel] = useState([]);
  const [slidersData, setSlidersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // console.log(newArrivel.map(p => p.product_id));


  // Make sure these screen names exist in your navigator.
  const goProductDisplay = (name) => {
    const key = name?.trim().toLowerCase();
    const screen = CATEGORY_SCREENS[key];

    // Alert.alert(name)
    if (screen) {
      navigation.navigate(screen);
    } else {
      Alert.alert('Coming soon', `${name} not available !`);
    }
  };
  const goProduct = (id, mainCategory) => navigation.navigate('ProductDetail', { id, mainCategory });



  /* ---------- data fetching ---------- */
  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const res = await axios.get(`${SERVER_API_URL}/api/carousel/all`);
        setBannerData(res.data || []);
      } catch (e) {
        console.error('Error fetching banners:', e.message);
      }
    };
    const fetchBrandHeading = async () => {
      try {
        const res = await axios.get(`${SERVER_API_URL}/brand`);
        setBrandHeading(res.data?.result || []);
      } catch (e) {
        console.log(e.message);
      }
    };
    fetchBannerData();
    fetchBrandHeading();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchAllData = async (retries = 3, delay = 1000) => {
      try {
        const sliderRes = await axios.get(`${SERVER_API_URL}/api/slider`);
        if (!cancelled && Array.isArray(sliderRes.data?.data)) {
          setSlidersData(sliderRes.data.data);
        }
        const newRes = await axios.get(`${SERVER_API_URL}/api/allCetegory/mix`);
        if (!cancelled) {
          setNewArrivel(newRes.data?.data || []);
          setIsLoading(false);
        }
      } catch (e) {
        if (retries > 0 && !cancelled) {
          setTimeout(() => fetchAllData(retries - 1, delay), delay);
        } else if (!cancelled) {
          console.error('Data fetch failed after retries', e.message);
          setIsLoading(false);
        }
      }
    };
    fetchAllData();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- banner lookup by section/place/exact_place ---------- */
  const findBanner = (section, place, exact) =>
    bannerData.find((b) => b.section === section && b.place === place && b.exact_place === exact)
      ?.image_url || null;

  const textBanner = findBanner('section_2', 'Group_A', 'left');
  const heliusGlasses = findBanner('section_1', 'Group_B', 'center_poster');
  const lykosEyewear = findBanner('section_3', 'Group_B', 'center_poster');
  const stayAheadInStyleBanner = findBanner('section_2', 'Group_C', 'center_poster');
  const Blinkers = findBanner('section_3', 'Group_C', 'center_poster');
  const EyePoppin = findBanner('section_4', 'Group_C', 'center_poster');

  const headingsFor = (section) => brandHeading.filter((h) => h.section === section);



  /* ---------- derived slider lists ---------- */
  const sortedSliders = [...slidersData].sort((a, b) =>
    SLIDER_ORDER.indexOf(a.slider_link?.toLowerCase()) -
    SLIDER_ORDER.indexOf(b.slider_link?.toLowerCase())
  );
  const topMini = sortedSliders.filter((s) => s.slider_name === 'top_mini_image');
  const banners = slidersData.filter((s) => s.slider_name === 'banner');
  const productImages = slidersData.filter((s) => s.slider_name === 'product_image');



  /* ---------- banner carousel (autoplay) ---------- */
  const ITEM_W = W * 0.92;
  const GAP = 10;
  const bannerRef = useRef(null);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % banners.length;
        bannerRef.current?.scrollToOffset({ offset: next * (ITEM_W + GAP), animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [banners.length, ITEM_W]);

  const onBannerScrollEnd = useCallback((e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (ITEM_W + GAP));
    setBannerIndex(i);
  },
    [ITEM_W]
  );


  const openSlider = (item, matchKey) => {
    const link = item.slider_link?.toLowerCase() || '';
    if (matchKey && link.includes(matchKey)) goProductDisplay(link);
    else goProductDisplay(link);
  };


  /* ---------- static data for repeated blocks ---------- */
  const shapes = [
    { label: 'Aviator', key: 'Aviator', img: IMG.aviator },
    { label: 'Cats Eye', key: 'Cats Eye', img: IMG.catsEye },
    { label: 'Rectangle', key: 'Rectangle', img: IMG.rectangle },
    { label: 'Round', key: 'Round', img: IMG.round },
    { label: 'Square', key: 'Square', img: IMG.square },
    { label: 'Oval', key: 'Wayfarer', img: IMG.wayfarer },
  ];


  /* ---------------------------- render ---------------------------- */
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={GOLD} barStyle="light-content" />
      <Header
        onCart={() => navigation.navigate('Cart')}
        onSearch={(q) => navigation.navigate('Eyewear', { name: q })}
      />

      <ScrollView style={{ backgroundColor: BG }} showsVerticalScrollIndicator={false}>

        {/* ---------- Top category row (top_mini_image) ---------- */}
        <View style={styles.catRowWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0 }}>
            {!isLoading &&
              topMini.map((data, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.catItem}
                  activeOpacity={0.8}
                  onPress={() => goProductDisplay(data.slider_link)}
                >
                  <View style={styles.catImgWrap}>
                    <Image source={uploadUri(data.slider_url)} style={styles.catImg} resizeMode="contain" />
                  </View>
                  <Text style={styles.catLabel} numberOfLines={1}>
                    {data.slider_link}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* ---------- Banner carousel ---------- */}
        <View style={styles.bannerWrap}>
          {isLoading ? (
            <ActivityIndicator color="#2874F0" style={{ margin: 40 }} />
          ) : (
            <>
              <FlatList
                ref={bannerRef}
                data={banners}
                horizontal
                keyExtractor={(_, i) => String(i)}
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_W + GAP}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: (W - ITEM_W) / 2 - GAP / 2 }}
                onMomentumScrollEnd={onBannerScrollEnd}
                getItemLayout={(_, i) => ({ length: ITEM_W + GAP, offset: (ITEM_W + GAP) * i, index: i })}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{ width: ITEM_W, marginHorizontal: GAP / 2 }}
                    onPress={() => openSlider(item, 'sunglasses')}
                  >
                    <Image source={uploadUri(item.slider_url)} style={styles.bannerImg} resizeMode="cover" />
                  </TouchableOpacity>
                )}
              />
              <View style={styles.dots}>
                {banners.map((_, i) => (
                  <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* ---------- product_image grid ---------- */}
        <View style={styles.grid}>
          {!isLoading &&
            productImages.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.gridCard}
                activeOpacity={0.9}
                onPress={() => openSlider(item, 'eyewear')}
              >
                <Image source={uploadUri(item.slider_url)} style={styles.gridImg} resizeMode="cover" />
                <Text style={styles.gridTitle} numberOfLines={1}>
                  {item.slider_link}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* ---------- New Arrival ---------- */}
        <View style={styles.newArrivalWrap}>
          <Text style={styles.newArrivalTitle}>New Arrival</Text>
          {isLoading ? (
            <ActivityIndicator color="#2874F0" style={{ margin: 30 }} />
          ) : newArrivel.length > 0 ? (
            <FlatList
              data={newArrivel.slice(0, 6)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, i) => `${item.category ?? item.main_category ?? 'p'}-${item.product_id}-${i}`}
              contentContainerStyle={{ paddingHorizontal: 12 }}
              renderItem={({ item }) => (
                <ProductCard
                  item={item}
                  onPress={() => goProduct(item.product_id, item.main_category)}
                />
              )}
            />
          ) : (
            <Text style={styles.emptyText}>No products found</Text>
          )}
        </View>

        {/* ---------- Glasses shape categories ---------- */}
        <View style={styles.card}>
          {textBanner ? (
            <Image source={uploadUri(textBanner)} style={styles.textBanner} resizeMode="cover" />
          ) : null}
          <View style={styles.shapesGrid}>
            {shapes.map((s) => (
              <TouchableOpacity key={s.key} style={styles.shapeItem} onPress={() => goProductDisplay(s.key)}>
                <Image source={s.img} style={styles.shapeIcon} resizeMode="contain" />
                <Text style={styles.shapeLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ---------- Group B: Helius (section_1) ---------- */}
        <BrandBanner
          headings={headingsFor('section_1')}
          image={heliusGlasses}
          onPress={() => goProductDisplay('jewellery')}
        />

        {/* ---------- Wedding Jewelry ---------- */}
        <DualCards
          title="Wedding Jewelry"
          onPress={() => goProductDisplay('jewellery')}
          items={[
            { img: IMG.thewedding, tag: 'Wedding Jewelry', title: 'Bridal Gold & Diamond Collection', cta: 'Explore More Details' },
            { img: IMG.thewedding2, tag: 'Fashion Jewelry', title: 'Stylish & Minimal Pieces', cta: 'Discover Now' },
          ]}
        />

        {/* ---------- Group D (section_2): eyeglasses cards ---------- */}
        <OverlayCards
          headings={headingsFor('section_2')}
          onPressItem={(it) => goProductDisplay(it.route)}
          items={[
            { img: IMG.computerGlassMen, title: 'Computer Glasses', desc: 'Protect Your Eyes - Blue Light Filtering', route: 'Computer Glass Men' },
            { img: IMG.sunglasses, title: 'Sunglasses', desc: 'Stay Stylish - 100% UV Protection', route: 'Computer Glass Men' },
            { img: IMG.prescription, title: 'Prescription', desc: 'Perfect Clarity - Tailored to Your Needs', route: 'Computer Glass Men' },
            { img: IMG.zeroPawer, title: 'Zero Power Glasses', desc: 'Style without Prescription', route: 'Computer Glass Men' },
          ]}
        />

        {/* ---------- Group E: Lykos (section_3) ---------- */}
        <BrandBanner
          headings={headingsFor('section_3')}
          image={lykosEyewear}
          onPress={() => goProductDisplay('footwear')}
        />

        {/* ---------- Footwear ---------- */}
        <DualCards
          title="Footwear Collection"
          onPress={() => goProductDisplay('footwear')}
          items={[
            { img: IMG.verShoe, tag: 'Shoes Collection', title: 'Stylish & Comfortable Footwear', cta: 'More Details' },
            { img: IMG.feet, tag: 'Sports Shoes', title: 'Lightweight & Performance Ready', cta: 'Shop Now' },
          ]}
        />

        {/* ---------- Group F (section_4): gold chains ---------- */}
        <OverlayCards
          headings={headingsFor('section_4')}
          onPressItem={() => goProductDisplay('jewellery')}
          items={[
            { img: IMG.mangal1, title: "Women's Gold Chain Collection", desc: 'Elegant Gold Chains Designed for Every Occasion' },
            { img: IMG.mangal2, title: 'Ladies Gold Chain', desc: 'Beautiful & Elegant Chains to Enhance Your Style' },
            { img: IMG.mangal3, title: "Premium Women's Gold Chains", desc: 'Graceful Designs Crafted for Modern Women' },
          ]}
        />

        {/* ---------- Group G (section_5): purses ---------- */}
        <BrandBanner
          headings={headingsFor('section_5')}
          image={stayAheadInStyleBanner}
          onPress={() => goProductDisplay('purse-nd-bags')}
        />
        <DualCards
          title="Carry Your Style"
          onPress={() => goProductDisplay('purse-nd-bags')}
          items={[
            { img: IMG.purse, tag: 'Luxury Purses', title: 'Elegant Designer Collection', cta: 'Explore Now' },
            { img: IMG.purse2, tag: 'Everyday Handbags', title: 'Perfect Blend of Style & Comfort', cta: 'Shop Now' },
          ]}
        />

        {/* ---------- Group H (section_6): Blinkers / Crocs ---------- */}
        <BrandBanner
          headings={headingsFor('section_6')}
          image={Blinkers}
          onPress={() => goProductDisplay('jewellery')}
        />
        <DualCards
          title="Fresh, Funky & Fashionable"
          onPress={() => goProductDisplay('jewellery')}
          items={[
            { img: IMG.bridal101, tag: 'Everyday Comfort', title: 'Trendy Crocs Styles', cta: 'Shop Now' },
            { img: IMG.bridal102, tag: 'Comfort Redefined', title: 'Exclusive Crocs Range', cta: 'Discover More' },
          ]}
        />

        {/* ---------- Group I (section_7): EyePoppin ---------- */}
        <BrandBanner
          headings={headingsFor('section_7')}
          image={EyePoppin}
          onPress={() => goProduct(45)}
        />
        <DualCards
          title="Sunglass"
          onPress={() => goProductDisplay('Sunglass Black FullRim Rectangle')}
          items={[
            { img: IMG.pawerGlass, tag: 'Sunglass Glasses', title: 'Black Full Rim Rectangle', cta: 'More Details' },
            { img: IMG.pawerGlass, tag: 'Sunglass Glasses', title: 'Black Full Rim Rectangle', cta: 'More Details' },
          ]}
        />

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BLUE },

  // category row (5 tiles spread evenly, image fits fully inside)
  catRowWrap: { backgroundColor: '#fff', paddingTop: 12, paddingBottom: 10, marginBottom: 8 },
  catItem: { width: W / 5, alignItems: 'center' },
  catImgWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#eef4ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  catImg: { width: '100%', height: '100%' },
  catLabel: { marginTop: 6, fontSize: 11.5, fontWeight: '600', color: TEXT, textTransform: 'capitalize' },

  // banner carousel
  bannerWrap: { backgroundColor: '#fff', paddingVertical: 12, marginBottom: 8 },
  bannerImg: { width: '100%', height: 170, borderRadius: 10, backgroundColor: BG },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c2c2c2', marginHorizontal: 3 },
  dotActive: { width: 16, backgroundColor: BLUE },

  // product_image grid (Flipkart style tiles)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    paddingVertical: 8,
    marginBottom: 8,
  },
  gridCard: {
    width: (W - 16 - 8) / 2,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  gridImg: { width: '100%', height: 120, backgroundColor: BG },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
    textTransform: 'capitalize',
    textAlign: 'center',
    paddingVertical: 8,
  },

  // new arrival
  newArrivalWrap: { backgroundColor: '#fff', paddingVertical: 14, marginBottom: 8 },
  newArrivalTitle: { color: TEXT, fontSize: 18, fontWeight: '800', marginLeft: 12, marginBottom: 10 },
  emptyText: { color: '#878787', textAlign: 'center', margin: 20 },
  productCard: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    padding: 10,
    marginRight: 10,
  },
  productImg: { width: '100%', height: 110, marginBottom: 8 },
  productTitle: { fontSize: 13, fontWeight: '700', color: TEXT },
  productDesc: { fontSize: 11, color: '#878787', marginTop: 2, minHeight: 28 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  finalPrice: { fontSize: 15, fontWeight: '700', color: TEXT },
  originalPrice: { fontSize: 12, color: '#878787', textDecorationLine: 'line-through', marginLeft: 6 },
  discountText: { fontSize: 12, fontWeight: '700', color: '#388e3c', marginTop: 2 },
  forGender: { fontSize: 11, color: '#00a5ad', marginTop: 2 },
  taxText: { fontSize: 10, color: '#878787', marginTop: 4 },

  // generic card
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8 },
  sectionTitleWrap: { marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: TEXT },
  hr: { height: 3, width: 40, borderRadius: 2, backgroundColor: BLUE, marginTop: 6, marginBottom: 12 },
  brandName: { fontSize: 18, fontWeight: '800', color: TEXT },

  // shapes
  textBanner: { width: '100%', height: 140, borderRadius: 8, marginBottom: 12 },
  shapesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  shapeItem: { width: '33.33%', alignItems: 'center', marginBottom: 14 },
  shapeIcon: { width: 80, height: 40 },
  shapeLabel: { marginTop: 6, fontSize: 12, fontWeight: '600', color: TEXT },

  // wide banner
  wideBanner: { width: '100%', height: 180, borderRadius: 8, backgroundColor: BG },

  // dual cards
  dualRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dualItem: {
    width: (W - 24 - 10) / 2,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  dualImg: { width: '100%', height: 150, backgroundColor: BG },
  dualTag: { fontSize: 11, color: '#878787', marginTop: 8, paddingHorizontal: 8 },
  dualTitle: { fontSize: 14, fontWeight: '700', color: TEXT, marginTop: 2, paddingHorizontal: 8 },
  dualCta: { fontSize: 12, fontWeight: '700', color: BLUE, marginTop: 4, paddingHorizontal: 8 },

  // overlay cards
  overlayCard: {
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: BG,
  },
  overlayShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 10 },
  overlayTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  overlayDesc: { color: '#f1f1f1', fontSize: 12, marginTop: 4 },
  overlayArrow: { color: '#fff', fontSize: 34, fontWeight: '300' },
});