import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { SERVER_API_URL } from '../server/server'; // path apne folder ke hisaab se check karo

const { width: W } = Dimensions.get('window');
const CARD_W = W / 2;
const TEXT = '#212121';
const GREY = '#878787';

// Screen ki sorting me bhi ye chahiye, isliye export kiya hai
export const finalPriceOf = (p) => {
    const price = Number(p.price) || 0;
    const disc = Number(p.discount_percent) || 0;
    return price - (price * disc) / 100;
};

const ProductTile = ({ product, colors = [], isWished, onToggleWish, onOpen, onOpenColor }) => {
    const outOfStock = Number(product.count_in_stock) === 0;
    const price = Number(product.price) || 0;
    const discount = Number(product.discount_percent) || 0;
    const desc = (product.description || '').slice(0, 50);

    return (
        <View style={styles.tile}>
            {/* wishlist heart */}
            <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => onToggleWish(product)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons
                    name={isWished ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isWished ? '#ff3b5c' : '#9e9e9e'}
                />
            </TouchableOpacity>

            {/* image */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => onOpen(product)}>
                <Image
                    source={{ uri: `${SERVER_API_URL}/${product.thumbnail_url}` }}
                    style={[styles.tileImg, outOfStock && { opacity: 0.45 }]}
                    resizeMode="contain"
                />
                {outOfStock && (
                    <View style={styles.oosBadge}>
                        <Text style={styles.oosBadgeText}>OUT OF STOCK</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* info */}
            <View style={styles.info}>
                <Text style={styles.brand} numberOfLines={1}>
                    {product.product_name}
                </Text>
                <Text style={styles.desc} numberOfLines={2}>
                    {desc}..
                </Text>

                <View style={styles.priceRow}>
                    <Text style={styles.finalPrice}>₹{finalPriceOf(product).toFixed(0)}</Text>
                    {discount > 0 && (
                        <>
                            <Text style={styles.mrp}>₹{price}</Text>
                            <Text style={styles.off}>{discount}% off</Text>
                        </>
                    )}
                </View>

                {!!product.gender && <Text style={styles.forGender}>For {product.gender}</Text>}

                <Text style={[styles.stock, { color: outOfStock ? '#d32f2f' : '#388e3c' }]}>
                    {outOfStock ? 'Out of stock' : 'In stock'}
                </Text>

                {/* color swatches */}
                <View style={styles.colorRow}>
                    {colors.length > 0 ? (
                        colors.map((c) => (
                            <TouchableOpacity
                                key={c.productId}
                                onPress={() => onOpenColor(c.productId)}
                                style={[styles.colorDot, { backgroundColor: c.color }]}
                            />
                        ))
                    ) : (
                        <Text style={styles.noColor}>No colors</Text>
                    )}
                </View>

                {!!product.material_type && (
                    <Text style={styles.material} numberOfLines={1}>
                        Material: {product.material_type}
                    </Text>
                )}
            </View>
        </View>
    );
};

export default React.memo(ProductTile);

const styles = StyleSheet.create({
    // tile
    // tile: {
    //   width: CARD_W,
    //   backgroundColor: '#fff',
    //   borderRightWidth: 0.5,
    //   borderBottomWidth: 0.5,
    //   borderColor: '#e0e0e0',
    //   paddingBottom: 10,
    // },
    tile: {
        width: CARD_W,
        backgroundColor: '#fff',
        borderRightWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: '#e0e0e0',
        paddingHorizontal: 5,
        paddingTop: 10,
        paddingBottom: 12,
    },
    heartBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
    },
    tileImg: { width: '100%', height: 150, marginTop: 10 },
    oosBadge: {
        position: 'absolute',
        alignSelf: 'center',
        top: 70,
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 3,
    },
    oosBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    info: { paddingHorizontal: 10, paddingTop: 8 },
    brand: { fontSize: 13, fontWeight: '700', color: TEXT },
    desc: { fontSize: 11, color: GREY, marginTop: 2, minHeight: 28 },
    priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
    finalPrice: { fontSize: 15, fontWeight: '700', color: TEXT },
    mrp: { fontSize: 12, color: GREY, textDecorationLine: 'line-through', marginLeft: 6 },
    off: { fontSize: 12, fontWeight: '700', color: '#388e3c', marginLeft: 6 },
    forGender: { fontSize: 10, fontWeight: '700', color: '#e8a617', textTransform: 'uppercase', marginTop: 3 },
    stock: { fontSize: 11, fontWeight: '700', marginTop: 3 },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 8 },
    colorDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#bdbdbd',
        marginRight: 6,
        marginBottom: 4,
    },
    noColor: { fontSize: 11, color: GREY },
    material: { fontSize: 11, color: GREY, marginTop: 4 },
});