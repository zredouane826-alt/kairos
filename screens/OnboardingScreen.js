import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Dimensions, Animated,
} from 'react-native';

const SW = Dimensions.get('window').width;
const SH = Dimensions.get('window').height;

const C = {
  bg: '#0d1628', bg2: '#111827', bg3: '#1a2332',
  accent: '#c8975a', accent2: '#4a7fa5',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#4a5568',
  green: '#3d9970',
  border: 'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(200,151,90,0.3)',
};

const SLIDES = [
  {
    emoji: '🏆',
    bg: '#0f1e12',
    accentColor: '#3d9970',
    tag: 'BIENVENUE',
    title: 'La meilleure\ntable vous attend',
    sub: 'MIDA sélectionne les restaurants d\'exception à Alger, Oran et Constantine.',
    deco: ['✦', '✧', '✦'],
  },
  {
    emoji: '🗺️',
    bg: '#0d1628',
    accentColor: '#4a7fa5',
    tag: '35+ RESTAURANTS',
    title: 'Découvrez\nles meilleures adresses',
    sub: 'Gastronomie, cuisine du monde, terrasses en vue — filtrez par ville, quartier ou cuisine.',
    deco: ['◆', '◇', '◆'],
  },
  {
    emoji: '📅',
    bg: '#1a1208',
    accentColor: '#c8975a',
    tag: 'RÉSERVATION SIMPLE',
    title: 'Réservez\nen quelques secondes',
    sub: 'Date, heure, nombre de personnes. Confirmation instantanée, rappel automatique.',
    deco: ['★', '☆', '★'],
  },
];

const CITIES = [
  { id: 'alger',       label: 'Alger',       emoji: '🏛️' },
  { id: 'oran',        label: 'Oran',         emoji: '🌊' },
  { id: 'constantine', label: 'Constantine',  emoji: '🌉' },
];

export default function OnboardingScreen({ onSelect }) {
  const [step, setStep]       = useState(0); // 0-2: slides  3: ville  4: rôle
  const [city, setCity]       = useState(null);
  const fadeAnim              = useRef(new Animated.Value(1)).current;
  const slideAnim             = useRef(new Animated.Value(0)).current;

  const TOTAL_DOTS = 5; // 3 slides + ville + rôle

  function goTo(next) {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  }

  const next = () => goTo(step + 1);
  const skip = () => goTo(4);

  /* ── Slide intro ── */
  if (step <= 2) {
    const sl = SLIDES[step];
    return (
      <SafeAreaView style={[s.root, { backgroundColor: sl.bg }]}>
        <Animated.View style={[s.slideWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Décorations de fond */}
          <View style={s.decoRow}>
            {sl.deco.map((d, i) => (
              <Text key={i} style={[s.decoChar, { color: sl.accentColor + '40', fontSize: i === 1 ? 80 : 40 }]}>{d}</Text>
            ))}
          </View>

          {/* Tag */}
          <View style={[s.tag, { borderColor: sl.accentColor + '50', backgroundColor: sl.accentColor + '12' }]}>
            <Text style={[s.tagTxt, { color: sl.accentColor }]}>{sl.tag}</Text>
          </View>

          {/* Emoji principal */}
          <View style={[s.emojiWrap, { backgroundColor: sl.accentColor + '15', borderColor: sl.accentColor + '30' }]}>
            <Text style={s.mainEmoji}>{sl.emoji}</Text>
          </View>

          {/* Texte */}
          <Text style={s.slideTitle}>{sl.title}</Text>
          <Text style={s.slideSub}>{sl.sub}</Text>

          {/* Logo */}
          <Text style={[s.logoSmall, { color: sl.accentColor }]}>MIDA</Text>

        </Animated.View>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.dots}>
            {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
              <View key={i} style={[s.dot, i === step && { backgroundColor: sl.accentColor, width: 20 }]} />
            ))}
          </View>
          <View style={s.footerBtns}>
            <TouchableOpacity style={s.skipBtn} onPress={skip}>
              <Text style={s.skipTxt}>Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.nextBtn, { backgroundColor: sl.accentColor }]} onPress={next}>
              <Text style={s.nextTxt}>{step === 2 ? 'Commencer' : 'Suivant  →'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Étape 3 : Choisir sa ville ── */
  if (step === 3) {
    return (
      <SafeAreaView style={s.root}>
        <Animated.View style={[s.stepWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          <View style={s.stepHeader}>
            <Text style={s.stepTag}>VOTRE VILLE</Text>
            <Text style={s.stepTitle}>Où êtes-vous ?</Text>
            <Text style={s.stepSub}>Sélectionnez votre ville pour voir{'\n'}les restaurants à proximité.</Text>
          </View>

          <View style={s.cityCards}>
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[s.cityCard, city === c.id && s.cityCardOn]}
                onPress={() => setCity(c.id)}
                activeOpacity={0.8}
              >
                <Text style={s.cityEmoji}>{c.emoji}</Text>
                <Text style={[s.cityLabel, city === c.id && s.cityLabelOn]}>{c.label}</Text>
                {city === c.id && <View style={s.cityCheck}><Text style={s.cityCheckTxt}>✓</Text></View>}
              </TouchableOpacity>
            ))}
          </View>

        </Animated.View>

        <View style={s.footer}>
          <View style={s.dots}>
            {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
              <View key={i} style={[s.dot, i === 3 && { backgroundColor: C.accent, width: 20 }]} />
            ))}
          </View>
          <View style={s.footerBtns}>
            <TouchableOpacity style={s.skipBtn} onPress={() => goTo(4)}>
              <Text style={s.skipTxt}>Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.nextBtn, !city && s.nextBtnDim]}
              onPress={() => city && goTo(4)}
              disabled={!city}
            >
              <Text style={s.nextTxt}>Continuer  →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Étape 4 : Choisir son rôle ── */
  return (
    <SafeAreaView style={s.root}>
      <Animated.View style={[s.stepWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        <View style={s.stepHeader}>
          <Text style={s.logoMain}>MIDA</Text>
          <Text style={s.stepTitle}>Vous êtes…</Text>
          <Text style={s.stepSub}>Choisissez votre profil pour continuer.</Text>
        </View>

        <View style={s.roleCards}>
          <TouchableOpacity
            style={s.roleCard}
            activeOpacity={0.82}
            onPress={() => onSelect('client')}
          >
            <View style={s.roleIconWrap}>
              <Text style={s.roleEmoji}>🍽️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.roleTitle}>Je cherche une table</Text>
              <Text style={s.roleDesc}>Découvrir, réserver et savourer les meilleures adresses</Text>
            </View>
            <Text style={s.roleArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.roleCard, s.roleCardPro]}
            activeOpacity={0.82}
            onPress={() => onSelect('pro')}
          >
            <View style={[s.roleIconWrap, s.roleIconWrapPro]}>
              <Text style={s.roleEmoji}>📊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.roleTitle, s.roleTitlePro]}>J'ai un restaurant</Text>
              <Text style={s.roleDesc}>Gérer mes réservations et ma visibilité sur MIDA</Text>
            </View>
            <Text style={[s.roleArrow, { color: C.accent }]}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.legal}>En continuant, vous acceptez nos{'\n'}conditions d'utilisation et notre politique de confidentialité.</Text>

      </Animated.View>

      <View style={[s.footer, { paddingBottom: 8 }]}>
        <View style={s.dots}>
          {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
            <View key={i} style={[s.dot, i === 4 && { backgroundColor: C.accent, width: 20 }]} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },

  /* Slide intro */
  slideWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  decoRow:     { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 32, opacity: 0.6 },
  decoChar:    { fontWeight: '300' },
  tag:         { borderRadius: 100, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 28 },
  tagTxt:      { fontSize: 10, letterSpacing: 3, fontWeight: '500' },
  emojiWrap:   { width: 110, height: 110, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  mainEmoji:   { fontSize: 52 },
  slideTitle:  { color: C.text, fontSize: 30, fontWeight: '200', letterSpacing: 0.5, textAlign: 'center', lineHeight: 38, marginBottom: 16 },
  slideSub:    { color: C.dim, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  logoSmall:   { fontSize: 13, fontWeight: '700', letterSpacing: 6 },

  /* Étapes */
  stepWrap:    { flex: 1, paddingHorizontal: 28, paddingTop: 20 },
  stepHeader:  { alignItems: 'center', marginBottom: 36 },
  stepTag:     { color: C.accent, fontSize: 10, letterSpacing: 3, marginBottom: 12 },
  stepTitle:   { color: C.text, fontSize: 28, fontWeight: '200', letterSpacing: 0.5, marginBottom: 10, textAlign: 'center' },
  stepSub:     { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  logoMain:    { color: C.accent, fontSize: 28, fontWeight: '300', letterSpacing: 10, marginBottom: 20 },

  /* Ville */
  cityCards:   { gap: 14 },
  cityCard:    { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.bg2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 20 },
  cityCardOn:  { borderColor: C.accent, backgroundColor: 'rgba(200,151,90,0.08)' },
  cityEmoji:   { fontSize: 30 },
  cityLabel:   { color: C.dim, fontSize: 17, fontWeight: '300' },
  cityLabelOn: { color: C.text },
  cityCheck:   { marginLeft: 'auto', width: 24, height: 24, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  cityCheckTxt:{ color: C.bg, fontSize: 13, fontWeight: '700' },

  /* Rôle */
  roleCards:   { gap: 14 },
  roleCard:    { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.bg2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 20 },
  roleCardPro: { borderColor: C.borderAccent, backgroundColor: 'rgba(200,151,90,0.06)' },
  roleIconWrap:    { width: 52, height: 52, borderRadius: 14, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleIconWrapPro: { backgroundColor: 'rgba(200,151,90,0.12)' },
  roleEmoji:   { fontSize: 24 },
  roleTitle:   { color: C.text, fontSize: 16, fontWeight: '300', marginBottom: 4 },
  roleTitlePro:{ color: C.accent },
  roleDesc:    { color: C.dim, fontSize: 11, lineHeight: 16 },
  roleArrow:   { color: C.dimmer, fontSize: 24, fontWeight: '300' },
  legal:       { color: C.dimmer, fontSize: 10, textAlign: 'center', lineHeight: 16, marginTop: 28 },

  /* Footer commun */
  footer:      { paddingHorizontal: 28, paddingBottom: 24, gap: 16 },
  dots:        { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: C.dimmer },
  footerBtns:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn:     { paddingVertical: 10, paddingHorizontal: 4 },
  skipTxt:     { color: C.dimmer, fontSize: 14 },
  nextBtn:     { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24 },
  nextBtnDim:  { backgroundColor: C.dimmer },
  nextTxt:     { color: C.bg, fontSize: 14, fontWeight: '500' },
});
