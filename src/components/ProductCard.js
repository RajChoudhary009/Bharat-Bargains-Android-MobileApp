import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { SERVER_API_URL } from '../server/server';
import { colors } from '../utils/colors';
import { money, discounted } from '../utils/format';

export default function ProductMiniCard({
  thumbnail, title, price, discountPercent, tag, subtitle, material, onPress, width = 170,
}) {
  return (
    <View style={[styles.card, { width }]}>
      <Pressable onPress={onPress}>
        {thumbnail ? (
          <Image
            source={{ uri: `${SERVER_API_URL}/${thumbnail}` }}
            style={styles.img}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.img, styles.noImg]}><Text style={styles.muted}>Image Not Available</Text></View>
        )}
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>{title || 'Unnamed Product'}</Text>
      <View style={styles.row}>
        <Text style={styles.strike}>{money(price)}</Text>
        <Text style={styles.off}> ({discountPercent}% OFF)</Text>
      </View>
      {!!tag && <Text style={styles.tag}>For {tag}</Text>}
      <Text style={styles.final}>{money(discounted(price, discountPercent))}/-</Text>
      {!!subtitle && <Text style={styles.muted} numberOfLines={2}>{subtitle}</Text>}
      <Text style={styles.muted}>Material: {material || 'fiber'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, backgroundColor: '#fff' },
  img: { width: '100%', height: 110 },
  noImg: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '600', marginTop: 6, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  strike: { textDecorationLine: 'line-through', color: colors.muted },
  off: { color: colors.success, fontSize: 12 },
  tag: { color: colors.accent, fontSize: 10, textTransform: 'uppercase' },
  final: { fontWeight: '700', fontSize: 16, marginVertical: 2, color: colors.text },
  muted: { color: colors.muted, fontSize: 12 },
});
