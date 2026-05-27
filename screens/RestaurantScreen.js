import { useState, useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar, Dimensions } from 'react-native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator,
} from 'react-native';
import { supabase } from '../supabase';

const SW = Dimensions.get('window').width;

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.25)',
};

const EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷',
};

const MENUS = {
  algerien: [
    { categorie:'Entrées', plats:[
      { nom:'Chorba frik',     prix:450,  desc:'Soupe traditionnelle au blé vert' },
      { nom:'Bourek au thon',  prix:380,  desc:'Feuilles de brick croustillantes' },
      { nom:'Salade méchouia', prix:320,  desc:'Tomates grillées, poivrons, ail' },
    ]},
    { categorie:'Plats', plats:[
      { nom:'Couscous royal',    prix:1800, desc:'Semoule, légumes, merguez et poulet' },
      { nom:"Mechoui d'agneau",  prix:2200, desc:'Agneau rôti aux herbes et épices' },
      { nom:'Chakhchoukha',      prix:1600, desc:'Pain maison, sauce tomate et poulet' },
      { nom:'Tajine zitoune',    prix:1900, desc:'Poulet aux olives et citron confit' },
    ]},
    { categorie:'Desserts', plats:[
      { nom:'Baklawa',  prix:350, desc:'Pâtisserie orientale au miel et amandes' },
      { nom:'Zalabia',  prix:280, desc:'Beignets au sirop de fleur d\'oranger' },
      { nom:'Kalb el louz', prix:300, desc:'Gâteau de semoule à la fleur d\'oranger' },
    ]},
    { categorie:'Boissons', plats:[
      { nom:'Thé à la menthe', prix:150, desc:'Thé vert, menthe fraîche, pignons' },
      { nom:'Jus de grenade',  prix:250, desc:'Pressé frais de saison' },
    ]},
  ],
  mediterraneen: [
    { categorie:'Entrées', plats:[
      { nom:'Houmous maison',   prix:480, desc:'Pois chiches, tahini, citron, huile d\'olive' },
      { nom:'Salade grecque',   prix:420, desc:'Tomates, concombre, feta, olives' },
      { nom:'Calamars frits',   prix:650, desc:'Friture légère, aïoli citronné' },
    ]},
    { categorie:'Plats', plats:[
      { nom:'Loup de mer grillé',  prix:2800, desc:'Poisson entier, herbes, citron' },
      { nom:'Crevettes à l\'ail',  prix:2400, desc:'Gambas, beurre, persil, ail' },
      { nom:'Risotto aux fruits de mer', prix:2200, desc:'Crevettes, moules, calmar' },
    ]},
    { categorie:'Desserts', plats:[
      { nom:'Tiramisu', prix:480, desc:'Mascarpone, café, cacao' },
      { nom:'Baklava au miel', prix:380, desc:'Feuilletage, noix, sirop de miel' },
    ]},
  ],
  italien: [
    { categorie:'Antipasti', plats:[
      { nom:'Bruschetta al pomodoro', prix:420, desc:'Pain grillé, tomates fraîches, basilic' },
      { nom:'Burrata',               prix:680, desc:'Burrata crémeuse, tomates cerises, roquette' },
    ]},
    { categorie:'Pasta', plats:[
      { nom:'Spaghetti carbonara',   prix:1600, desc:'Guanciale, œuf, pecorino, poivre noir' },
      { nom:'Tagliatelle al ragù',   prix:1700, desc:'Pâtes fraîches, ragù de bœuf à l\'ancienne' },
      { nom:'Penne all\'arrabbiata', prix:1400, desc:'Tomates, piment, ail, basilic' },
    ]},
    { categorie:'Pizza', plats:[
      { nom:'Margherita',  prix:1400, desc:'Tomate, mozzarella fior di latte, basilic' },
      { nom:'Quattro stagioni', prix:1700, desc:'Jambon, champignons, artichaut, olives' },
      { nom:'Diavola',     prix:1600, desc:'Tomate, mozzarella, salami piquant' },
    ]},
    { categorie:'Dolci', plats:[
      { nom:'Tiramisù classico', prix:500, desc:'Mascarpone, café, savoiardi, cacao' },
      { nom:'Panna cotta',       prix:420, desc:'Crème vanille, coulis de fruits rouges' },
    ]},
  ],
  default: [
    { categorie:'Entrées', plats:[
      { nom:'Soupe du jour',    prix:380, desc:'Selon la saison et le marché' },
      { nom:'Salade maison',    prix:420, desc:'Fraîche et colorée' },
    ]},
    { categorie:'Plats', plats:[
      { nom:'Plat du chef',     prix:1800, desc:'Suggestion du chef, faite maison' },
      { nom:'Grillades mixtes', prix:2200, desc:'Viandes grillées, légumes de saison' },
    ]},
    { categorie:'Desserts', plats:[
      { nom:'Dessert maison',   prix:400, desc:'Selon inspiration du pâtissier' },
    ]},
  ],
};

const AVIS_MOCK = [
  { nom:'Karim B.',   note:5, date:'12 mai', txt:'Excellent ! Service impeccable, on reviendra sans hésiter.' },
  { nom:'Amira M.',   note:4, date:'8 mai',  txt:'Très bonne cuisine, ambiance chaleureuse. Je recommande.' },
  { nom:'Sofiane A.', note:5, date:'2 mai',  txt:'L\'un des meilleurs de la ville. Qualité constante.' },
];

function SectionTitle({ children }) {
  return (
    <View style={s.sectionHead}>
      <View style={s.sectionLine} />
      <Text style={s.sectionTitle}>{children}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

export default function RestaurantScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || {
    name: 'Dar Zitoun', cuisine_type: 'algerien',
    address: 'Bab El Oued, Alger', quartier: 'Bab El Oued',
  };

  const [photoIndex, setPhotoIndex] = useState(0);
  const [isFav, setIsFav]           = useState(false);
  const [favId, setFavId]           = useState(null);
  const [favLoading, setFavLoading] = useState(false);
  const [userId, setUserId]         = useState(null);

  const photos  = restaurant.photos?.length > 0 ? restaurant.photos : null;
  const menu    = MENUS[restaurant.cuisine_type] || MENUS.default;
  const rating  = restaurant.avg_rating > 0 ? Number(restaurant.avg_rating).toFixed(1) : '—';
  const price   = restaurant.avg_ticket > 0 ? restaurant.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—';
  const covers  = restaurant.capacity > 0 ? String(restaurant.capacity) : '—';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      supabase.from('users').select('id').eq('auth_id', u.id).single()
        .then(({ data: row }) => {
          if (!row) return;
          setUserId(row.id);
          supabase.from('favorites')
            .select('id').eq('user_id', row.id).eq('restaurant_id', restaurant.id).maybeSingle()
            .then(({ data: fav }) => { if (fav) { setIsFav(true); setFavId(fav.id); } });
        });
    });
  }, []);

  const toggleFav = async () => {
    if (!userId || favLoading) return;
    setFavLoading(true);
    if (isFav) {
      await supabase.from('favorites').delete().eq('id', favId);
      setIsFav(false); setFavId(null);
    } else {
      const { data } = await supabase.from('favorites')
        .insert({ user_id: userId, restaurant_id: restaurant.id }).select('id').single();
      if (data) { setIsFav(true); setFavId(data.id); }
    }
    setFavLoading(false);
  };

  return (
    <SafeAreaView style={s.root}>

      {/* ── HERO ── */}
      <View style={s.hero}>
        {photos ? (
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={(e) => {
              setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SW));
            }}
          >
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={s.heroPhoto} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <Text style={s.heroEmoji}>{EMOJI[restaurant.cuisine_type] || '🍽️'}</Text>
        )}

        {/* Dégradé bas */}
        <View style={s.heroGrad} />

        {/* Bouton retour */}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>

        {/* Bouton favori */}
        <TouchableOpacity style={s.favBtn} onPress={toggleFav} disabled={favLoading}>
          {favLoading
            ? <ActivityIndicator size={14} color={C.accent} />
            : <Text style={s.favBtnTxt}>{isFav ? '❤️' : '🤍'}</Text>
          }
        </TouchableOpacity>

        {/* Dots galerie */}
        {photos && photos.length > 1 && (
          <View style={s.dots}>
            {photos.map((_, i) => (
              <View key={i} style={[s.dot, i === photoIndex && s.dotOn]} />
            ))}
          </View>
        )}

        {/* Badge ouvert */}
        <View style={s.openBadge}>
          <View style={s.openDot} />
          <Text style={s.openTxt}>Ouvert · ~20 min</Text>
        </View>
      </View>

      {/* ── CONTENU SCROLLABLE ── */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {/* Info principale */}
        <View style={s.infoBlock}>
          <View style={s.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.restCuisine}>
                {restaurant.cuisine_type?.toUpperCase()}
                {restaurant.quartier ? '  ·  ' + restaurant.quartier : ''}
              </Text>
              <Text style={s.restName}>{restaurant.name}</Text>
              <Text style={s.restAddr}>📍 {restaurant.address || restaurant.quartier}</Text>
            </View>
            <View style={s.ratingBox}>
              <Text style={s.ratingVal}>⭐ {rating}</Text>
              <Text style={s.ratingCount}>
                {restaurant.review_count > 0 ? restaurant.review_count + ' avis' : 'Nouveau'}
              </Text>
            </View>
          </View>

          {/* Stats rapides */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statIcon}>⏱</Text>
              <Text style={s.statVal}>~20 min</Text>
              <Text style={s.statLbl}>Attente</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={s.statIcon}>💰</Text>
              <Text style={s.statVal}>{price}</Text>
              <Text style={s.statLbl}>Prix moyen</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={s.statIcon}>🪑</Text>
              <Text style={s.statVal}>{covers}</Text>
              <Text style={s.statLbl}>Couverts</Text>
            </View>
          </View>
        </View>

        {/* ══ MENU ══ */}
        <SectionTitle>MENU</SectionTitle>

        {menu.map((cat, i) => (
          <View key={i} style={s.menuCat}>
            <View style={s.catHeader}>
              <Text style={s.catName}>{cat.categorie.toUpperCase()}</Text>
              <View style={s.catLine} />
            </View>
            {cat.plats.map((plat, j) => (
              <View key={j} style={[s.platRow, j < cat.plats.length - 1 && s.platBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.platNom}>{plat.nom}</Text>
                  <Text style={s.platDesc}>{plat.desc}</Text>
                </View>
                <View style={s.platPrixBox}>
                  <Text style={s.platPrix}>{plat.prix}</Text>
                  <Text style={s.platPrixUnit}>DA</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* ══ AVIS ══ */}
        <SectionTitle>AVIS</SectionTitle>

        <View style={s.noteSummary}>
          <Text style={s.noteBig}>{rating}</Text>
          <View style={{ gap: 4 }}>
            <Text style={s.noteStars}>{'⭐'.repeat(Math.round(restaurant.avg_rating || 5))}</Text>
            <Text style={s.noteCount}>
              {restaurant.review_count > 0 ? restaurant.review_count + ' avis' : 'Soyez le premier'}
            </Text>
          </View>
        </View>

        {AVIS_MOCK.map((a, i) => (
          <View key={i} style={s.avisItem}>
            <View style={s.avisTop}>
              <View style={s.avisAvatar}>
                <Text style={s.avisAvatarTxt}>{a.nom[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.avisNom}>{a.nom}</Text>
                <Text style={s.avisDate}>{a.date} · {'⭐'.repeat(a.note)}</Text>
              </View>
            </View>
            <Text style={s.avisTxt}>{a.txt}</Text>
          </View>
        ))}

        {/* ══ INFOS ══ */}
        <SectionTitle>INFOS PRATIQUES</SectionTitle>

        <View style={s.infosCard}>
          {[
            { icon:'📍', label:'Adresse',  val: restaurant.address || restaurant.quartier },
            { icon:'🕐', label:'Horaires', val: '12h00 – 22h30 · Tous les jours' },
            { icon:'📞', label:'Téléphone',val: '021 00 00 01' },
            { icon:'🌐', label:'Cuisine',  val: restaurant.cuisine_type },
            { icon:'🅿️', label:'Parking',  val: 'Disponible à proximité' },
          ].map((item, i, arr) => (
            <View key={i} style={[s.infoRow2, i < arr.length - 1 && s.infoBorder]}>
              <Text style={s.infoIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={s.infoVal}>{item.val}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── BOUTON RÉSERVER ── */}
      <View style={s.footer}>
        <TouchableOpacity
          style={s.reserveBtn}
          onPress={() => navigation.navigate('ReservationForm', { restaurant })}
        >
          <Text style={s.reserveBtnTxt}>RÉSERVER UNE TABLE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 16;

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },

  /* Hero */
  hero:           { height: 220, backgroundColor: '#1a2e1a', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroPhoto:      { width: SW, height: 220 },
  heroEmoji:      { fontSize: 72 },
  heroGrad:       { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(13,22,40,0.55)' },
  backBtn:        { position: 'absolute', top: TOP, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(10,15,26,0.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  backBtnTxt:     { color: C.text, fontSize: 18 },
  favBtn:         { position: 'absolute', top: TOP, right: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(10,15,26,0.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  favBtnTxt:      { fontSize: 18 },
  dots:           { position: 'absolute', bottom: 46, flexDirection: 'row', gap: 5 },
  dot:            { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn:          { backgroundColor: '#fff', width: 16 },
  openBadge:      { position: 'absolute', bottom: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(10,15,26,0.85)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(61,153,112,0.3)' },
  openDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  openTxt:        { color: C.green, fontSize: 11 },

  /* Info principale */
  infoBlock:      { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  infoRow:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  restCuisine:    { color: C.accent, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 5 },
  restName:       { color: C.text, fontSize: 22, fontWeight: '300', letterSpacing: 0.5, marginBottom: 5 },
  restAddr:       { color: C.dim, fontSize: 11 },
  ratingBox:      { alignItems: 'flex-end', gap: 3, paddingLeft: 10 },
  ratingVal:      { color: C.accent, fontSize: 18, fontWeight: '300' },
  ratingCount:    { color: C.dimmer, fontSize: 10 },

  /* Stats */
  statsRow:       { flexDirection: 'row', backgroundColor: C.bg2, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  statItem:       { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 3 },
  statIcon:       { fontSize: 16 },
  statVal:        { color: C.text, fontSize: 12, fontWeight: '400' },
  statLbl:        { color: C.dimmer, fontSize: 9, letterSpacing: 0.5 },
  statDiv:        { width: 1, backgroundColor: C.border, marginVertical: 8 },

  /* Section title */
  sectionHead:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 28, marginBottom: 6 },
  sectionLine:    { flex: 1, height: 1, backgroundColor: C.border },
  sectionTitle:   { color: C.dimmer, fontSize: 10, letterSpacing: 3, marginHorizontal: 12 },

  /* Menu */
  menuCat:        { marginHorizontal: 20, marginTop: 16 },
  catHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  catName:        { color: C.accent, fontSize: 9, letterSpacing: 3, fontWeight: '500' },
  catLine:        { flex: 1, height: 1, backgroundColor: C.borderAccent },
  platRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  platBorder:     { borderBottomWidth: 1, borderBottomColor: C.border },
  platNom:        { color: C.text, fontSize: 14, fontWeight: '300', marginBottom: 3 },
  platDesc:       { color: C.dim, fontSize: 11 },
  platPrixBox:    { alignItems: 'flex-end' },
  platPrix:       { color: C.accent, fontSize: 14, fontWeight: '500' },
  platPrixUnit:   { color: C.dimmer, fontSize: 9 },

  /* Avis */
  noteSummary:    { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 20, marginTop: 16, marginBottom: 8, backgroundColor: C.bg2, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  noteBig:        { color: C.accent, fontSize: 44, fontWeight: '300' },
  noteStars:      { fontSize: 14, marginBottom: 3 },
  noteCount:      { color: C.dim, fontSize: 12 },
  avisItem:       { marginHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  avisTop:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avisAvatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  avisAvatarTxt:  { color: C.accent, fontSize: 13, fontWeight: '400' },
  avisNom:        { color: C.text, fontSize: 13, fontWeight: '300', marginBottom: 2 },
  avisDate:       { color: C.dim, fontSize: 11 },
  avisTxt:        { color: C.dim, fontSize: 13, fontWeight: '300', lineHeight: 20 },

  /* Infos */
  infosCard:      { marginHorizontal: 20, marginTop: 16, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  infoRow2:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  infoBorder:     { borderBottomWidth: 1, borderBottomColor: C.border },
  infoIcon:       { fontSize: 18, width: 28, textAlign: 'center' },
  infoLabel:      { color: C.dimmer, fontSize: 9, letterSpacing: 2, marginBottom: 2, textTransform: 'uppercase' },
  infoVal:        { color: C.text, fontSize: 13, fontWeight: '300' },

  /* Footer */
  footer:         { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  reserveBtn:     { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  reserveBtnTxt:  { color: C.bg, fontSize: 13, fontWeight: '500', letterSpacing: 2 },
});
