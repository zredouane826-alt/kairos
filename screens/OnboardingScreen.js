import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

const C = {
  bg: '#0d1628', accent: '#c8975a', text: '#f0ece4',
  dim: '#8a9ab0', card: '#111827',
  borderAccent: 'rgba(200,151,90,0.25)',
  bgAccent: 'rgba(200,151,90,0.08)',
};

export default function OnboardingScreen({ onSelect }) {
  return (
    <SafeAreaView style={s.root}>
      <View style={s.inner}>

        <View style={s.brand}>
          <Text style={s.logo}>MIDA</Text>
          <Text style={s.tagline}>La bonne table, au bon moment.</Text>
        </View>

        <View style={s.cards}>
          <TouchableOpacity style={s.card} activeOpacity={0.82} onPress={() => onSelect('client')}>
            <Text style={s.emoji}>🔍</Text>
            <Text style={s.cardTitle}>Je cherche une table</Text>
            <Text style={s.cardDesc}>
              Découvrez et réservez les meilleurs restaurants d'Alger
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.card, s.cardPro]}
            activeOpacity={0.82}
            onPress={() => onSelect('pro')}
          >
            <Text style={s.emoji}>🍽️</Text>
            <Text style={[s.cardTitle, s.cardTitlePro]}>J'ai un restaurant</Text>
            <Text style={s.cardDesc}>
              Gérez vos réservations et votre visibilité sur MIDA
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },

  brand:   { alignItems: 'center', marginBottom: 52 },
  logo:    { color: C.accent, fontSize: 36, fontWeight: '300', letterSpacing: 10, marginBottom: 6 },
  tagline: { color: C.dim, fontSize: 12, fontStyle: 'italic', letterSpacing: 1 },

  cards:    { width: '100%', gap: 16 },
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  cardPro: {
    backgroundColor: C.bgAccent,
  },

  emoji:        { fontSize: 32 },
  cardTitle:    { color: C.text,   fontSize: 18, fontWeight: '300', letterSpacing: 0.5 },
  cardTitlePro: { color: C.accent },
  cardDesc:     { color: C.dim,    fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
