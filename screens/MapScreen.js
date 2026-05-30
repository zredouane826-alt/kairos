import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';

let MapView, Marker;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
}

// ─── Map config ───────────────────────────────────────────────────────────────
const ALGER = { latitude: 36.7538, longitude: 3.0588 };
const INITIAL_REGION = { ...ALGER, latitudeDelta: 0.12, longitudeDelta: 0.12 };

const CUISINE_EMOJI = {
  algerien: '🥘', mediterraneen: '🐟', fast_casual: '☕',
  italien: '🍕', japonais: '🍣', turc: '🍢',
};

// Fallback coordinates by quartier when DB rows have no GPS
const QUARTIER_COORDS = {
  'hydra':           { latitude: 36.7539, longitude: 3.0427 },
  'bab el oued':     { latitude: 36.7900, longitude: 3.0573 },
  'el biar':         { latitude: 36.7614, longitude: 3.0364 },
  'didouche mourad': { latitude: 36.7625, longitude: 3.0521 },
  'telemly':         { latitude: 36.7700, longitude: 3.0500 },
  'ben aknoun':      { latitude: 36.7611, longitude: 3.0157 },
  'bir mourad rais': { latitude: 36.7381, longitude: 3.0521 },
  'el harrach':      { latitude: 36.7197, longitude: 3.1350 },
  'cheraga':         { latitude: 36.7669, longitude: 2.9605 },
  'dely ibrahim':    { latitude: 36.7608, longitude: 2.9843 },
  'kouba':           { latitude: 36.7186, longitude: 3.0906 },
};

// Deterministic scatter so markers sharing the same fallback don't overlap
function scatter(id, axis) {
  return (((id * (axis === 0 ? 7919 : 6271)) % 1000) / 1000 - 0.5) * 0.005;
}

function getCoordinate(r) {
  if (r.latitude && r.longitude) {
    return { latitude: r.latitude, longitude: r.longitude };
  }
  const key = (r.quartier || '').toLowerCase();
  const base = QUARTIER_COORDS[key] || ALGER;
  const seed = typeof r.id === 'number' ? r.id : 0;
  return {
    latitude:  base.latitude  + scatter(seed, 1),
    longitude: base.longitude + scatter(seed, 0),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected]       = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, cuisine_type, quartier, avg_rating, avg_ticket, latitude, longitude');
        if (data) setRestaurants(data);
        if (error) console.warn('[MapScreen]', error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMarkerPress = useCallback((r) => {
    setSelected(prev => (prev?.id === r.id ? null : r));
    mapRef.current?.animateToRegion(
      { ...getCoordinate(r), latitudeDelta: 0.04, longitudeDelta: 0.04 },
      350,
    );
  }, []);

  const closeCard   = useCallback(() => setSelected(null), []);
  const goSelected  = useCallback(() => navigation.navigate('Restaurant', { restaurant: selected }), [navigation, selected]);

  /* Web fallback */
  if (Platform.OS === 'web') {
    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
          <Text style={{ fontSize: 48 }}>🗺️</Text>
          <Text style={{ color: colors.accent, fontSize: 20, fontWeight: '600', letterSpacing: 4 }}>CARTE</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            La carte interactive est disponible sur l'application mobile.
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <View style={{ backgroundColor: colors.accentSoft, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', padding: 14, width: '100%' }}>
              <Text style={{ color: colors.accent, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>RESTAURANTS DISPONIBLES</Text>
              {restaurants.slice(0, 6).map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}
                  onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
                >
                  <Text style={{ fontSize: 18 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13 }}>{r.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{r.quartier || '—'}</Text>
                  </View>
                  {r.avg_rating > 0 && <Text style={{ color: colors.accent, fontSize: 11 }}>★ {Number(r.avg_rating).toFixed(1)}</Text>}
                </TouchableOpacity>
              ))}
              {restaurants.length > 6 && (
                <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 8 }}>+{restaurants.length - 6} autres</Text>
              )}
            </View>
          )}
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.root}>

      {/* ── Map ──────────────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        {restaurants.map((r) => (
          <Marker
            key={String(r.id)}
            coordinate={getCoordinate(r)}
            tracksViewChanges={false}
            onPress={() => handleMarkerPress(r)}
          >
            <View style={[s.pin, selected?.id === r.id && s.pinActive]}>
              <Text style={[s.pinEmoji, selected?.id === r.id && s.pinEmojiLg]}>
                {CUISINE_EMOJI[r.cuisine_type] || '🍽️'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── Header overlay ───────────────────────────────────────────── */}
      <SafeAreaView style={s.headerWrap} pointerEvents="box-none">
        <View style={s.header}>
          <View>
            <Text style={s.headerLogo}>MIDA</Text>
            <Text style={s.headerSub}>Alger</Text>
          </View>
          <View style={s.countBadge}>
            <View style={s.countDot} />
            <Text style={s.countTxt}>
              {loading ? '…' : restaurants.length + ' tables'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Spinner ──────────────────────────────────────────────────── */}
      {loading && (
        <View style={s.spinner}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      )}

      {/* ── Selected restaurant card ─────────────────────────────────── */}
      {selected && (
        <View style={s.cardWrap}>
          <TouchableOpacity
            style={s.card}
            activeOpacity={0.88}
            onPress={goSelected}
          >
            <View style={s.cardThumb}>
              <Text style={s.cardEmoji}>
                {CUISINE_EMOJI[selected.cuisine_type] || '🍽️'}
              </Text>
            </View>

            <View style={s.cardInfo}>
              <Text style={s.cardTag}>
                {selected.cuisine_type ? selected.cuisine_type.toUpperCase() : '—'}
              </Text>
              <Text style={s.cardName} numberOfLines={1}>{selected.name}</Text>
              <Text style={s.cardAddr} numberOfLines={1}>
                {'📍 ' + (selected.quartier || 'Alger')}
              </Text>
              {selected.avg_rating > 0 ? (
                <Text style={s.cardRating}>{'★ ' + Number(selected.avg_rating).toFixed(1)}</Text>
              ) : null}
            </View>

            <View style={s.cardArrow}>
              <Text style={s.cardArrowTxt}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.closeBtn} onPress={closeCard}>
            <Text style={s.closeBtnTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  map:  { flex: 1 },

  /* Marker */
  pin: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(15,13,11,0.9)',
    borderWidth: 2, borderColor: colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  pinActive: {
    borderColor: colors.accent, borderWidth: 2.5,
    backgroundColor: colors.card,
    width: 46, height: 46, borderRadius: 23,
  },
  pinEmoji:   { fontSize: 18 },
  pinEmojiLg: { fontSize: 22 },

  /* Header */
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: spacing.xl, marginTop: spacing.lg,
    backgroundColor: 'rgba(15,13,11,0.92)',
    borderRadius: radius.xxl, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  headerLogo: { color: colors.accent, fontSize: typography.size.heading2, fontWeight: '700', letterSpacing: 5 },
  headerSub:  { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 1 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)',
  },
  countDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  countTxt:  { color: colors.accent, fontSize: typography.size.caption, fontWeight: '500' },

  /* Spinner */
  spinner: {
    position: 'absolute', bottom: 140, alignSelf: 'center',
    backgroundColor: 'rgba(15,13,11,0.92)',
    borderRadius: radius.full, padding: spacing.lg,
  },

  /* Restaurant card */
  cardWrap: {
    position: 'absolute', bottom: 110, left: spacing.xl, right: spacing.xl,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xxl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)',
    padding: spacing.xl, gap: spacing.lg,
  },
  cardThumb: {
    width: 50, height: 50, borderRadius: radius.xl,
    backgroundColor: colors.cardHover,
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 24 },
  cardInfo:  { flex: 1 },
  cardTag:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 2.5, marginBottom: 3 },
  cardName:  { color: colors.text,   fontSize: typography.size.heading3, fontWeight: '400', marginBottom: 3 },
  cardAddr:  { color: colors.textMuted, fontSize: typography.size.caption, marginBottom: 4 },
  cardRating:{ color: colors.accent, fontSize: typography.size.caption, fontWeight: '500' },
  cardArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  cardArrowTxt: { color: colors.bg, fontSize: 20, fontWeight: '700', marginTop: -1 },

  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnTxt: { color: colors.textMuted, fontSize: typography.size.bodyLg },
});
