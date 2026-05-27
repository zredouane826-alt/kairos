import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.35)',
};

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

const CARD_BG = ['#1a2e1a','#1a1e2e','#2e2a1a','#2a1a2e','#1a2a2e','#2e1a1a'];

export default function FavorisScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [userId, setUserId]       = useState(null);
  const [removing, setRemoving]   = useState(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      supabase.from('users').select('id').eq('auth_id', u.id).single()
        .then(({ data: row }) => { if (row) setUserId(row.id); });
    });
  }, []);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from('favorites')
      .select('id, restaurant_id, restaurants(id, name, cuisine_type, quartier, avg_rating, avg_ticket, photos)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setFavorites(data ?? []);
        setLoading(false);
      });
  }, [userId]));

  const removeFavorite = async (favId) => {
    setRemoving(prev => new Set(prev).add(favId));
    await supabase.from('favorites').delete().eq('id', favId);
    setFavorites(prev => prev.filter(f => f.id !== favId));
    setRemoving(prev => { const s = new Set(prev); s.delete(favId); return s; });
  };

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>mes préférés</Text>
          <Text style={s.headerTitle}>Favoris</Text>
        </View>
        {!loading && favorites.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countTxt}>{favorites.length} restaurant{favorites.length > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.accent} /></View>
      ) : favorites.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🤍</Text>
          <Text style={s.emptyTitle}>Aucun favori</Text>
          <Text style={s.emptySub}>Appuyez sur ❤️ sur la page d'un restaurant{'\n'}pour l'ajouter ici</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
          {favorites.map((fav, i) => {
            const r = fav.restaurants || {};
            const photo = r.photos && r.photos.length > 0 ? r.photos[0] : null;
            return (
              <TouchableOpacity
                key={fav.id}
                style={s.card}
                onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
                activeOpacity={0.85}
              >
                {/* Hero */}
                <View style={[s.cardHero, { backgroundColor: CARD_BG[i % CARD_BG.length] }]}>
                  {photo
                    ? <Image source={{ uri: photo }} style={s.cardPhoto} resizeMode="cover" />
                    : <Text style={s.cardEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
                  }
                  {/* Bouton retirer */}
                  <TouchableOpacity
                    style={s.heartBtn}
                    onPress={() => removeFavorite(fav.id)}
                    disabled={removing.has(fav.id)}
                  >
                    {removing.has(fav.id)
                      ? <ActivityIndicator size={14} color={C.accent} />
                      : <Text style={s.heartTxt}>❤️</Text>
                    }
                  </TouchableOpacity>
                </View>

                {/* Infos */}
                <View style={s.cardBody}>
                  <Text style={s.cardCuisine}>
                    {r.cuisine_type ? r.cuisine_type.toUpperCase() : '—'}
                    {r.quartier ? '  ·  ' + r.quartier : ''}
                  </Text>
                  <Text style={s.cardName} numberOfLines={1}>{r.name || '—'}</Text>
                  <View style={s.cardMeta}>
                    <Text style={s.cardRating}>★ {r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1) : '—'}</Text>
                    <Text style={s.cardSep}>·</Text>
                    <Text style={s.cardPrice}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex:1, backgroundColor:C.bg },
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', paddingHorizontal:24, paddingTop:16, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border },
  headerSub:    { color:C.accent, fontSize:10, fontStyle:'italic', letterSpacing:3, marginBottom:2 },
  headerTitle:  { color:C.text, fontSize:26, fontWeight:'300', letterSpacing:1 },
  countBadge:   { backgroundColor:'rgba(200,151,90,0.1)', borderRadius:100, paddingHorizontal:12, paddingVertical:5, borderWidth:1, borderColor:C.borderAccent },
  countTxt:     { color:C.accent, fontSize:11 },
  center:       { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  emptyEmoji:   { fontSize:52 },
  emptyTitle:   { color:C.text, fontSize:20, fontWeight:'300', letterSpacing:1 },
  emptySub:     { color:C.dim, fontSize:13, textAlign:'center', lineHeight:20 },
  list:         { paddingHorizontal:20, paddingTop:16, gap:16 },
  card:         { backgroundColor:C.card, borderRadius:18, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  cardHero:     { height:170, alignItems:'center', justifyContent:'center' },
  cardPhoto:    { ...StyleSheet.absoluteFillObject },
  cardEmoji:    { fontSize:52 },
  heartBtn:     { position:'absolute', top:12, right:12, width:36, height:36, borderRadius:18, backgroundColor:'rgba(13,22,40,0.75)', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.1)' },
  heartTxt:     { fontSize:16 },
  cardBody:     { padding:14 },
  cardCuisine:  { color:C.accent, fontSize:8, letterSpacing:2.5, marginBottom:4 },
  cardName:     { color:C.text, fontSize:16, fontWeight:'400', letterSpacing:0.3, marginBottom:6 },
  cardMeta:     { flexDirection:'row', alignItems:'center', gap:6 },
  cardRating:   { color:C.accent, fontSize:12, fontWeight:'500' },
  cardSep:      { color:C.dimmer, fontSize:12 },
  cardPrice:    { color:C.dim, fontSize:12 },
});
