// src/tabs/CartScreen.js
import React, { useContext, useCallback, useState } from 'react';
import {
    Text,
    View,
    Image,
    FlatList,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

import Header from '../components/Header';
import { GlobleInfo } from '../context/GlobleInfoContext';
import { SERVER_API_URL } from '../server/server';

const GOLD = '#F5B800';
const GOLD_DARK = '#C99700';
const BG = '#f1f3f6';
const TEXT = '#212121';
const GREY = '#878787';
const GREEN = '#388e3c';

const CartScreen = ({ navigation }) => {
    const { cartlistItems, getCart, isLoggedIn, saveCheckoutData } = useContext(GlobleInfo);
    const [refreshing, setRefreshing] = useState(false);

    // Load the cart every time this tab is opened
    useFocusEffect(
        useCallback(() => {
            getCart();
        }, [])
    );

    // Pull down to refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await getCart();
        setRefreshing(false);
    };

    // Total money of all products in the cart
    const totalAmount = cartlistItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    // Open the product page
    const openProduct = (item) => {
        navigation.navigate('ProductItem', {
            id: item.product_id,
            mainCategory: item.main_category,
        });
    };

    // Remove one product from the cart
    const removeFromCart = async (cartId) => {
        try {
            const token = await AsyncStorage.getItem('user_token');
            // TODO: change this URL to your real "remove from cart" API
            await axios.delete(`${SERVER_API_URL}/api/Cart/${cartId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await getCart(); // load the cart again
        } catch (error) {
            console.log('Remove cart error:', error.response?.data || error.message);
            Alert.alert('Error', 'Could not remove this product');
        }
    };

    // Ask before removing
    const confirmRemove = (cartId) => {
        Alert.alert('Remove item', 'Do you want to remove this item from your cart?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(cartId) },
        ]);
    };

    // Buy only this one product
    const buyNow = (item) => {
        const price = (
            (item.product_price - (item.product_price * item.discount) / 100) *
            item.quantity
        ).toFixed(0);

        saveCheckoutData({
            power: { selectedLensOrProducrPrice: Number(price) },
            product: {
                product_id: item.product_id,
                main_category: item.main_category,
                productQuntity: item.quantity,
            },
        });
        navigation.navigate('CheckOutPage');
    };

    // One product card
    const renderItem = ({ item }) => (
        <View style={styles.card}>

            <View style={styles.cardTop}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => openProduct(item)}>
                    <Image
                        source={{ uri: `${SERVER_API_URL}/${item?.Image}` }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                <View style={styles.details}>
                    <Text style={styles.name} numberOfLines={1}>
                        {item.description}
                    </Text>
                    <Text style={styles.title} numberOfLines={2}>
                        {item.product_name || item.main_category}
                    </Text>
                    <Text style={styles.qty}>Quantity: {item.quantity}</Text>
                    <Text style={styles.price}>₹{Number(item.price || 0).toFixed(0)}</Text>
                    <Text style={styles.free}>Free Delivery</Text>
                </View>
            </View>

            {/* Buttons at the bottom of the card */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => confirmRemove(item.cart_id)}>
                    <Ionicons name="trash-outline" size={18} color={TEXT} />
                    <Text style={styles.actionText}>Remove</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.actionBtn} onPress={() => buyNow(item)}>
                    <Ionicons name="flash-outline" size={18} color={GOLD_DARK} />
                    <Text style={[styles.actionText, { color: GOLD_DARK }]}>Buy this now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Price details box at the end of the list
    const renderFooter = () => (
        <View style={styles.priceBox}>
            <Text style={styles.priceTitle}>PRICE DETAILS</Text>

            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Price ({cartlistItems.length} items)</Text>
                <Text style={styles.priceValue}>₹{totalAmount.toFixed(0)}</Text>
            </View>

            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Charges</Text>
                <Text style={[styles.priceValue, { color: GREEN }]}>FREE</Text>
            </View>

            <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{totalAmount.toFixed(0)}</Text>
            </View>
        </View>
    );

    // Screen shown when the cart is empty or user is not logged in
    const renderEmpty = () => (
        <View style={styles.emptyBox}>
            <Ionicons name="cart-outline" size={80} color="#c2c2c2" />
            <Text style={styles.emptyTitle}>
                {isLoggedIn ? 'Your cart is empty' : 'Missing Cart items?'}
            </Text>
            <Text style={styles.emptySub}>
                {isLoggedIn ? 'Add items to it now' : 'Login to see the items you added previously'}
            </Text>

            <TouchableOpacity
                style={styles.emptyBtn}
                activeOpacity={0.85}
                onPress={() => (isLoggedIn ? navigation.navigate('HomeTab') : navigation.navigate('LoginPage'))}
            >
                <Text style={styles.emptyBtnText}>{isLoggedIn ? 'Shop now' : 'Login'}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar backgroundColor={GOLD} barStyle="dark-content" />
            <Header
                onCart={() => { }}
                onSearch={(q) => navigation.navigate('Eyewear', { eyewear_types: q })}
            />

            <FlatList
                style={styles.list}
                data={cartlistItems}
                keyExtractor={(item, index) => `${item.cart_id ?? item.product_id}-${index}`}
                renderItem={renderItem}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={cartlistItems.length > 0 ? renderFooter : null}
                refreshing={refreshing}
                onRefresh={onRefresh}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
            />
        </SafeAreaView>
    );
};

export default CartScreen;

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: GOLD },
    list: { flex: 1, backgroundColor: BG },

    // product card
    card: { backgroundColor: '#fff', marginTop: 8 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', padding: 12 },
    image: { width: 100, height: 100 },
    details: { flex: 1, marginLeft: 25 },


    name: { fontSize: 15, fontWeight: '700', color: TEXT },
    title: { fontSize: 13, color: GREY, marginTop: 2 },
    qty: { fontSize: 12, color: TEXT, marginTop: 6 },
    price: { fontSize: 18, fontWeight: '700', color: TEXT, marginTop: 6 },
    free: { fontSize: 12, fontWeight: '600', color: GREEN, marginTop: 2 },

    // buttons under the card
    actions: {
        flexDirection: 'row',
        borderTopWidth: 0.5,
        borderColor: '#e0e0e0',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
    },
    actionText: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: TEXT },
    divider: { width: 0.5, backgroundColor: '#e0e0e0' },

    // price details
    priceBox: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
    priceTitle: { fontSize: 13, fontWeight: '700', color: GREY, marginBottom: 12 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    priceLabel: { fontSize: 14, color: TEXT },
    priceValue: { fontSize: 14, color: TEXT },
    totalRow: {
        borderTopWidth: 0.5,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        paddingTop: 12,
        marginBottom: 0,
    },
    totalLabel: { fontSize: 16, fontWeight: '700', color: TEXT },
    totalValue: { fontSize: 16, fontWeight: '700', color: TEXT },

    // empty cart
    emptyBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginTop: 8,
        padding: 24,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT, marginTop: 12 },
    emptySub: { fontSize: 13, color: GREY, marginTop: 6, textAlign: 'center' },
    emptyBtn: {
        marginTop: 20,
        backgroundColor: GOLD,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 4,
    },
    emptyBtnText: { fontSize: 14, fontWeight: '800', color: TEXT },
});