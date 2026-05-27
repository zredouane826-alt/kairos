import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, StatusBar as RNStatusBar, Dimensions } from 'react-native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator, Animated,
} from 'react-native';
import { supabase } from '../supabase';

const SW   = Dimensions.get('window').width;
const HERO = 300;
const TOP  = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 16;

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#e05a5a', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.25)',
};

/* ─── Données menus mock ─── */
const MENUS = {
  algerien: [
    { cat:'Entrées', items:[
      { nom:'Chorba frik',      prix:450,  desc:'Soupe traditionnelle au blé vert' },
      { nom:'Bourek au thon',   prix:380,  desc:'Feuilles de brick croustillantes' },
      { nom:'Salade méchouia',  prix:320,  desc:'Tomates grillées, poivrons, ail' },
    ]},
    { cat:'Plats', items:[
      { nom:'Couscous royal',   prix:1800, desc:'Semoule, légumes, merguez et poulet' },
      { nom:"Mechoui d'agneau", prix:2200, desc:'Agneau rôti aux herbes et épices' },
      { nom:'Chakhchoukha',     prix:1600, desc:'Pain maison, sauce tomate et poulet' },
      { nom:'Tajine zitoune',   prix:1900, desc:'Poulet aux olives et citron confit' },
    ]},
    { cat:'Desserts', items:[
      { nom:'Baklawa',       prix:350, desc:'Pâtisserie orientale au miel et amandes' },
      { nom:'Zalabia',       prix:280, desc:"Beignets au sirop de fleur d'oranger" },
      { nom:'Kalb el louz',  prix:300, desc:"Gâteau de semoule à la fleur d'oranger" },
    ]},
    { cat:'Boissons', items:[
      { nom:'Thé à la menthe', prix:150, desc:'Thé vert, menthe fraîche, pignons' },
      { nom:'Jus de grenade',  prix:250, desc:'Pressé frais de saison' },
    ]},
  ],
  mediterraneen: [
    { cat:'Entrées', items:[
      { nom:'Houmous maison',  prix:480,  desc:"Pois chiches, tahini, citron, huile d'olive" },
      { nom:'Salade grecque',  prix:420,  desc:'Tomates, concombre, feta, olives' },
      { nom:'Calamars frits',  prix:650,  desc:'Friture légère, aïoli citronné' },
    ]},
    { cat:'Plats', items:[
      { nom:'Loup de mer grillé',       prix:2800, desc:'Poisson entier, herbes, citron' },
      { nom:"Crevettes à l'ail",        prix:2400, desc:'Gambas, beurre, persil, ail' },
      { nom:'Risotto aux fruits de mer',prix:2200, desc:'Crevettes, moules, calmar' },
    ]},
    { cat:'Desserts', items:[
      { nom:'Tiramisu',       prix:480, desc:'Mascarpone, café, cacao' },
      { nom:'Baklava au miel',prix:380, desc:'Feuilletage, noix, sirop de miel' },
    ]},
  ],
  italien: [
    { cat:'Antipasti', items:[
      { nom:'Bruschetta al pomodoro', prix:420, desc:'Pain grillé, tomates fraîches, basilic' },
      { nom:'Burrata',                prix:680, desc:'Burrata crémeuse, tomates cerises, roquette' },
    ]},
    { cat:'Pasta', items:[
      { nom:'Spaghetti carbonara',    prix:1600, desc:'Guanciale, œuf, pecorino, poivre noir' },
      { nom:'Tagliatelle al ragù',    prix:1700, desc:"Pâtes fraîches, ragù de bœuf à l'ancienne" },
      { nom:"Penne all'arrabbiata",   prix:1400, desc:'Tomates, piment, ail, basilic' },
    ]},
    { cat:'Pizza', items:[
      { nom:'Margherita',      prix:1400, desc:'Tomate, mozzarella fior di latte, basilic' },
      { nom:'Quattro stagioni',prix:1700, desc:'Jambon, champignons, artichaut, olives' },
      { nom:'Diavola',         prix:1600, desc:'Tomate, mozzarella, salami piquant' },
    ]},
    { cat:'Dolci', items:[
      { nom:'Tiramisù classico',prix:500, desc:'Mascarpone, café, savoiardi, cacao' },
      { nom:'Panna cotta',      prix:420, desc:'Crème vanille, coulis de fruits rouges' },
    ]},
  ],
  default: [
    { cat:'Entrées', items:[
      { nom:'Soupe du jour',   prix:380,  desc:'Selon la saison et le marché' },
      { nom:'Salade maison',   prix:420,  desc:'Fraîche et colorée' },
    ]},
    { cat:'Plats', items:[
      { nom:'Plat du chef',    prix:1800, desc:'Suggestion du chef, faite maison' },
      { nom:'Grillades mixtes',prix:2200, desc:'Viandes grillées, légumes de saison' },
    ]},
    { cat:'Desserts', items:[
      { nom:'Dessert maison',  prix:400,  desc:'Selon inspiration du pâtissier' },
    ]},
    { cat:'Boissons', items:[
      { nom:'Eau minérale',    prix:100,  desc:'50cl ou 1L' },
      { nom:'Jus de fruits',   prix:250,  desc:'Frais du jour' },
    ]},
  ],
};

const MOCK_AVIS = [
  { id:'m1', nom:'Karim B.',   note:5, date:'12 mai 2026', txt:'Excellent ! Service impeccable, on reviendra sans hésiter.' },
  { id:'m2', nom:'Amira M.',   note:4, date:'8 mai 2026',  txt:'Très bonne cuisine, ambiance chaleureuse. Je recommande.' },
  { id:'m3', nom:'Sofiane A.', note:5, date:'2 mai 2026',  txt:"L'un des meilleurs de la ville. Qualité constante." },
];

/* ─── Helpers ─── */
function Stars({ value, size = 12, color = '#f0c040' }) {
  const full = Math.floor(value || 0);
  const stars = Array.from({ length: 5 }, (_, i) => i < full ? '★' : '☆');
  return <Text style={{ fontSize: size, color, letterSpacing: 1 }}>{stars.join('')}</Text>;
}

function RatingBar({ pct, color }) {
  return (
    <View style={{ flex: 1, height: 4, backgroundColor: C.bg3, borderRadius: 2, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

/* ─── Composants tabs ─── */
function MenuTab({ menu, cuisine }) {
  const cats  = menu.map(c => c.cat);
  const [active, setActive] = useState(cats[0]);
  const catData = menu.find(c => c.cat === active);

  return (
    <>
      {/* Category pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mt.pillRow}>
        {cats.map(cat => (
          <TouchableOpacity key={cat} style={[mt.pill, active === cat && mt.pillOn]} onPress={() => setActive(cat)}>
            <Text style={[mt.pillTxt, active === cat && mt.pillTxtOn]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items */}
      <View style={mt.items}>
        {catData?.items.map((item, i) => (
          <View key={i} style={[mt.row, i < catData.items.length - 1 && mt.rowBorder]}>
            <View style={mt.rowLeft}>
              <Text style={mt.nom}>{item.nom}</Text>
              <Text style={mt.desc}>{item.desc}</Text>
            </View>
            <View style={mt.priceBox}>
              <Text style={mt.price}>{item.prix.toLocaleString('fr-FR')}</Text>
              <Text style={mt.priceUnit}>DA</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </>
  );
}

const mt = StyleSheet.create({
  pillRow:  { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  pill:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  pillOn:   { backgroundColor: 'rgba(200,151,90,0.15)', borderColor: C.accent },
  pillTxt:  { color: C.dim, fontSize: 13, fontWeight: '300' },
  pillTxtOn:{ color: C.accent, fontWeight: '400' },
  items:    { marginHorizontal: 20, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder:{ borderBottomWidth: 1, borderBottomColor: C.border },
  rowLeft:  { flex: 1 },
  nom:      { color: C.text, fontSize: 14, fontWeight: '300', marginBottom: 3 },
  desc:     { color: C.dim, fontSize: 11, lineHeight: 16 },
  priceBox: { alignItems: 'flex-end' },
  price:    { color: C.accent, fontSize: 14, fontWeight: '500' },
  priceUnit:{ color: C.dimmer, fontSize: 9 },
});

function AvisTab({ restaurant, reviews, loadingReviews }) {
  const rating = Number(restaurant.avg_rating || 0);
  const list   = reviews.length > 0 ? reviews : MOCK_AVIS;

  const dist = [5,4,3,2,1].map(n => ({
    note: n,
    pct: list.length > 0 ? Math.round((list.filter(r => Math.round(r.note) === n).length / list.length) * 100) : (n === 5 ? 60 : n === 4 ? 30 : 10),
  }));

  if (loadingReviews) return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator color={C.accent} />
    </View>
  );

  return (
    <>
      {/* Summary */}
      <View style={at.summary}>
        <View style={at.summaryLeft}>
          <Text style={at.bigRating}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
          <Stars value={rating} size={16} />
          <Text style={at.reviewCount}>{restaurant.review_count > 0 ? `${restaurant.review_count} avis` : `${list.length} avis`}</Text>
        </View>
        <View style={at.summaryRight}>
          {dist.map(d => (
            <View key={d.note} style={at.barRow}>
              <Text style={at.barLabel}>{d.note}</Text>
              <RatingBar pct={d.pct} color={C.accent} />
              <Text style={at.barPct}>{d.pct}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Avis list */}
      {list.map((a, i) => (
        <View key={a.id || i} style={at.card}>
          <View style={at.cardTop}>
            <View style={at.avatar}>
              <Text style={at.avatarTxt}>{(a.nom || a.first_name || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={at.nom}>{a.nom || `${a.first_name || ''} ${(a.last_name || '')[0] || ''}.`.trim()}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Stars value={a.note} size={11} />
                <Text style={at.date}>{a.date || a.created_at?.slice(0,10)}</Text>
              </View>
            </View>
          </View>
          {!!a.txt && <Text style={at.txt}>{a.txt}</Text>}
          {!!a.comment && <Text style={at.txt}>{a.comment}</Text>}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </>
  );
}

const at = StyleSheet.create({
  summary:     { flexDirection: 'row', gap: 20, margin: 20, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 18 },
  summaryLeft: { alignItems: 'center', gap: 6 },
  bigRating:   { color: C.accent, fontSize: 48, fontWeight: '200', lineHeight: 52 },
  reviewCount: { color: C.dim, fontSize: 11 },
  summaryRight:{ flex: 1, gap: 6, justifyContent: 'center' },
  barRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel:    { color: C.dim, fontSize: 11, width: 10, textAlign: 'right' },
  barPct:      { color: C.dimmer, fontSize: 10, width: 28, textAlign: 'right' },
  card:        { marginHorizontal: 20, marginBottom: 12, backgroundColor: C.bg2, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  cardTop:     { flexDirection: 'row', gap: 10, marginBottom: 10 },
  avatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  avatarTxt:   { color: C.accent, fontSize: 14, fontWeight: '400' },
  nom:         { color: C.text, fontSize: 13, fontWeight: '300', marginBottom: 3 },
  date:        { color: C.dimmer, fontSize: 10 },
  txt:         { color: C.dim, fontSize: 13, fontWeight: '300', lineHeight: 20 },
});

function InfosTab({ restaurant }) {
  const rows = [
    { icon:'📍', label:'Adresse',   val: restaurant.address || restaurant.quartier || '—' },
    { icon:'🏙️', label:'Ville',     val: restaurant.city || restaurant.quartier || '—' },
    { icon:'🍽️', label:'Cuisine',   val: restaurant.cuisine_type?.replace(/_/g,' ') || '—' },
    { icon:'🕐', label:'Horaires',  val: restaurant.opening_hours || '12h00 – 14h30 · 19h00 – 22h30' },
    { icon:'📞', label:'Téléphone', val: restaurant.phone || 'Non renseigné' },
    { icon:'💰', label:'Prix moyen',val: restaurant.avg_ticket > 0 ? `${restaurant.avg_ticket.toLocaleString('fr-FR')} DA` : '—' },
    { icon:'🪑', label:'Couverts',  val: restaurant.capacity > 0 ? String(restaurant.capacity) : '—' },
    { icon:'🅿️', label:'Parking',   val: 'Disponible à proximité' },
  ];

  return (
    <>
      <View style={it.card}>
        {rows.map((row, i) => (
          <View key={i} style={[it.row, i < rows.length - 1 && it.rowBorder]}>
            <Text style={it.icon}>{row.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={it.label}>{row.label.toUpperCase()}</Text>
              <Text style={it.val}>{row.val}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </>
  );
}

const it = StyleSheet.create({
  card:     { margin: 20, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder:{ borderBottomWidth: 1, borderBottomColor: C.border },
  icon:     { fontSize: 20, width: 28, textAlign: 'center' },
  label:    { color: C.dimmer, fontSize: 9, letterSpacing: 2, marginBottom: 2 },
  val:      { color: C.text, fontSize: 13, fontWeight: '300' },
});

/* ─── Écran principal ─── */
export default function RestaurantScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || {
    name: 'Dar Zitoun', cuisine_type: 'algerien',
    address: 'Bab El Oued, Alger', quartier: 'Bab El Oued',
  };

  const [tab,          setTab]          = useState('Menu');
  const [photoIndex,   setPhotoIndex]   = useState(0);
  const [isFav,        setIsFav]        = useState(false);
  const [favId,        setFavId]        = useState(null);
  const [favLoading,   setFavLoading]   = useState(false);
  const [userId,       setUserId]       = useState(null);
  const [reviews,      setReviews]      = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;

  const photos = restaurant.photos?.length > 0 ? restaurant.photos
    : restaurant.photo_url ? [restaurant.photo_url] : null;
  const menu   = MENUS[restaurant.cuisine_type] || MENUS.default;
  const rating = restaurant.avg_rating > 0 ? Number(restaurant.avg_rating).toFixed(1) : '—';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      supabase.from('users').select('id').eq('auth_id', u.id).single()
        .then(({ data: row }) => {
          if (!row) return;
          setUserId(row.id);
          if (restaurant.id) {
            supabase.from('favorites')
              .select('id').eq('user_id', row.id).eq('restaurant_id', restaurant.id).maybeSingle()
              .then(({ data: fav }) => { if (fav) { setIsFav(true); setFavId(fav.id); } });
          }
        });
    });

    if (restaurant.id) {
      setLoadingReviews(true);
      supabase.from('reviews')
        .select('id, rating, comment, created_at, users(first_name, last_name)')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          if (data?.length > 0) {
            setReviews(data.map(r => ({
              id: r.id,
              note: r.rating,
              first_name: r.users?.first_name,
              last_name: r.users?.last_name,
              comment: r.comment,
              created_at: r.created_at,
            })));
          }
          setLoadingReviews(false);
        });
    }
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

  function switchTab(t) {
    Animated.timing(tabAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setTab(t);
      Animated.timing(tabAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }
  useEffect(() => { tabAnim.setValue(1); }, []);

  return (
    <SafeAreaView style={s.root}>

      {/* ── HERO ── */}
      <View style={s.hero}>
        {photos ? (
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SW))}
          >
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={{ width: SW, height: HERO }} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0f1e12', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 72, opacity: 0.6 }}>🍽️</Text>
          </View>
        )}

        {/* Gradient */}
        <View style={s.grad} />

        {/* Back */}
        <TouchableOpacity style={[s.heroBtn, { left: 16 }]} onPress={() => navigation?.goBack()}>
          <Text style={s.heroBtnTxt}>←</Text>
        </TouchableOpacity>

        {/* Fav */}
        <TouchableOpacity style={[s.heroBtn, { right: 16 }]} onPress={toggleFav} disabled={favLoading}>
          {favLoading
            ? <ActivityIndicator size={14} color={C.accent} />
            : <Text style={{ fontSize: 18 }}>{isFav ? '❤️' : '🤍'}</Text>
          }
        </TouchableOpacity>

        {/* Dots */}
        {photos && photos.length > 1 && (
          <View style={s.dots}>
            {photos.map((_, i) => (
              <View key={i} style={[s.dot, i === photoIndex && s.dotOn]} />
            ))}
          </View>
        )}

        {/* Overlay info bas */}
        <View style={s.heroInfo}>
          <View style={s.heroCuisineBadge}>
            <Text style={s.heroCuisineTxt}>{restaurant.cuisine_type?.replace(/_/g,' ').toUpperCase()}</Text>
          </View>
          <Text style={s.heroName} numberOfLines={1}>{restaurant.name}</Text>
          <View style={s.heroMeta}>
            {restaurant.avg_rating > 0 && (
              <View style={s.heroRating}>
                <Text style={s.heroRatingTxt}>★ {rating}</Text>
                {restaurant.review_count > 0 && <Text style={s.heroRatingCount}>({restaurant.review_count})</Text>}
              </View>
            )}
            <Text style={s.heroSep}>·</Text>
            <Text style={s.heroAddr} numberOfLines={1}>📍 {restaurant.quartier || restaurant.city || ''}</Text>
          </View>
        </View>

        {/* Open badge */}
        <View style={s.openBadge}>
          <View style={s.openDot} />
          <Text style={s.openTxt}>Ouvert</Text>
        </View>
      </View>

      {/* ── STATS STRIP ── */}
      <View style={s.strip}>
        <View style={s.stripItem}>
          <Text style={s.stripVal}>{rating}</Text>
          <Text style={s.stripLbl}>Note</Text>
        </View>
        <View style={s.stripDiv} />
        <View style={s.stripItem}>
          <Text style={s.stripVal}>
            {restaurant.avg_ticket > 0 ? (restaurant.avg_ticket / 1000).toFixed(0) + 'k' : '—'}
          </Text>
          <Text style={s.stripLbl}>Prix moy. (DA)</Text>
        </View>
        <View style={s.stripDiv} />
        <View style={s.stripItem}>
          <Text style={s.stripVal}>{restaurant.capacity > 0 ? restaurant.capacity : '—'}</Text>
          <Text style={s.stripLbl}>Couverts</Text>
        </View>
        <View style={s.stripDiv} />
        <View style={s.stripItem}>
          <Text style={s.stripVal}>{reviews.length > 0 ? reviews.length : restaurant.review_count || '—'}</Text>
          <Text style={s.stripLbl}>Avis</Text>
        </View>
      </View>

      {/* ── TABS ── */}
      <View style={s.tabBar}>
        {['Menu','Avis','Infos'].map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnOn]} onPress={() => switchTab(t)}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>{t}</Text>
            {tab === t && <View style={s.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CONTENU ── */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, opacity: tabAnim }}
      >
        {tab === 'Menu' && <MenuTab menu={menu} cuisine={restaurant.cuisine_type} />}
        {tab === 'Avis' && <AvisTab restaurant={restaurant} reviews={reviews} loadingReviews={loadingReviews} />}
        {tab === 'Infos' && <InfosTab restaurant={restaurant} />}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* ── FOOTER ── */}
      <View style={s.footer}>
        <View style={s.footerInner}>
          {restaurant.avg_ticket > 0 && (
            <View style={s.footerPrice}>
              <Text style={s.footerPriceLbl}>Prix moy.</Text>
              <Text style={s.footerPriceVal}>{restaurant.avg_ticket.toLocaleString('fr-FR')} DA</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.reserveBtn, !restaurant.avg_ticket && { flex: 1 }]}
            onPress={() => navigation.navigate('ReservationForm', { restaurant })}
          >
            <Text style={s.reserveTxt}>RÉSERVER UNE TABLE</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Hero */
  hero:       { height: HERO, overflow: 'hidden' },
  grad:       { position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO * 0.6,
                background: 'transparent',
                backgroundColor: 'transparent',
              },
  heroBtn:    { position: 'absolute', top: TOP, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(10,15,26,0.75)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  heroBtnTxt: { color: C.text, fontSize: 18 },

  /* Dots */
  dots:    { position: 'absolute', bottom: 82, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot:     { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn:   { backgroundColor: '#fff', width: 16 },

  /* Open badge */
  openBadge: { position: 'absolute', top: TOP, left: '50%', transform: [{ translateX: -40 }], flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(10,15,26,0.8)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(61,153,112,0.35)' },
  openDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  openTxt:   { color: C.green, fontSize: 11 },

  /* Hero info overlay */
  heroInfo:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 18, backgroundColor: 'rgba(13,22,40,0.72)' },
  heroCuisineBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(200,151,90,0.2)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(200,151,90,0.4)', paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
  heroCuisineTxt: { color: C.accent, fontSize: 9, letterSpacing: 2.5 },
  heroName:       { color: C.text, fontSize: 22, fontWeight: '300', letterSpacing: 0.5, marginBottom: 6 },
  heroMeta:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroRating:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroRatingTxt:  { color: C.accent, fontSize: 13, fontWeight: '500' },
  heroRatingCount:{ color: C.dim, fontSize: 11 },
  heroSep:        { color: C.dimmer },
  heroAddr:       { color: C.dim, fontSize: 12, flex: 1 },

  /* Stats strip */
  strip:     { flexDirection: 'row', backgroundColor: C.bg2, borderBottomWidth: 1, borderBottomColor: C.border },
  stripItem: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 2 },
  stripVal:  { color: C.text, fontSize: 13, fontWeight: '400' },
  stripLbl:  { color: C.dimmer, fontSize: 9, letterSpacing: 0.5 },
  stripDiv:  { width: 1, backgroundColor: C.border, marginVertical: 8 },

  /* Tab bar */
  tabBar:    { flexDirection: 'row', backgroundColor: C.bg2, borderBottomWidth: 1, borderBottomColor: C.border },
  tabBtn:    { flex: 1, alignItems: 'center', paddingVertical: 13, position: 'relative' },
  tabBtnOn:  {},
  tabTxt:    { color: C.dim, fontSize: 13, fontWeight: '300' },
  tabTxtOn:  { color: C.text, fontWeight: '400' },
  tabLine:   { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, backgroundColor: C.accent, borderRadius: 1 },

  /* Footer */
  footer:      { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  footerInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  footerPrice: { gap: 2 },
  footerPriceLbl: { color: C.dimmer, fontSize: 9, letterSpacing: 1 },
  footerPriceVal: { color: C.accent, fontSize: 15, fontWeight: '400' },
  reserveBtn:  { flex: 1, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  reserveTxt:  { color: C.bg, fontSize: 13, fontWeight: '500', letterSpacing: 1.5 },
});
