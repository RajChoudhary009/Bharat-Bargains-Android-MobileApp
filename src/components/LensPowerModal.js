import React, { useState } from 'react';
import { View, Text, Image, Pressable, Modal, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { lensData, lensTypes } from '../data/lensData';
import { colors } from '../utils/colors';
import { money } from '../utils/format';

const SPH = Array.from({ length: 81 }, (_, i) => (-10 + i * 0.25).toFixed(2));
const CYL = Array.from({ length: 81 }, (_, i) => (-6 + i * 0.25).toFixed(2));

const Pick = ({ value, values, onChange }) => (
  <View style={s.pick}>
    <Picker selectedValue={value} onValueChange={onChange} style={{ height: 50 }}>
      {values.map((v) => <Picker.Item key={v} label={v} value={v} />)}
    </Picker>
  </View>
);

// Self-contained 3-step popup: lens type -> lens add-on -> power + prescription.
// onSubmit(lensData) must return a Promise<boolean>.
export default function LensPowerModal({ visible, onClose, productPrice, onSubmit }) {
  const [step, setStep] = useState('type');
  const [lensType, setLensType] = useState('');
  const [selectedLens, setSelectedLens] = useState({ type: '', price: 0 });
  const [left, setLeft] = useState({ SPH: '-0.00', CYL: '-0.25' });
  const [right, setRight] = useState({ SPH: '-0.00', CYL: '-0.25' });
  const [axis, setAxis] = useState('');
  const [add, setAdd] = useState('');
  const [prescription, setPrescription] = useState(null);

  const close = () => { setStep('type'); onClose(); };

  const pickImage = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
    const a = res.assets?.[0];
    if (a) setPrescription({ uri: a.uri, name: a.fileName || `prescription-${Date.now()}.jpg`, type: a.type || 'image/jpeg' });
  };

  const submit = async () => {
    const ok = await onSubmit({ lensType, selectedLens, leftLens: left, rightLens: right, axis, add, prescription });
    if (ok) close();
  };

  const Row = ({ title, desc, onPress }) => (
    <Pressable style={s.row} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={s.bold}>{title}</Text>
        <Text style={s.muted}>{desc}</Text>
      </View>
      <Text style={{ color: colors.primary, fontWeight: '700' }}>›</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={s.wrap}>
        <View style={s.header}>
          <Text style={s.h}>Select lens</Text>
          <Pressable onPress={close}><Text style={s.bold}>✕</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {step === 'type' && lensTypes.map((t) => (
            <Row key={t.key} title={t.title} desc={t.desc} onPress={() => { setLensType(t.key); setStep('lens'); }} />
          ))}

          {step === 'lens' && lensData[lensType]?.map((l) => (
            <Row key={l.type} title={l.type} desc={money(l.price)}
              onPress={() => { setSelectedLens({ type: l.type, price: l.price }); setStep('power'); }} />
          ))}

          {step === 'power' && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[['Left lens', left, setLeft], ['Right lens', right, setRight]].map(([label, val, set]) => (
                  <View key={label} style={{ flex: 1 }}>
                    <Text style={s.bold}>{label}</Text>
                    <Text style={s.muted}>SPH</Text>
                    <Pick value={val.SPH} values={SPH} onChange={(v) => set((p) => ({ ...p, SPH: v }))} />
                    <Text style={s.muted}>CYL</Text>
                    <Pick value={val.CYL} values={CYL} onChange={(v) => set((p) => ({ ...p, CYL: v }))} />
                  </View>
                ))}
              </View>
              <Text style={s.muted}>AXIS</Text>
              <TextInput style={s.input} keyboardType="numeric" value={axis} onChangeText={setAxis} placeholder="Enter axis" />
              <Text style={s.muted}>ADD</Text>
              <TextInput style={s.input} keyboardType="numeric" value={add} onChangeText={setAdd} placeholder="Enter add" />

              <Pressable style={s.upload} onPress={pickImage}>
                {prescription
                  ? <Image source={{ uri: prescription.uri }} style={{ width: '100%', height: 160 }} resizeMode="contain" />
                  : <Text style={s.muted}>📷  Tap to upload prescription image</Text>}
              </Pressable>

              <Text style={s.muted}>
                Frame {money(productPrice)} + lens {money(selectedLens.price)} = {money(productPrice + Number(selectedLens.price || 0))}
              </Text>
              <Pressable style={s.submit} onPress={submit}><Text style={s.submitTxt}>Add to cart</Text></Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  h: { fontSize: 18, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: colors.border },
  bold: { fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  pick: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 10 },
  upload: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: 4, padding: 16, alignItems: 'center' },
  submit: { backgroundColor: colors.buy, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  submitTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
