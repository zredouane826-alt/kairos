import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, TextInput, Image, ActivityIndicator, Keyboard, ScrollView,
} from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.25)',
};

const CITIES = [
  { id: 'all',         label: 'Toutes' },
  { id: 'alger',       label: 'Alger' },
  { id: 'oran',        label: 'Oran' },
  { id: 'constantine', label: 'Constantine' },
  { id: 'tizi_ouzou',  label: 'Tizi Ouzou' },
  { id: 'bejaia',      label: 'Béjaïa' },
  { id: 'setif',       label: 'Sétif' },
  { id: 'annaba',      label: 'Annaba' },
  { id: 'tlemcen',     label: 'Tlemcen' },
];

const SUGGESTIONS = [
  { label: 'Couscous',      q: 'algerien',    emoji: '🥘' },
  { label: 'Pizzeria',      q: 'italien',     emoji: '🍕' },
  { label: 'Fruits de mer', q: 'mediterraneen', emoji: '🐟' },
  { label: 'Japonais',      q: 'japonais',    emoji: '🍣' },
  { label: 'Turc',          q: 'turc',        emoji: '🍢' },
  { label: 'Libanais',      q: 'libanais',    emoji: '🌿' },
];

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

export default function SearchScreen({ navigation }) {
  const inputRef = useRef(null);
  const [query,      setQuery]      = useState('');
  const [city,       setCity]       = useState('all');
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);

  // Auto-focus à l'ouverture
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // Recherche debouncée
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setSearched(false); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      let req = supabase
        .from('restaurants')
        .select('id, name, cuisine_type, quartier, city, avg_rating, avg_ticket, photos')
        .eq('status', 'active')
        .or(`name.ilike.%${q}%,cuisine_type.ilike.%${q}%,quartier.ilike.%${q}%`)
        .limit(25);

      if (city !== 'all') req = req.eq('city', city);

      const { data } = await req;
      setResults(data ?? []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, city]);

  const searchSuggestion = (q) => {
    setQuery(q);
    Keyboard.dismiss();
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const renderCard = useCallback(({ item: r, index }) => {
    const photo = r.photos?.[0];
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => { Keyboard.dismiss(); navigation.navigate('Restaurant', { restaurant: r }); }}
        activeOpacity={0.85}
      >
        <View style={s.cardThumb}>
          {photo
            ? <Image source={{ uri: photo }} style={s.cardPhoto} resizeMode="cover" />
            : <Text style={s.cardEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
          }
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardCuisine}>
            {r.cuisine_type?.toUpperCase()}
            {r.quartier ? '  ·  ' + r.quartier : ''}
            {r.city ? '  ·  ' + r.city.charAt(0).toUpperCase() + r.city.slice(1) : ''}
          </Text>
          <Text style={s.cardName} numberOfLines={1}>{r.name}</Text>
          <View style={s.cardMeta}>
            <Text style={s.cardRating}>⭐ {r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1) : '—'}</Text>
            <Text style={s.cardSep}>·</Text>
            <Text style={s.cardPrice}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—'}</Text>
          </View>
        </View>
        <Text style={s.cardArrow}>›</Text>
      </TouchableOpacity>
    );
  }, []);

  return (
    <SafeAreaView style={s.root}>

      {/* ── Barre de recherche ── */}
      <View style={s.searchBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.inputWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Restaurant, cuisine, quartier…"
            placeholderTextColor={C.dimmer}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery} style={s.clearBtn}>
              <Text style={s.clearBtnTxt}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filtres ville ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cityRow}>
        {CITIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[s.cityChip, city === c.id && s.cityChipOn]}
            onPress={() => setCity(c.id)}
          >
            <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Contenu ── */}
      {!query.trim() ? (
        /* État initial : suggestions */
        <View style={s.suggestionsWrap}>
          <Text style={s.suggestTitle}>EXPLORER PAR CUISINE</Text>
          <View style={s.suggestGrid}>
            {SUGGESTIONS.map((s_) => (
              <TouchableOpacity
                key={s_.q}
                style={s.suggestCard}
                onPress={() => searchSuggestion(s_.q)}
              >
                <Text style={s.suggestEmoji}>{s_.emoji}</Text>
                <Text style={s.suggestLabel}>{s_.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : results.length === 0 && searched ? (
        /* Aucun résultat */
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🍽️</Text>
          <Text style={s.emptyTitle}>Aucun résultat</Text>
          <Text style={s.emptySub}>Essayez un autre nom, quartier{'\n'}ou type de cuisine</Text>
        </View>
      ) : (
        /* Résultats */
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          renderItem={renderCard}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={s.resultCount}>{results.length} résultat{results.length > 1 ? 's' : ''}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },

  /* Barre */
  searchBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:    { color: C.text, fontSize: 16 },
  inputWrap:     { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg2, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 44, gap: 8 },
  searchIcon:    { fontSize: 15 },
  input:         { flex: 1, color: C.text, fontSize: 15, fontWeight: '300' },
  clearBtn:      { width: 24, height: 24, borderRadius: 12, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center' },
  clearBtnTxt:   { color: C.dimmer, fontSize: 11 },

  /* Ville chips */
  cityRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  cityChip:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: C.bg2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  cityChipOn:    { backgroundColor: C.accent, borderColor: C.accent },
  cityTxt:       { color: C.text, fontSize: 12 },
  cityTxtOn:     { color: C.bg, fontWeight: '600' },

  /* Suggestions */
  suggestionsWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  suggestTitle:  { color: C.dimmer, fontSize: 10, letterSpacing: 3, marginBottom: 16 },
  suggestGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  suggestCard:   { width: '30%', backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center', paddingVertical: 18, gap: 8 },
  suggestEmoji:  { fontSize: 28 },
  suggestLabel:  { color: C.dim, fontSize: 11, textAlign: 'center' },

  /* État centre */
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { color: C.text, fontSize: 18, fontWeight: '300' },
  emptySub:      { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  /* Résultats */
  list:          { paddingBottom: 40 },
  resultCount:   { color: C.dimmer, fontSize: 11, letterSpacing: 2, paddingHorizontal: 16, paddingVertical: 12 },
  card:          { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  cardThumb:     { width: 68, height: 68, borderRadius: 14, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  cardPhoto:     { width: 68, height: 68 },
  cardEmoji:     { fontSize: 28 },
  cardInfo:      { flex: 1, gap: 4 },
  cardCuisine:   { color: C.accent, fontSize: 9, letterSpacing: 2 },
  cardName:      { color: C.text, fontSize: 15, fontWeight: '300' },
  cardMeta:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardRating:    { color: C.accent, fontSize: 12 },
  cardSep:       { color: C.dimmer, fontSize: 12 },
  cardPrice:     { color: C.dim, fontSize: 12 },
  cardArrow:     { color: C.dimmer, fontSize: 22, fontWeight: '300' },
});
