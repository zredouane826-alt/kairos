import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native';

const C = { bg: '#0d1628', bg2: '#111827', accent: '#c8975a', dim: '#8a9ab0', dimmer: '#4a5568', text: '#f0ece4', border: 'rgba(255,255,255,0.07)' };

export default function FavorisScreen() {
  return (
    <SafeAreaView style={s.root}>
      <View style={s.card}>
        <Text style={s.emoji}>🤍</Text>
        <Text style={s.title}>Favoris</Text>
        <Text style={s.sub}>Vos restaurants préférés{'\n'}rassemblés en un seul endroit</Text>
        <View style={s.badge}><Text style={s.badgeTxt}>BIENTÔT</Text></View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  card: { alignItems: 'center', padding: 40, backgroundColor: C.bg2, borderRadius: 24, borderWidth: 1, borderColor: C.border, marginHorizontal: 32 },
  emoji: { fontSize: 52, marginBottom: 20 },
  title: { color: C.text, fontSize: 22, fontWeight: '300', letterSpacing: 3, marginBottom: 10 },
  sub: { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  badge: { backgroundColor: 'rgba(200,151,90,0.12)', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)' },
  badgeTxt: { color: C.accent, fontSize: 10, fontWeight: '600', letterSpacing: 3 },
});
