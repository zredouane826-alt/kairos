import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

const C = { bg:'#0d1628', bg2:'#111827', bg3:'#1a2332', accent:'#c8975a', accent2:'#4a7fa5', text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568', green:'#3d9970', card:'#141e2e', border:'rgba(255,255,255,0.07)' };
const villes = ['Alger','Oran','Blida','Constantine'];
const situations = [ { icon:'🌙', label:'Diner tranquille' }, { icon:'👪', label:'En famille' }, { icon:'⚡', label:'Rapide' }, { icon:'🌿', label:'Terrasse' }, { icon:'💼', label:'Affaires' } ];
const restaurants = [
  { name:'Dar Zitoun', cuisine:'Algerien', quartier:'Bab El Oued', note:4.8, attente:'~15 min', emoji:'🥘', bg:'#1a2e1a' },
  { name:'La Marine', cuisine:'Mediterraneen', quartier:'Hydra', note:4.9, attente:'~25 min', emoji:'🐟', bg:'#1a1e2e' },
  { name:'Atlas Grill', cuisine:'Grillade', quartier:'Didouche', note:4.6, attente:'~10 min', emoji:'🍢', bg:'#2a1e0a' },
  { name:'Cafe Tamgout', cuisine:'Cafe', quartier:'Ben Aknoun', note:4.4, attente:'~5 min', emoji:'☕', bg:'#1a2332' },
  { name:'Vert Nature', cuisine:'Vegetarien', quartier:'Hussein Dey', note:4.7, attente:'~20 min', emoji:'🥗', bg:'#1a2e1a' },
];

export default function ExplorerScreen() {
  const [ville, setVille] = useState('Alger');
  const [activeSit, setActiveSit] = useState(null);
  const [search, setSearch] = useState('');
  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>découvrir</Text>
          <Text style={s.headerTitle}>Explorer</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.villeScroll}>
          {villes.map((v) => (
            <TouchableOpacity key={v} style={[s.villeChip, ville===v && s.villeChipOn]} onPress={() => setVille(v)}>
              <Text style={[s.villeTxt, ville===v && s.villeTxtOn]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={s.searchBar}>
        <Text style={{ color:C.dim, marginRight:8, fontSize:16 }}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Restaurant, cuisine, quartier..." placeholderTextColor={C.dimmer} value={search} onChangeText={setSearch} />
      </View>
      <View style={s.mapPlaceholder}>
        <Text style={s.mapEmoji}>🗺️</Text>
        <Text style={s.mapTxt}>Carte interactive · {ville}</Text>
        <Text style={s.mapSub}>{restaurants.length} restaurants</Text>
      </View>
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetCount}>{restaurants.length} restaurants · {ville}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sitScroll}>
          {situations.map((sit, i) => (
            <TouchableOpacity key={i} style={[s.sitChip, activeSit===i && s.sitChipOn]} onPress={() => setActiveSit(activeSit===i ? null : i)}>
              <Text style={s.sitIcon}>{sit.icon}</Text>
              <Text style={[s.sitTxt, activeSit===i && s.sitTxtOn]}>{sit.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView showsVerticalScrollIndicator={false}>
          {restaurants.map((r, i) => (
            <TouchableOpacity key={i} style={s.restItem}>
              <View style={[s.restThumb, { backgroundColor:r.bg }]}><Text style={{ fontSize:28 }}>{r.emoji}</Text></View>
              <View style={{ flex:1 }}>
                <Text style={s.restName}>{r.name}</Text>
                <Text style={s.restMeta}>{r.cuisine} · {r.quartier}</Text>
                <View style={s.restBadges}>
                  <View style={s.badgeGreen}><View style={s.dot}/><Text style={s.badgeGreenTxt}>{r.attente}</Text></View>
                </View>
              </View>
              <View style={{ alignItems:'flex-end', gap:4 }}>
                <Text style={s.restNote}>⭐ {r.note}</Text>
                <Text style={{ color:C.accent2, fontSize:18 }}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height:100 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:{ flex:1, backgroundColor:C.bg }, header:{ paddingHorizontal:24, paddingTop:56, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border }, headerSub:{ color:C.accent, fontSize:10, fontStyle:'italic', letterSpacing:3, marginBottom:2 }, headerTitle:{ color:C.text, fontSize:26, fontWeight:'300', letterSpacing:1, marginBottom:10 }, villeScroll:{ maxHeight:36 }, villeChip:{ paddingHorizontal:14, paddingVertical:6, borderRadius:100, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, marginRight:8 }, villeChipOn:{ backgroundColor:'rgba(200,151,90,0.12)', borderColor:C.accent }, villeTxt:{ color:C.dim, fontSize:12, fontWeight:'300' }, villeTxtOn:{ color:C.accent }, searchBar:{ flexDirection:'row', alignItems:'center', margin:16, backgroundColor:C.bg2, borderRadius:14, paddingHorizontal:14, paddingVertical:12, borderWidth:1, borderColor:C.border }, searchInput:{ flex:1, color:C.text, fontSize:13 }, mapPlaceholder:{ margin:16, height:180, backgroundColor:C.bg3, borderRadius:16, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:C.border }, mapEmoji:{ fontSize:40, marginBottom:8 }, mapTxt:{ color:C.dim, fontSize:14, fontWeight:'300', marginBottom:4 }, mapSub:{ color:C.dimmer, fontSize:11 }, sheet:{ flex:1, backgroundColor:C.bg2, borderTopLeftRadius:24, borderTopRightRadius:24, paddingTop:12, paddingHorizontal:20, borderWidth:1, borderColor:C.border }, sheetHandle:{ width:40, height:4, backgroundColor:C.border, borderRadius:2, alignSelf:'center', marginBottom:14 }, sheetCount:{ color:C.dimmer, fontSize:11, letterSpacing:2, marginBottom:12, textTransform:'uppercase' }, sitScroll:{ marginBottom:14 }, sitChip:{ height:40, flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8, borderRadius:100, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border, marginRight:8 }, sitChipOn:{ borderColor:C.accent, backgroundColor:'rgba(200,151,90,0.08)' }, sitIcon:{ fontSize:14 }, sitTxt:{ color:C.dim, fontSize:11, fontWeight:'300' }, sitTxtOn:{ color:C.accent }, restItem:{ flexDirection:'row', alignItems:'center', gap:14, paddingVertical:14, borderBottomWidth:1, borderBottomColor:C.border }, restThumb:{ width:56, height:56, borderRadius:14, alignItems:'center', justifyContent:'center' }, restName:{ color:C.text, fontSize:15, fontWeight:'300', marginBottom:3, letterSpacing:0.3 }, restMeta:{ color:C.dim, fontSize:11, marginBottom:6 }, restBadges:{ flexDirection:'row', gap:6 }, badgeGreen:{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(61,153,112,0.1)', borderRadius:100, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:'rgba(61,153,112,0.2)' }, dot:{ width:5, height:5, borderRadius:3, backgroundColor:C.green }, badgeGreenTxt:{ color:C.green, fontSize:10 }, restNote:{ color:C.accent, fontSize:12 },
});
