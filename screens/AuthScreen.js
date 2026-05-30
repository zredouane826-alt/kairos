import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  Animated,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';

function Field({ icon, label, children }) {
  return (
    <View style={f.wrap}>
      {label ? <Text style={f.label}>{label}</Text> : null}
      <View style={f.inner}>
        {icon ? <Text style={f.icon}>{icon}</Text> : null}
        {children}
      </View>
    </View>
  );
}
const f = StyleSheet.create({
  wrap:  { marginBottom: spacing.xl },
  label: { color: colors.textMuted, fontSize: typography.size.xs, letterSpacing: 2, fontWeight: typography.weight.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' },
  inner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.cardBorder, paddingHorizontal: spacing.xl, minHeight: 52 },
  icon:  { fontSize: typography.size.subheading, marginRight: spacing.md, opacity: 0.7 },
});

export default function AuthScreen({ onAuth, userType, onSwitchType }) {
  const isPro = userType === 'pro';
  const [mode,     setMode]     = useState('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [showPwd,       setShowPwd]       = useState(false);
  const [success,       setSuccess]       = useState('');
  const [resetSent,     setResetSent]     = useState(false);
  const [resetLoading,  setResetLoading]  = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shakeX = useMemo(
    () => shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] }),
    [],
  );

  const shake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }, []);

  const switchMode = useCallback((m) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setMode(m); setError(''); setSuccess(''); setResetSent(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, []);

  const sendReset = useCallback(async () => {
    if (!email.trim()) { setError("Entrez votre email d'abord."); shake(); return; }
    setResetLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim());
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  }, [email, shake]);

  const submit = useCallback(async () => {
    if (!email.trim() || !password) { setError('Remplissez tous les champs.'); shake(); return; }
    if (mode === 'signup' && password !== confirm) { setError('Les mots de passe ne correspondent pas.'); shake(); return; }
    if (password.length < 6) { setError('Mot de passe : 6 caractères minimum.'); shake(); return; }

    setLoading(true); setError(''); setSuccess('');

    try {
      if (mode === 'signin') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) { setError(err.message); shake(); }
        else if (data?.session) onAuth(data.session);
        else setError('Connexion échouée. Vérifiez vos identifiants.');
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) {
          if (err.message.toLowerCase().includes('already registered') || err.message.toLowerCase().includes('already been registered')) {
            setError('Cet email est déjà utilisé. Connectez-vous avec votre mot de passe.');
            switchMode('signin');
          } else { setError(err.message); shake(); }
        } else if (data?.session) {
          onAuth(data.session);
        } else {
          const { data: d2 } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (d2?.session) { onAuth(d2.session); }
          else { setSuccess('Compte créé ! Connectez-vous avec vos identifiants.'); switchMode('signin'); }
        }
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
      shake();
    }

    setLoading(false);
  }, [email, password, confirm, mode, shake, switchMode, onAuth]);

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Hero ── */}
          <View style={s.hero}>
            <Animated.View style={[s.heroRingOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={s.heroRingInner}>
                <Text style={s.heroStar}>✦</Text>
              </View>
            </Animated.View>
            <Text style={s.logo}>mida</Text>
            <Text style={s.tagline}>La bonne table, au bon moment.</Text>
          </View>

          {/* Badge rôle pro */}
          {isPro && (
            <View style={s.roleBadge}>
              <Text style={s.roleBadgeTxt}>📊  Espace Restaurateur</Text>
            </View>
          )}

          {/* ── Onglets ── */}
          <View style={s.tabRow}>
            <TouchableOpacity
              style={[s.tabBtn, mode === 'signin' && s.tabBtnOn]}
              onPress={() => switchMode('signin')}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, mode === 'signin' && s.tabTxtOn]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tabBtn, mode === 'signup' && s.tabBtnOn]}
              onPress={() => switchMode('signup')}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, mode === 'signup' && s.tabTxtOn]}>Inscription</Text>
            </TouchableOpacity>
          </View>

          {/* ── Card formulaire ── */}
          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateX: shakeX }] }]}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>
                {mode === 'signin' ? 'Bon retour 👋' : isPro ? 'Créer un compte Pro' : 'Créer un compte'}
              </Text>
              <Text style={s.cardSub}>
                {mode === 'signin'
                  ? 'Connecte-toi à ton compte Mida.'
                  : isPro
                    ? 'Crée ton compte, puis complète ton dossier restaurateur.'
                    : 'Rejoins Mida en quelques secondes.'}
              </Text>
            </View>

            <Field icon="✉️" label="Adresse email">
              <TextInput
                style={s.input}
                placeholder="ton@email.com"
                placeholderTextColor={colors.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </Field>

            <Field icon="🔒" label="Mot de passe">
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textDim}
                secureTextEntry={!showPwd}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.eyeTxt}>{showPwd ? 'Masquer' : 'Afficher'}</Text>
              </TouchableOpacity>
            </Field>

            {mode === 'signup' && (
              <Field icon="✅" label="Confirmer le mot de passe">
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textDim}
                  secureTextEntry={!showPwd}
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </Field>
            )}

            {mode === 'signin' && (
              <TouchableOpacity style={s.forgotBtn} onPress={sendReset} disabled={resetLoading}>
                <Text style={resetSent ? s.forgotSent : s.forgotTxt}>
                  {resetSent ? '✅ Email envoyé — vérifie ta boîte' : resetLoading ? 'Envoi…' : 'Mot de passe oublié ?'}
                </Text>
              </TouchableOpacity>
            )}

            {!!error && (
              <View style={s.errorBox}>
                <Text style={s.errorIcon}>⚠️</Text>
                <Text style={s.errorTxt}>{error}</Text>
              </View>
            )}

            {!!success && (
              <View style={s.successBox}>
                <View style={s.successRow}>
                  <Text style={s.successIcon}>{isPro ? '📊' : '✉️'}</Text>
                  <Text style={s.successTxt}>{success}</Text>
                </View>
                {isPro && (
                  <Text style={s.proHint}>Une fois connecté → Profil → "Devenir restaurateur" pour soumettre ton dossier.</Text>
                )}
                <TouchableOpacity onPress={() => { setSuccess(''); switchMode('signin'); }} style={s.successLink}>
                  <Text style={s.successLinkTxt}>→ Se connecter</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.75 }]}
              onPress={submit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={s.submitTxt}>
                {loading ? '···' : mode === 'signin' ? 'Se connecter  →' : 'Créer mon compte  →'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={s.legal}>
            En continuant, vous acceptez nos{' '}
            <Text style={s.legalLink}>Conditions</Text>
            {' '}et notre{' '}
            <Text style={s.legalLink}>Politique de confidentialité</Text>.
          </Text>

          {onSwitchType && (
            <TouchableOpacity style={s.switchTypeBtn} onPress={() => onSwitchType(isPro ? 'client' : 'pro')}>
              <Text style={s.switchTypeTxt}>
                {isPro ? '← Retour espace client' : '🧑‍🍳 Espace Pro / Restaurateur →'}
              </Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.section + 4 },

  /* Hero */
  hero:          { alignItems: 'center', paddingTop: 50, paddingBottom: spacing.section },
  heroRingOuter: { width: 88, height: 88, borderRadius: radius.xxl, backgroundColor: colors.accentSoft, borderWidth: 1.5, borderColor: 'rgba(232,160,69,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
  heroRingInner: { width: 60, height: 60, borderRadius: radius.xl, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', alignItems: 'center', justifyContent: 'center' },
  heroStar:      { color: colors.accent, fontSize: 28 },
  logo:          { color: colors.accent, fontSize: typography.size.display, fontWeight: typography.weight.black, letterSpacing: -1, marginBottom: spacing.sm, fontFamily: 'Georgia' },
  tagline:       { color: colors.textMuted, fontSize: typography.size.body, fontStyle: 'italic', letterSpacing: 0.5 },

  /* Tabs */
  tabRow:    { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: 4, marginBottom: spacing.xl },
  tabBtn:    { flex: 1, paddingVertical: spacing.lg, alignItems: 'center', borderRadius: radius.xl },
  tabBtnOn:  { backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder },
  tabTxt:    { color: colors.textDim, fontSize: typography.size.subheading },
  tabTxtOn:  { color: colors.text, fontWeight: typography.weight.medium },

  /* Card */
  card:      { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xxl, marginBottom: spacing.xl },
  cardHead:  { marginBottom: spacing.xxl },
  cardTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.3, marginBottom: spacing.xs },
  cardSub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, lineHeight: 19 },

  /* Input */
  input:   { flex: 1, color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.regular, paddingVertical: 0 },
  eyeBtn:  { marginLeft: spacing.md },
  eyeTxt:  { color: colors.blue, fontSize: typography.size.body },

  /* Forgot */
  forgotBtn:  { alignSelf: 'flex-end', marginTop: -spacing.md, marginBottom: spacing.lg },
  forgotTxt:  { color: colors.blue, fontSize: typography.size.body },
  forgotSent: { color: colors.green, fontSize: typography.size.body },

  /* Feedback */
  errorBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: colors.redSoft, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)', marginBottom: spacing.xl },
  errorIcon:      { fontSize: typography.size.bodyLg },
  errorTxt:       { color: colors.red, fontSize: typography.size.body, lineHeight: 18, flex: 1 },
  successBox:     { gap: spacing.md, backgroundColor: colors.greenSoft, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(76,175,130,0.25)', marginBottom: spacing.xl },
  successRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  successIcon:    { fontSize: typography.size.bodyLg },
  successTxt:     { color: colors.green, fontSize: typography.size.body, lineHeight: 18, flex: 1 },
  successLink:    { alignSelf: 'flex-start' },
  successLinkTxt: { color: colors.blue, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },

  /* Submit */
  submitBtn: { backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: spacing.xl - 2, alignItems: 'center', marginTop: spacing.xs },
  submitTxt: { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold, letterSpacing: 0.5 },

  /* Pro badge */
  roleBadge:    { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blueSoft, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(90,155,224,0.3)', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginBottom: spacing.xl },
  roleBadgeTxt: { color: colors.blue, fontSize: typography.size.body, fontWeight: typography.weight.medium, letterSpacing: 0.5 },

  /* Pro hint */
  proHint: { color: colors.textMuted, fontSize: typography.size.caption, lineHeight: 17, fontStyle: 'italic' },

  /* Legal */
  legal:     { color: colors.textDim, fontSize: typography.size.sm, textAlign: 'center', lineHeight: 16 },
  legalLink: { color: colors.textMuted },

  /* Switch type */
  switchTypeBtn: { alignSelf: 'center', marginTop: spacing.xxl, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl - 2, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(90,155,224,0.3)', backgroundColor: colors.blueSoft },
  switchTypeTxt: { color: colors.blue, fontSize: typography.size.body, fontWeight: typography.weight.medium, letterSpacing: 0.3 },
});
