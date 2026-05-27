import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, ActivityIndicator, Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.35)',
};

const SH = Dimensions.get('window').height;

const CITIES = [
  { id:'alger',       label:'Alger',       region:{ latitude:36.7538, longitude:3.0588,   latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'oran',        label:'Oran',        region:{ latitude:35.6969, longitude:-0.6331,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'constantine', label:'Constantine', region:{ latitude:36.3650, longitude:6.6147,   latitudeDelta:0.13, longitudeDelta:0.13 } },
];

const SITUATIONS = [
  { icon:'🌙', label:'Diner tranquille' },
  { icon:'👪', label:'En famille' },
  { icon:'⚡', label:'Rapide' },
  { icon:'🌿', label:'Terrasse' },
  { icon:'💼', label:'Affaires' },
];

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

const QUARTIER_COORDS = {
  // Alger
  'hydra':            { latitude:36.7539, longitude:3.0427 },
  'bab el oued':      { latitude:36.7900, longitude:3.0573 },
  'el biar':          { latitude:36.7614, longitude:3.0364 },
  'centre':           { latitude:36.7625, longitude:3.0521 },
  'ben aknoun':       { latitude:36.7611, longitude:3.0157 },
  'bir mourad raïs':  { latitude:36.7381, longitude:3.0521 },
  'chéraga':          { latitude:36.7669, longitude:2.9605 },
  'dely ibrahim':     { latitude:36.7608, longitude:2.9843 },
  'sidi fredj':       { latitude:36.7760, longitude:2.9102 },
  'pins maritimes':   { latitude:36.7522, longitude:3.0980 },
  'casbah':           { latitude:36.7866, longitude:3.0601 },
  // Oran
  'centre-ville':     { latitude:35.6973, longitude:-0.6342 },
  'les falaises':     { latitude:35.7273, longitude:-0.6462 },
  'bir el djir':      { latitude:35.6889, longitude:-0.5882 },
  'la corniche':      { latitude:35.7384, longitude:-0.6718 },
  'sidi el houari':   { latitude:35.7094, longitude:-0.6531 },
  'eckmuhl':          { latitude:35.6923, longitude:-0.6291 },
  'médina jedida':    { latitude:35.7065, longitude:-0.6422 },
  'le plateau':       { latitude:35.7012, longitude:-0.6178 },
  'aïn turk':         { latitude:35.7582, longitude:-0.7685 },
  // Constantine
  'sidi m\'cid':      { latitude:36.3800, longitude:6.6100 },
  'médina':           { latitude:36.3700, longitude:6.6050 },
  'mansourah':        { latitude:36.3500, longitude:6.5950 },
  'faubourg lamy':    { latitude:36.3620, longitude:6.6200 },
  'el kantara':       { latitude:36.3450, longitude:6.6000 },
  'daksi':            { latitude:36.3750, longitude:6.6400 },
  'zouaghi':          { latitude:36.3300, longitude:6.5800 },
};

function getCoord(r, cityDefault) {
  const key = (r.quartier || '').toLowerCase();
  const base = QUARTIER_COORDS[key] || cityDefault;
  const seed = typeof r.id === 'string'
    ? r.id.charCodeAt(0) + r.id.charCodeAt(r.id.length - 1)
    : (r.id || 0);
  const dx = (((seed * 7919) % 1000) / 1000 - 0.5) * 0.006;
  const dy = (((seed * 6271) % 1000) / 1000 - 0.5) * 0.006;
  return { latitude: base.latitude + dx, longitude: base.longitude + dy };
}

export default function ExplorerScreen({ navigation }) {
  const mapRef = useRef(null);
  const [city, setCity]               = useState('alger');
  const [search, setSearch]           = useState('');
  const [activeSit, setActiveSit]     = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [selected, setSelected]       = useState(null);

  const cityData  = CITIES.find(c => c.id === city) || CITIES[0];
  const cityDefault = { latitude: cityData.region.latitude, longitude: cityData.region.longitude };

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    supabase
      .from('restaurants')
      .select('id, name, cuisine_type, address, quartier, avg_rating, avg_ticket')
      .eq('city', city)
      .eq('status', 'active')
      .then(({ data }) => {
        setRestaurants(data ?? []);
        setLoading(false);
      });
  }, [city]);

  const changeCity = (c) => {
    setCity(c);
    const r = CITIES.find(x => x.id === c)?.region;
    if (r) mapRef.current?.animateToRegion(r, 400);
  };

  const handleMarker = (r) => {
    setSelected(prev => prev?.id === r.id ? null : r);
    mapRef.current?.animateToRegion(
      { ...getCoord(r, cityDefault), latitudeDelta: 0.03, longitudeDelta: 0.03 },
      350,
    );
  };

  const filtered = restaurants.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.name || '').toLowerCase().includes(q) || (r.quartier || '').toLowerCase().includes(q);
  });

  return (
    <View style={s.root}>

      {/* ── Carte ── */}
      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={cityData.region}
        showsUserLocation
        showsCompass={false}
        toolbarEnabled={false}
      >
        {filtered.map(r => {
          const coord = getCoord(r, cityDefault);
          const isSelected = selected?.id === r.id;
          return (
            <Marker
              key={String(r.id)}
              coordinate={coord}
              tracksViewChanges={false}
              onPress={() => handleMarker(r)}
            >
              <View style={[s.pin, isSelected && s.pinActive]}>
                <Text style={[s.pinEmoji, isSelected && s.pinEmojiLg]}>
                  {CUISINE_EMOJI[r.cuisine_type] || '🍽️'}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── Header overlay ── */}
      <SafeAreaView style={s.overlay} pointerEvents="box-none">
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerLogo}>MIDA</Text>
            <Text style={s.headerSub}>Explorer</Text>
          </View>
          <View style={s.countBadge}>
            <View style={s.countDot} />
            <Text style={s.countTxt}>
              {loading ? '…' : filtered.length + ' restaurants'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Fiche restaurant sélectionné ── */}
      {selected && (
        <View style={s.selCard}>
          <TouchableOpacity
            style={s.selInner}
            onPress={() => navigation.navigate('Restaurant', { restaurant: selected })}
          >
            <View style={s.selThumb}>
              <Text style={s.selEmoji}>{CUISINE_EMOJI[selected.cuisine_type] || '🍽️'}</Text>
            </View>
            <View style={s.selInfo}>
              <Text style={s.selTag}>{(selected.cuisine_type || '').toUpperCase()}</Text>
              <Text style={s.selName} numberOfLines={1}>{selected.name}</Text>
              <Text style={s.selAddr} numberOfLines={1}>📍 {selected.quartier || selected.address || ''}</Text>
              {selected.avg_rating > 0 && (
                <Text style={s.selRating}>★ {Number(selected.avg_rating).toFixed(1)}</Text>
              )}
            </View>
            <View style={s.selArrow}><Text style={s.selArrowTxt}>›</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={s.closeBtn} onPress={() => setSelected(null)}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Feuille basse ── */}
      <View style={s.sheet}>
        <View style={s.sheetHandle} />

        {/* City chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cityRow} contentContainerStyle={s.cityContent}>
          {CITIES.map(c => (
            <TouchableOpacity key={c.id} style={[s.cityChip, city === c.id && s.cityChipOn]} onPress={() => changeCity(c.id)}>
              <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Restaurant, quartier…"
            placeholderTextColor={C.dimmer}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: C.dimmer, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Situation chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sitRow} contentContainerStyle={s.sitContent}>
          {SITUATIONS.map((sit, i) => (
            <TouchableOpacity key={i} style={[s.sitChip, activeSit === i && s.sitChipOn]} onPress={() => setActiveSit(activeSit === i ? null : i)}>
              <Text style={s.sitIcon}>{sit.icon}</Text>
              <Text style={[s.sitTxt, activeSit === i && s.sitTxtOn]}>{sit.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste */}
        {loading ? (
          <View style={s.empty}><ActivityIndicator color={C.accent} /></View>
        ) : filtered.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyTxt}>Aucun restaurant trouvé</Text></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.map(r => (
              <TouchableOpacity
                key={String(r.id)}
                style={[s.item, selected?.id === r.id && s.itemActive]}
                onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
              >
                <View style={s.itemThumb}>
                  <Text style={s.itemEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
                </View>
                <View style={s.itemBody}>
                  <Text style={s.itemName} numberOfLines={1}>{r.name}</Text>
                  <Text style={s.itemMeta}>{r.quartier || ''}</Text>
                </View>
                <View style={s.itemRight}>
                  {r.avg_rating > 0 && <Text style={s.itemRating}>★ {Number(r.avg_rating).toFixed(1)}</Text>}
                  {r.avg_ticket > 0 && <Text style={s.itemPrice}>{r.avg_ticket.toLocaleString('fr-FR')} DA</Text>}
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const MAP_H = SH * 0.44;
const SHEET_H = SH * 0.52;

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  map:          { height: MAP_H },

  /* Markers */
  pin:          { width:36, height:36, borderRadius:18, backgroundColor:'rgba(13,22,40,0.9)', borderWidth:2, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  pinActive:    { borderColor:C.accent, borderWidth:2.5, backgroundColor:C.bg3, width:44, height:44, borderRadius:22 },
  pinEmoji:     { fontSize:17 },
  pinEmojiLg:   { fontSize:21 },

  /* Header overlay */
  overlay:      { position:'absolute', top:0, left:0, right:0 },
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', margin:14, marginTop:10, backgroundColor:'rgba(13,22,40,0.88)', borderRadius:16, paddingHorizontal:16, paddingVertical:11, borderWidth:1, borderColor:C.border },
  headerLeft:   { gap:2 },
  headerLogo:   { color:C.accent, fontSize:14, fontWeight:'700', letterSpacing:5 },
  headerSub:    { color:C.dim, fontSize:10 },
  countBadge:   { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(200,151,90,0.12)', borderRadius:100, paddingHorizontal:12, paddingVertical:5, borderWidth:1, borderColor:C.borderAccent },
  countDot:     { width:6, height:6, borderRadius:3, backgroundColor:C.green },
  countTxt:     { color:C.accent, fontSize:11, fontWeight:'500' },

  /* Selected card */
  selCard:      { position:'absolute', bottom: SHEET_H + 12, left:14, right:14, flexDirection:'row', alignItems:'center', gap:8 },
  selInner:     { flex:1, flexDirection:'row', alignItems:'center', backgroundColor:C.bg2, borderRadius:16, borderWidth:1, borderColor:C.borderAccent, padding:12, gap:10 },
  selThumb:     { width:44, height:44, borderRadius:12, backgroundColor:C.bg3, alignItems:'center', justifyContent:'center' },
  selEmoji:     { fontSize:22 },
  selInfo:      { flex:1, gap:2 },
  selTag:       { color:C.accent, fontSize:8, letterSpacing:2.5 },
  selName:      { color:C.text, fontSize:14, fontWeight:'400' },
  selAddr:      { color:C.dim, fontSize:11 },
  selRating:    { color:C.accent, fontSize:11, fontWeight:'500' },
  selArrow:     { width:30, height:30, borderRadius:15, backgroundColor:C.accent, alignItems:'center', justifyContent:'center' },
  selArrowTxt:  { color:'#0d1628', fontSize:18, fontWeight:'700', marginTop:-1 },
  closeBtn:     { width:38, height:38, borderRadius:19, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  closeTxt:     { color:C.dim, fontSize:13 },

  /* Sheet */
  sheet:        { height: SHEET_H, backgroundColor:C.bg2, borderTopLeftRadius:22, borderTopRightRadius:22, borderWidth:1, borderColor:C.border, paddingTop:10 },
  sheetHandle:  { width:40, height:4, backgroundColor:C.border, borderRadius:2, alignSelf:'center', marginBottom:12 },
  cityRow:      { maxHeight:38 },
  cityContent:  { paddingHorizontal:16, flexDirection:'row', gap:8 },
  cityChip:     { paddingHorizontal:16, paddingVertical:6, borderRadius:100, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border },
  cityChipOn:   { backgroundColor:C.accent, borderColor:C.accent },
  cityTxt:      { color:C.dim, fontSize:12 },
  cityTxtOn:    { color:'#0d1628', fontWeight:'600' },
  searchBar:    { flexDirection:'row', alignItems:'center', margin:12, marginBottom:8, backgroundColor:C.bg3, borderRadius:12, paddingHorizontal:12, paddingVertical:10, borderWidth:1, borderColor:C.border },
  searchIcon:   { fontSize:14, marginRight:8 },
  searchInput:  { flex:1, color:C.text, fontSize:13 },
  sitRow:       { maxHeight:38, marginBottom:8 },
  sitContent:   { paddingHorizontal:16, flexDirection:'row', gap:8 },
  sitChip:      { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:7, borderRadius:100, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border },
  sitChipOn:    { borderColor:C.accent, backgroundColor:'rgba(200,151,90,0.08)' },
  sitIcon:      { fontSize:13 },
  sitTxt:       { color:C.dim, fontSize:11 },
  sitTxtOn:     { color:C.accent },
  item:         { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:C.border },
  itemActive:   { backgroundColor:'rgba(200,151,90,0.06)' },
  itemThumb:    { width:44, height:44, borderRadius:12, backgroundColor:C.bg3, alignItems:'center', justifyContent:'center' },
  itemEmoji:    { fontSize:22 },
  itemBody:     { flex:1, gap:3 },
  itemName:     { color:C.text, fontSize:14, fontWeight:'300' },
  itemMeta:     { color:C.dim, fontSize:11 },
  itemRight:    { alignItems:'flex-end', gap:3 },
  itemRating:   { color:C.accent, fontSize:12, fontWeight:'500' },
  itemPrice:    { color:C.dimmer, fontSize:10 },
  empty:        { flex:1, alignItems:'center', justifyContent:'center', paddingVertical:30 },
  emptyTxt:     { color:C.dimmer, fontSize:13 },
});
