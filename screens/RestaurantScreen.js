import { useState, useRef } from 'react';
import { Platform, StatusBar as RNStatusBar, Dimensions } from 'react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';

const SW = Dimensions.get('window').width;

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
};

const EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢',
};

const menu = [
  { categorie:'Entrées', plats:[
    { nom:'Chorba frik', prix:450, desc:'Soupe traditionnelle au blé vert' },
    { nom:'Bourek au thon', prix:380, desc:'Feuilles de brick croustillantes' },
  ]},
  { categorie:'Plats', plats:[
    { nom:'Couscous royal', prix:1800, desc:'Semoule, légumes, merguez et poulet' },
    { nom:'Mechoui d\'agneau', prix:2200, desc:'Agneau rôti, herbes et épices' },
    { nom:'Chakhchoukha', prix:1600, desc:'Pain maison, sauce tomate et poulet' },
  ]},
  { categorie:'Desserts', plats:[
    { nom:'Baklawa', prix:350, desc:'Pâtisserie orientale au miel' },
    { nom:'Zalabia', prix:280, desc:'Beignets au sirop de fleur d\'oranger' },
  ]},
];

export default function RestaurantScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || {
    name: 'Dar Zitoun',
    cuisine_type: 'algerien',
    address: 'Bab El Oued, Alger',
    quartier: 'Bab El Oued',
    description: 'Restaurant algerien traditionnel a Bab El Oued',
  };

  const [activeTab, setActiveTab] = useState('menu');
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = restaurant.photos && restaurant.photos.length > 0 ? restaurant.photos : null;

  const avis = [
    { nom:'Karim B.', note:5, date:'12 mai', txt:'Excellent! La chorba etait parfaite, service impeccable.' },
    { nom:'Amira M.', note:4, date:'8 mai', txt:'Tres bon couscous, ambiance chaleureuse. Je recommande.' },
    { nom:'Sofiane A.', note:5, date:'2 mai', txt:'Le meilleur restaurant algerien d\'Alger. A refaire!' },
  ];

  return (
    <SafeAreaView style={s.container}>
      {/* GALERIE HERO */}
      <View style={s.heroImg}>
        {photos ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={s.heroScroll}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
              setPhotoIndex(idx);
            }}
          >
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={s.heroPhoto} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <Text style={s.heroEmoji}>{EMOJI[restaurant.cuisine_type] || '🍽️'}</Text>
        )}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        {photos && photos.length > 1 && (
          <View style={s.dots}>
            {photos.map((_, i) => (
              <View key={i} style={[s.dot, i === photoIndex && s.dotOn]} />
            ))}
          </View>
        )}
        <View style={s.heroBadge}>
          <View style={s.heroDot} />
          <Text style={s.heroBadgeTxt}>Ouvert · ~20 min</Text>
        </View>
      </View>

      {/* INFO */}
      <View style={s.infoBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.restName}>{restaurant.name}</Text>
          <Text style={s.restMeta}>{restaurant.cuisine_type} · {restaurant.quartier}</Text>
          <Text style={s.restAddr}>📍 {restaurant.address}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={s.restNote}>⭐ {restaurant.avg_rating > 0 ? Number(restaurant.avg_rating).toFixed(1) : '—'}</Text>
          <Text style={s.restNoteCount}>{restaurant.review_count > 0 ? restaurant.review_count + ' avis' : 'Nouveau'}</Text>
        </View>
      </View>

      {/* DESCRIPTION */}
      {!!restaurant.description && (
        <View style={s.descBlock}>
          <Text style={s.descTxt}>{restaurant.description}</Text>
        </View>
      )}

      {/* STATS */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statVal}>~20 min</Text>
          <Text style={s.statLbl}>Attente</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statVal}>{restaurant.avg_ticket > 0 ? restaurant.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—'}</Text>
          <Text style={s.statLbl}>Prix moyen</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statVal}>{restaurant.capacity > 0 ? restaurant.capacity : '—'}</Text>
          <Text style={s.statLbl}>Couverts</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, activeTab==='menu' && s.tabOn]} onPress={() => setActiveTab('menu')}>
          <Text style={[s.tabTxt, activeTab==='menu' && s.tabTxtOn]}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab==='avis' && s.tabOn]} onPress={() => setActiveTab('avis')}>
          <Text style={[s.tabTxt, activeTab==='avis' && s.tabTxtOn]}>Avis</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab==='infos' && s.tabOn]} onPress={() => setActiveTab('infos')}>
          <Text style={[s.tabTxt, activeTab==='infos' && s.tabTxtOn]}>Infos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {activeTab === 'menu' && (
          <>
            {menu.map((cat, i) => (
              <View key={i}>
                <Text style={s.catLabel}>{cat.categorie.toUpperCase()}</Text>
                {cat.plats.map((plat, j) => (
                  <View key={j} style={s.platItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.platNom}>{plat.nom}</Text>
                      <Text style={s.platDesc}>{plat.desc}</Text>
                    </View>
                    <Text style={s.platPrix}>{plat.prix} DA</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {activeTab === 'avis' && (
          <>
            <View style={s.noteSummary}>
              <Text style={s.noteBig}>4.8</Text>
              <View>
                <Text style={s.noteStars}>⭐⭐⭐⭐⭐</Text>
                <Text style={s.noteCount}>124 avis</Text>
              </View>
            </View>
            {avis.map((a, i) => (
              <View key={i} style={s.avisItem}>
                <View style={s.avisTop}>
                  <View style={s.avisAvatar}><Text style={s.avisAvatarTxt}>{a.nom[0]}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.avisNom}>{a.nom}</Text>
                    <Text style={s.avisDate}>{a.date} · {'⭐'.repeat(a.note)}</Text>
                  </View>
                </View>
                <Text style={s.avisTxt}>{a.txt}</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === 'infos' && (
          <View style={s.infosCard}>
            {[
              { icon:'📍', label:'Adresse', val: restaurant.address },
              { icon:'🕐', label:'Horaires', val:'12h00 - 22h30 · Tous les jours' },
              { icon:'📞', label:'Telephone', val:'021 00 00 01' },
              { icon:'🌐', label:'Cuisine', val: restaurant.cuisine_type },
              { icon:'🅿️', label:'Parking', val:'Disponible à proximité' },
            ].map((item, i) => (
              <View key={i} style={[s.infoItem, i < 4 && s.infoBorder]}>
                <Text style={s.infoIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoLabel}>{item.label}</Text>
                  <Text style={s.infoVal}>{item.val}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOUTON RÉSERVER */}
      <View style={s.footer}>
        <TouchableOpacity style={s.reserveBtn} onPress={() => navigation.navigate('ReservationForm', { restaurant })}>
  <Text style={s.reserveBtnTxt}>RÉSERVER UNE TABLE</Text>
</TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  heroImg:        { height: 260, backgroundColor: '#1a2e1a', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  heroScroll:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroPhoto:      { width: SW, height: 260 },
  heroEmoji:      { fontSize: 72 },
  dots:           { position: 'absolute', bottom: 44, flexDirection: 'row', gap: 5 },
  dot:            { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn:          { backgroundColor: '#fff', width: 16 },
  backBtn:        { position: 'absolute', top: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 16, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(10,15,26,0.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  backBtnTxt:     { color: C.text, fontSize: 18 },
  heroBadge:      { position: 'absolute', bottom: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(10,15,26,0.85)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(61,153,112,0.3)' },
  heroDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  heroBadgeTxt:   { color: C.green, fontSize: 11 },
  infoBar:        { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  restName:       { color: C.text, fontSize: 22, fontWeight: '300', letterSpacing: 0.5, marginBottom: 4 },
  restMeta:       { color: C.accent, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  restAddr:       { color: C.dim, fontSize: 11 },
  restNote:       { color: C.accent, fontSize: 18, fontWeight: '300' },
  restNoteCount:  { color: C.dimmer, fontSize: 10 },
  descBlock:      { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  descTxt:        { color: C.dim, fontSize: 13, fontWeight: '300', lineHeight: 20 },
  statsRow:       { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  statItem:       { flex: 1, alignItems: 'center' },
  statVal:        { color: C.text, fontSize: 13, fontWeight: '400', marginBottom: 3 },
  statLbl:        { color: C.dimmer, fontSize: 10, letterSpacing: 1 },
  statDivider:    { width: 1, backgroundColor: C.border, marginVertical: 4 },
  tabs:           { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  tab:            { flex: 1, paddingBottom: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn:          { borderBottomColor: C.accent },
  tabTxt:         { color: C.dim, fontSize: 13, fontWeight: '300' },
  tabTxtOn:       { color: C.accent, fontWeight: '400' },
  catLabel:       { color: C.dimmer, fontSize: 10, letterSpacing: 4, paddingHorizontal: 20, marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  platItem:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  platNom:        { color: C.text, fontSize: 14, fontWeight: '300', marginBottom: 3 },
  platDesc:       { color: C.dim, fontSize: 11 },
  platPrix:       { color: C.accent, fontSize: 13, fontWeight: '400' },
  noteSummary:    { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  noteBig:        { color: C.accent, fontSize: 48, fontWeight: '300' },
  noteStars:      { fontSize: 16, marginBottom: 4 },
  noteCount:      { color: C.dim, fontSize: 12 },
  avisItem:       { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  avisTop:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avisAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  avisAvatarTxt:  { color: C.accent, fontSize: 14, fontWeight: '300' },
  avisNom:        { color: C.text, fontSize: 13, fontWeight: '300', marginBottom: 2 },
  avisDate:       { color: C.dim, fontSize: 11 },
  avisTxt:        { color: C.dim, fontSize: 13, fontWeight: '300', lineHeight: 20 },
  infosCard:      { margin: 20, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  infoItem:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  infoBorder:     { borderBottomWidth: 1, borderBottomColor: C.border },
  infoIcon:       { fontSize: 18, width: 28, textAlign: 'center' },
  infoLabel:      { color: C.dimmer, fontSize: 10, letterSpacing: 2, marginBottom: 2, textTransform: 'uppercase' },
  infoVal:        { color: C.text, fontSize: 13, fontWeight: '300' },
  footer:         { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  reserveBtn:     { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  reserveBtnTxt:  { color: C.bg, fontSize: 13, fontWeight: '500', letterSpacing: 2 },
});
