import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, SafeAreaView, TextInput,
  RefreshControl, Alert, Dimensions,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';

const SW = Dimensions.get('window').width;
const CARD_W = (SW - spacing.xxl * 2 - spacing.lg) / 2;

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

const SORT_OPTIONS = [
  { id: 'recent',  label: 'Récents' },
  { id: 'rating',  label: 'Mieux notés' },
  { id: 'alpha',   label: 'A → Z' },
];

function timeAdded(iso) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Ajouté aujourd'hui";
  if (d === 1) return 'Ajouté hier';
  if (d < 30)  return `Ajouté il y a ${d} j`;
  return `Ajouté le ${new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
}

function SkeletonGrid() {
  return (
    <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: spacing.lg }}>
      {[1,2,3].map(i => (
        <View key={i} style={{ flexDirection: 'row', gap: spacing.lg }}>
          <MLoader width={CARD_W} height={200} borderRadius={radius.xxl} />
          <MLoader width={CARD_W} height={200} borderRadius={radius.xxl} />
        </View>
      ))}
    </View>
  );
}

/* ─── Card favori ─── */
function FavCard({ fav, index, onPress, onReserve, onRemove, removing }) {
  const r     = fav.restaurants || {};
  const photo = r.photo_url || (r.photos?.[0]) || null;

  return (
    <TouchableOpacity style={fc.card} onPress={onPress} activeOpacity={0.88}>
      <View style={fc.photoWrap}>
        {photo
          ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: ['#1a2e1a','#1a1e2e','#2e2a1a','#2a1a2e','#1a2a2e'][index % 5], alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 38, opacity: 0.7 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
            </View>
          )
        }
        <View style={fc.grad} />
        {r.avg_rating > 0 && (
          <View style={fc.ratingBadge}>
            <Text style={fc.ratingTxt}>★ {Number(r.avg_rating).toFixed(1)}</Text>
          </View>
        )}
        <TouchableOpacity style={fc.heartBtn} onPress={onRemove} disabled={removing}>
          <Text style={{ fontSize: removing ? 11 : 14, color: colors.textDim }}>{removing ? '···' : '❤️'}</Text>
        </TouchableOpacity>
      </View>

      <View style={fc.info}>
        <Text style={fc.cuisine} numberOfLines={1}>
          {(r.cuisine_type || '').replace(/_/g,' ')}
          {r.quartier ? ` · ${r.quartier}` : ''}
        </Text>
        <Text style={fc.name} numberOfLines={1}>{r.name || '—'}</Text>
        <View style={fc.bottom}>
          <Text style={fc.price}>
            {r.avg_ticket > 0 ? `${r.avg_ticket.toLocaleString('fr-FR')} DA` : '—'}
          </Text>
          <TouchableOpacity style={fc.reserveBtn} onPress={onReserve}>
            <Text style={fc.reserveTxt}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const fc = StyleSheet.create({
  card:        { width: CARD_W, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  photoWrap:   { height: 130, backgroundColor: colors.cardHover },
  grad:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, backgroundColor: 'rgba(15,13,11,0.5)' },
  ratingBadge: { position: 'absolute', bottom: spacing.md, left: spacing.md, backgroundColor: 'rgba(15,13,11,0.82)', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs+1, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  ratingTxt:   { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  heartBtn:    { position: 'absolute', top: spacing.md, right: spacing.md, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(15,13,11,0.75)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  info:        { padding: spacing.lg },
  cuisine:     { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 1.5, marginBottom: 2, textTransform: 'uppercase' },
  name:        { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular, letterSpacing: 0.2, marginBottom: spacing.md },
  bottom:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price:       { color: colors.textMuted, fontSize: typography.size.sm },
  reserveBtn:  { backgroundColor: colors.accentSoft, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  reserveTxt:  { color: colors.accent, fontSize: typography.size.xs, fontWeight: typography.weight.medium },
});

/* ─── Écran principal ─── */
export default function FavorisScreen({ navigation }) {
  const [favorites,  setFavorites]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId,     setUserId]     = useState(null);
  const [removing,   setRemoving]   = useState(new Set());
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState('recent');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      const { data: row } = await supabase.from('users').select('id').eq('auth_id', u.id).single();
      if (row) setUserId(row.id);
    })();
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (!userId) return;
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id, created_at, restaurant_id, restaurants(id, name, cuisine_type, quartier, city, avg_rating, avg_ticket, photo_url, photos, review_count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setFavorites(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const removeFavorite = useCallback((fav) => {
    Alert.alert(
      'Retirer des favoris',
      `Retirer ${fav.restaurants?.name || 'ce restaurant'} de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer', style: 'destructive',
          onPress: async () => {
            setRemoving(prev => new Set(prev).add(fav.id));
            try {
              await supabase.from('favorites').delete().eq('id', fav.id);
              setFavorites(prev => prev.filter(f => f.id !== fav.id));
            } finally {
              setRemoving(prev => { const next = new Set(prev); next.delete(fav.id); return next; });
            }
          },
        },
      ]
    );
  }, []);

  const filtered = useMemo(() => favorites
    .filter(f => {
      if (!search) return true;
      const q = search.toLowerCase();
      const r = f.restaurants || {};
      return (r.name || '').toLowerCase().includes(q)
        || (r.cuisine_type || '').toLowerCase().includes(q)
        || (r.quartier || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'rating') return (b.restaurants?.avg_rating || 0) - (a.restaurants?.avg_rating || 0);
      if (sort === 'alpha')  return (a.restaurants?.name || '').localeCompare(b.restaurants?.name || '');
      return 0;
    }), [favorites, search, sort]);

  const rows = useMemo(() => {
    const out = [];
    for (let i = 0; i < filtered.length; i += 2) {
      out.push([filtered[i], filtered[i + 1] || null]);
    }
    return out;
  }, [filtered]);

  const avgRating = useMemo(
    () => favorites.length > 0
      ? (favorites.reduce((acc, f) => acc + (f.restaurants?.avg_rating || 0), 0) / favorites.length).toFixed(1)
      : '—',
    [favorites],
  );

  const cuisineCount = useMemo(
    () => [...new Set(favorites.map(f => f.restaurants?.cuisine_type).filter(Boolean))].length,
    [favorites],
  );

  return (
    <SafeAreaView style={s.root}>

      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>MES PRÉFÉRÉS</Text>
          <Text style={s.headerTitle}>Favoris</Text>
        </View>
        {!loading && favorites.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countTxt}>❤️  {favorites.length}</Text>
          </View>
        )}
      </View>

      {!loading && favorites.length > 0 && (
        <View style={s.controls}>
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Chercher dans mes favoris…"
              placeholderTextColor={colors.textDim}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: colors.textDim, fontSize: typography.size.bodyLg }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={s.sortBtn}
            onPress={() => setSort(cur => {
              const idx = SORT_OPTIONS.findIndex(o => o.id === cur);
              return SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].id;
            })}
          >
            <Text style={s.sortTxt}>{SORT_OPTIONS.find(o => o.id === sort)?.label}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : favorites.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🤍</Text>
          <Text style={s.emptyTitle}>Aucun favori</Text>
          <Text style={s.emptySub}>Appuyez sur ❤️ sur la page d'un restaurant{'\n'}pour l'ajouter ici.</Text>
          <TouchableOpacity style={s.exploreBtn} onPress={() => navigation.navigate('Explorer')}>
            <Text style={s.exploreBtnTxt}>EXPLORER LES RESTAURANTS</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 36 }}>🔍</Text>
          <Text style={s.emptyTitle}>Aucun résultat</Text>
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: colors.blue, fontSize: typography.size.bodyLg }}>Effacer la recherche</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
        >
          <View style={s.statStrip}>
            <View style={s.statItem}>
              <Text style={s.statVal}>{favorites.length}</Text>
              <Text style={s.statLbl}>Favoris</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={s.statVal}>{avgRating}</Text>
              <Text style={s.statLbl}>Note moy.</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={s.statVal}>{cuisineCount}</Text>
              <Text style={s.statLbl}>Cuisines</Text>
            </View>
          </View>

          {rows.map((row, ri) => (
            <View key={ri} style={s.row}>
              {row.map((fav, ci) => fav ? (
                <FavCard
                  key={fav.id}
                  fav={fav}
                  index={ri * 2 + ci}
                  removing={removing.has(fav.id)}
                  onPress={() => navigation.navigate('Restaurant', { restaurant: fav.restaurants || {} })}
                  onReserve={() => navigation.navigate('ReservationForm', { restaurant: fav.restaurants || {} })}
                  onRemove={() => removeFavorite(fav)}
                />
              ) : (
                <View key="empty" style={{ width: CARD_W }} />
              ))}
            </View>
          ))}

          <View style={s.recentSection}>
            <Text style={s.recentLabel}>HISTORIQUE DES AJOUTS</Text>
            {[...favorites].slice(0, 5).map(fav => (
              <View key={fav.id} style={s.recentRow}>
                <Text style={s.recentEmoji}>{CUISINE_EMOJI[fav.restaurants?.cuisine_type] || '🍽️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.recentName} numberOfLines={1}>{fav.restaurants?.name || '—'}</Text>
                  <Text style={s.recentTime}>{timeAdded(fav.created_at)}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Restaurant', { restaurant: fav.restaurants || {} })}>
                  <Text style={s.recentArrow}>›</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xxxl, paddingTop: 56, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  headerSub:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: 2 },
  headerTitle: { color: colors.text, fontSize: typography.size.hero, fontWeight: typography.weight.regular, letterSpacing: 1 },
  countBadge:  { backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  countTxt:    { color: colors.accent, fontSize: typography.size.bodyLg },

  controls:    { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  searchBar:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md+1, borderWidth: 1, borderColor: colors.cardBorder },
  searchIcon:  { fontSize: 13 },
  searchInput: { flex: 1, color: colors.text, fontSize: typography.size.bodyLg },
  sortBtn:     { backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md+1, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center' },
  sortTxt:     { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.medium },

  statStrip:   { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, marginHorizontal: spacing.xxl, marginBottom: spacing.xl },
  statItem:    { flex: 1, alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.xxs },
  statVal:     { color: colors.text, fontSize: typography.size.heading1, fontWeight: typography.weight.regular },
  statLbl:     { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 1 },
  statDiv:     { width: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.md },

  grid:        { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  row:         { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },

  recentSection: { marginTop: spacing.md },
  recentLabel:   { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 4, marginBottom: spacing.lg },
  recentRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  recentEmoji:   { fontSize: 22, width: 32, textAlign: 'center' },
  recentName:    { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular, marginBottom: 2 },
  recentTime:    { color: colors.textDim, fontSize: typography.size.caption },
  recentArrow:   { color: colors.textDim, fontSize: 22, fontWeight: typography.weight.regular },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: 40 },
  emptyEmoji:   { fontSize: 56 },
  emptyTitle:   { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.5 },
  emptySub:     { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 20 },
  exploreBtn:   { backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: 13, paddingHorizontal: spacing.xxxl, marginTop: spacing.md },
  exploreBtnTxt:{ color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.medium, letterSpacing: 2 },
});
