import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator, Image, Animated,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { supabase } from '../supabase';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.3)',
  red:'#e05a5a',
};

const MIDI_SLOTS = [
  { h:'12:00' }, { h:'12:30' }, { h:'13:00', badge:'Populaire' },
  { h:'13:30', badge:'Populaire' }, { h:'14:00', badge:'Dernières places' },
];
const SOIR_SLOTS = [
  { h:'19:00' }, { h:'19:30', badge:'Populaire' },
  { h:'20:00', badge:'Populaire' }, { h:'20:30' },
  { h:'21:00' }, { h:'21:30', badge:'Dernières places' }, { h:'22:00' },
];

const OCCASIONS = [
  { id:'normal',   label:'Repas normal', icon:'🍽️' },
  { id:'anniv',    label:'Anniversaire', icon:'🎂' },
  { id:'romantique', label:'Romantique', icon:'💑' },
  { id:'affaires', label:'Affaires',     icon:'💼' },
  { id:'famille',  label:'Famille',      icon:'👨‍👩‍👧' },
  { id:'fete',     label:'Célébration',  icon:'🥂' },
];

function buildDays() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dayName: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.','').toUpperCase(),
      dayNum:  d.getDate(),
      month:   d.toLocaleDateString('fr-FR', { month: 'short' }),
      value:   d.toISOString().split('T')[0],
      isToday: i === 0,
      isWeekend: [0, 6].includes(d.getDay()),
    });
  }
  return days;
}

const DAYS = buildDays();

function formatDateLong(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* ─── Stepper progrès ─── */
const STEPS = ['Date', 'Heure', 'Couverts', 'Confirmation'];
function ProgressBar({ current }) {
  return (
    <View style={pb.row}>
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        const last    = i === STEPS.length - 1;
        return (
          <View key={i} style={{ flexDirection:'row', alignItems:'center', flex: last ? 0 : 1 }}>
            <View style={pb.stepWrap}>
              <View style={[pb.circle, done && pb.circleDone, active && pb.circleActive]}>
                {done
                  ? <Text style={pb.checkTxt}>✓</Text>
                  : <Text style={[pb.numTxt, active && pb.numTxtActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[pb.label, active && pb.labelActive, done && pb.labelDone]}>{label}</Text>
            </View>
            {!last && <View style={[pb.line, done && pb.lineDone]} />}
          </View>
        );
      })}
    </View>
  );
}
const pb = StyleSheet.create({
  row:          { flexDirection:'row', alignItems:'flex-start', paddingHorizontal:20, paddingVertical:14, backgroundColor:C.bg2, borderBottomWidth:1, borderBottomColor:C.border },
  stepWrap:     { alignItems:'center', gap:4 },
  circle:       { width:26, height:26, borderRadius:13, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  circleDone:   { backgroundColor:'rgba(61,153,112,0.2)', borderColor:C.green },
  circleActive: { backgroundColor:'rgba(200,151,90,0.15)', borderColor:C.accent },
  checkTxt:     { color:C.green, fontSize:12, fontWeight:'600' },
  numTxt:       { color:C.dimmer, fontSize:11 },
  numTxtActive: { color:C.accent },
  label:        { color:C.dimmer, fontSize:9, letterSpacing:0.3 },
  labelActive:  { color:C.accent },
  labelDone:    { color:C.green },
  line:         { flex:1, height:1, backgroundColor:C.border, marginBottom:14, marginHorizontal:4 },
  lineDone:     { backgroundColor:C.green },
});

/* ─── Stepper numérique ─── */
function Stepper({ value, min, max, onChange }) {
  return (
    <View style={st.row}>
      <TouchableOpacity style={[st.btn, value <= min && st.btnDim]} onPress={() => onChange(v => Math.max(min, v - 1))} disabled={value <= min}>
        <Text style={st.sym}>−</Text>
      </TouchableOpacity>
      <Text style={st.val}>{value}</Text>
      <TouchableOpacity style={[st.btn, value >= max && st.btnDim]} onPress={() => onChange(v => Math.min(max, v + 1))} disabled={value >= max}>
        <Text style={st.sym}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
const st = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'center', gap:14 },
  btn:    { width:38, height:38, borderRadius:19, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  btnDim: { opacity:0.25 },
  sym:    { color:C.text, fontSize:22, fontWeight:'300', lineHeight:30 },
  val:    { color:C.text, fontSize:22, fontWeight:'200', minWidth:32, textAlign:'center' },
});

/* ─── Ligne récap ─── */
function SumRow({ icon, label, val, accent, last }) {
  return (
    <View style={[s.sumRow, !last && s.sumBorder]}>
      <Text style={s.sumIcon}>{icon}</Text>
      <Text style={s.sumLbl}>{label}</Text>
      <Text style={[s.sumVal, accent && { color:C.accent2 }]}>{val}</Text>
    </View>
  );
}

/* ─── Écran principal ─── */
export default function ReservationFormScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || { name:'Restaurant', id:null, photo_url:null, avg_rating:null };

  const [date,      setDate]      = useState(null);
  const [heure,     setHeure]     = useState(null);
  const [adults,    setAdults]    = useState(2);
  const [children,  setChildren]  = useState(0);
  const [occasion,  setOccasion]  = useState('normal');
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [userId,    setUserId]    = useState(null);
  const [shake,     setShake]     = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;

  /* Calcul du step actif pour la progress bar */
  const step = !date ? 0 : !heure ? 1 : 2;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      supabase.from('users').select('id').eq('auth_id', u.id).single()
        .then(({ data: row }) => { if (row) setUserId(row.id); });
    });
  }, []);

  useEffect(() => {
    if (success) {
      Animated.spring(successAnim, { toValue:1, useNativeDriver:true, tension:55, friction:8 }).start();
    }
  }, [success]);

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:1, duration:60, useNativeDriver:true }),
      Animated.timing(shakeAnim, { toValue:-1, duration:60, useNativeDriver:true }),
      Animated.timing(shakeAnim, { toValue:1, duration:60, useNativeDriver:true }),
      Animated.timing(shakeAnim, { toValue:0, duration:60, useNativeDriver:true }),
    ]).start();
  }

  async function confirmer() {
    if (!date || !heure) {
      setError('Choisissez une date et une heure pour continuer.');
      triggerShake();
      return;
    }
    if (!userId)        { setError('Connectez-vous pour réserver.'); return; }
    if (!restaurant.id) { setError('Restaurant introuvable.'); return; }

    setLoading(true); setError('');

    const noteText = [
      occasion !== 'normal' ? `Occasion : ${OCCASIONS.find(o => o.id === occasion)?.label}` : null,
      notes.trim() || null,
    ].filter(Boolean).join('\n') || null;

    const { error: resaErr } = await supabase.from('reservations').insert({
      user_id:       userId,
      restaurant_id: restaurant.id,
      date,
      time_slot:     heure,
      nb_adults:     adults,
      nb_children:   children,
      notes:         noteText,
    });

    if (resaErr) { setError(resaErr.message); setLoading(false); return; }

    await supabase.from('notifications').insert({
      recipient_id:   userId,
      recipient_type: 'user',
      type:           'new_resa',
      title:          'Demande envoyée',
      body:           `Votre réservation chez ${restaurant.name} le ${formatDateLong(date)} à ${heure} pour ${adults} personne${adults > 1 ? 's' : ''} est en attente de confirmation.`,
    });

    setLoading(false);
    setSuccess(true);
  }

  /* ── Écran succès ── */
  if (success) {
    const occasionObj = OCCASIONS.find(o => o.id === occasion);
    return (
      <SafeAreaView style={s.root}>
        <Animated.ScrollView
          contentContainerStyle={s.successWrap}
          showsVerticalScrollIndicator={false}
          style={{
            opacity: successAnim,
            transform: [{ scale: successAnim.interpolate({ inputRange:[0,1], outputRange:[0.92,1] }) }],
          }}
        >
          {/* Icône succès */}
          <View style={s.successRing}>
            <View style={s.successCheck}>
              <Text style={s.successCheckTxt}>✓</Text>
            </View>
          </View>

          <Text style={s.successTitle}>Demande envoyée !</Text>
          <Text style={s.successSub}>Le restaurant va confirmer votre table sous peu.</Text>

          {/* Carte récap */}
          <View style={s.successCard}>
            {restaurant.photo_url && (
              <Image source={{ uri: restaurant.photo_url }} style={s.successPhoto} resizeMode="cover" />
            )}
            <View style={s.successCardBody}>
              <Text style={s.successRestoName}>{restaurant.name}</Text>
              {restaurant.avg_rating > 0 && (
                <Text style={s.successRating}>★ {Number(restaurant.avg_rating).toFixed(1)}</Text>
              )}
            </View>
            <View style={s.successDivider} />
            <View style={s.successDetails}>
              <View style={s.successDetailItem}>
                <Text style={s.successDetailIcon}>📅</Text>
                <View>
                  <Text style={s.successDetailLabel}>DATE</Text>
                  <Text style={s.successDetailVal}>{formatDateLong(date)}</Text>
                </View>
              </View>
              <View style={s.successDetailItem}>
                <Text style={s.successDetailIcon}>🕐</Text>
                <View>
                  <Text style={s.successDetailLabel}>HEURE</Text>
                  <Text style={[s.successDetailVal, { color:C.accent2 }]}>{heure}</Text>
                </View>
              </View>
              <View style={s.successDetailItem}>
                <Text style={s.successDetailIcon}>👥</Text>
                <View>
                  <Text style={s.successDetailLabel}>COUVERTS</Text>
                  <Text style={s.successDetailVal}>
                    {adults} adulte{adults > 1 ? 's' : ''}
                    {children > 0 ? ` · ${children} enfant${children > 1 ? 's' : ''}` : ''}
                  </Text>
                </View>
              </View>
              {occasionObj && occasionObj.id !== 'normal' && (
                <View style={s.successDetailItem}>
                  <Text style={s.successDetailIcon}>{occasionObj.icon}</Text>
                  <View>
                    <Text style={s.successDetailLabel}>OCCASION</Text>
                    <Text style={s.successDetailVal}>{occasionObj.label}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Info statut */}
          <View style={s.successStatus}>
            <View style={s.successStatusDot} />
            <Text style={s.successStatusTxt}>En attente de confirmation  ·  Notification à venir</Text>
          </View>

          <TouchableOpacity style={s.successBtn} onPress={() => navigation.navigate('Main')}>
            <Text style={s.successBtnTxt}>RETOUR À L'ACCUEIL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.successBtnOutline} onPress={() => {
            setSuccess(false); setDate(null); setHeure(null);
            setNotes(''); setOccasion('normal'); successAnim.setValue(0);
          }}>
            <Text style={s.successBtnOutlineTxt}>Faire une autre réservation</Text>
          </TouchableOpacity>
          <View style={{ height:40 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    );
  }

  const shakeTranslate = shakeAnim.interpolate({ inputRange:[-1,1], outputRange:[-8,8] });

  /* ── Formulaire ── */
  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={s.headerSub}>RÉSERVATION</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
        </View>
        {!!restaurant.avg_rating && (
          <View style={s.ratingPill}>
            <Text style={s.ratingTxt}>★ {Number(restaurant.avg_rating).toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Progress stepper */}
      <ProgressBar current={step} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero bannière */}
        {restaurant.photo_url
          ? <Image source={{ uri:restaurant.photo_url }} style={s.banner} resizeMode="cover" />
          : (
            <View style={[s.banner, s.bannerPlaceholder]}>
              <Text style={{ fontSize:48, opacity:0.5 }}>🍽️</Text>
              <Text style={s.bannerPlaceholderTxt}>{restaurant.name}</Text>
            </View>
          )
        }

        {/* ── SECTION DATE ── */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <View style={[s.sectionNum, date && s.sectionNumDone]}>
              <Text style={[s.sectionNumTxt, date && { color:C.green }]}>{date ? '✓' : '1'}</Text>
            </View>
            <Text style={[s.sectionLabel, date && s.sectionLabelDone]}>CHOISIR UNE DATE</Text>
          </View>
          {date && <Text style={s.sectionChosen}>{formatDateLong(date)}</Text>}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateRow}>
          {DAYS.map(d => (
            <TouchableOpacity
              key={d.value}
              style={[
                s.dateCard,
                d.isToday && s.dateCardToday,
                date === d.value && s.dateCardOn,
                d.isWeekend && !date && s.dateCardWeekend,
              ]}
              onPress={() => setDate(d.value)}
            >
              <Text style={[s.dateDayName, date === d.value && s.dateTxtOn, d.isToday && date !== d.value && { color:C.accent2 }]}>
                {d.isToday ? 'AUJ.' : d.dayName}
              </Text>
              <Text style={[s.dateDayNum, date === d.value && s.dateTxtOn]}>{d.dayNum}</Text>
              <Text style={[s.dateMonth, date === d.value && s.dateTxtOn]}>{d.month}</Text>
              {d.isWeekend && <View style={[s.weekendDot, date === d.value && { backgroundColor:C.accent }]} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── SECTION HEURE ── */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <View style={[s.sectionNum, heure && s.sectionNumDone]}>
              <Text style={[s.sectionNumTxt, heure && { color:C.green }]}>{heure ? '✓' : '2'}</Text>
            </View>
            <Text style={[s.sectionLabel, heure && s.sectionLabelDone]}>CHOISIR UNE HEURE</Text>
          </View>
          {heure && <Text style={[s.sectionChosen, { color:C.accent2 }]}>{heure}</Text>}
        </View>

        {/* Midi */}
        <View style={s.slotSection}>
          <View style={s.slotGroupRow}>
            <Text style={s.slotGroupIcon}>☀️</Text>
            <Text style={s.slotGroupLabel}>Déjeuner</Text>
          </View>
          <View style={s.slotsWrap}>
            {MIDI_SLOTS.map(({ h, badge }) => (
              <TouchableOpacity key={h} style={[s.slotChip, heure === h && s.slotChipOn]} onPress={() => setHeure(h)}>
                <Text style={[s.slotTxt, heure === h && s.slotTxtOn]}>{h}</Text>
                {badge && (
                  <View style={[s.slotBadge, badge === 'Populaire' && s.slotBadgePopular, badge === 'Dernières places' && s.slotBadgeLast]}>
                    <Text style={[s.slotBadgeTxt, badge === 'Dernières places' && { color:C.red }]}>{badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Soir */}
        <View style={[s.slotSection, { marginTop:12 }]}>
          <View style={s.slotGroupRow}>
            <Text style={s.slotGroupIcon}>🌙</Text>
            <Text style={s.slotGroupLabel}>Dîner</Text>
          </View>
          <View style={s.slotsWrap}>
            {SOIR_SLOTS.map(({ h, badge }) => (
              <TouchableOpacity key={h} style={[s.slotChip, heure === h && s.slotChipOn]} onPress={() => setHeure(h)}>
                <Text style={[s.slotTxt, heure === h && s.slotTxtOn]}>{h}</Text>
                {badge && (
                  <View style={[s.slotBadge, badge === 'Populaire' && s.slotBadgePopular, badge === 'Dernières places' && s.slotBadgeLast]}>
                    <Text style={[s.slotBadgeTxt, badge === 'Dernières places' && { color:C.red }]}>{badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── SECTION COUVERTS ── */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <View style={s.sectionNum}>
              <Text style={s.sectionNumTxt}>3</Text>
            </View>
            <Text style={s.sectionLabel}>COUVERTS</Text>
          </View>
          <Text style={s.sectionChosen}>{adults + children} pers.</Text>
        </View>

        <View style={s.couvCard}>
          <View style={s.couvRow}>
            <View style={s.couvInfo}>
              <View style={s.couvIconWrap}>
                <Text style={s.couvEmoji}>🧑</Text>
              </View>
              <View>
                <Text style={s.couvLabel}>Adultes</Text>
                <Text style={s.couvSub}>13 ans et plus</Text>
              </View>
            </View>
            <Stepper value={adults} min={1} max={20} onChange={setAdults} />
          </View>
          <View style={s.couvDivider} />
          <View style={s.couvRow}>
            <View style={s.couvInfo}>
              <View style={s.couvIconWrap}>
                <Text style={s.couvEmoji}>👶</Text>
              </View>
              <View>
                <Text style={s.couvLabel}>Enfants</Text>
                <Text style={s.couvSub}>Moins de 13 ans</Text>
              </View>
            </View>
            <Stepper value={children} min={0} max={10} onChange={setChildren} />
          </View>
        </View>

        {/* ── SECTION OCCASION ── */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <View style={s.sectionNum}>
              <Text style={s.sectionNumTxt}>4</Text>
            </View>
            <Text style={s.sectionLabel}>OCCASION</Text>
          </View>
          <Text style={s.sectionChosen}>{OCCASIONS.find(o => o.id === occasion)?.label}</Text>
        </View>

        <View style={s.occasionGrid}>
          {OCCASIONS.map(o => (
            <TouchableOpacity
              key={o.id}
              style={[s.occasionChip, occasion === o.id && s.occasionChipOn]}
              onPress={() => setOccasion(o.id)}
            >
              <Text style={s.occasionIcon}>{o.icon}</Text>
              <Text style={[s.occasionLabel, occasion === o.id && s.occasionLabelOn]}>{o.label}</Text>
              {occasion === o.id && <View style={s.occasionCheck}><Text style={{ color:C.accent, fontSize:9, fontWeight:'600' }}>✓</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── NOTE ── */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <Text style={s.optLabel}>NOTE  <Text style={s.optSub}>optionnel</Text></Text>
          </View>
          <Text style={s.charCount}>{notes.length}/300</Text>
        </View>

        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            placeholder="Allergie, demande particulière, message au chef…"
            placeholderTextColor={C.dimmer}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={300}
          />
        </View>

        {/* ── RÉCAP ── */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>RÉCAPITULATIF</Text>
          <SumRow icon="🍽️" label="Restaurant" val={restaurant.name} />
          <SumRow icon="📅" label="Date"        val={date ? formatDateLong(date) : '—'} />
          <SumRow icon="🕐" label="Heure"       val={heure || '—'} accent />
          <SumRow icon="👥" label="Couverts"    val={`${adults} adulte${adults > 1 ? 's' : ''}${children > 0 ? ` · ${children} enfant${children > 1 ? 's' : ''}` : ''}`} />
          <SumRow icon={OCCASIONS.find(o => o.id === occasion)?.icon || '🍽️'}
                  label="Occasion"   val={OCCASIONS.find(o => o.id === occasion)?.label || '—'} last />
        </View>

        {/* Erreur */}
        {!!error && (
          <Animated.View style={[s.errorBox, { transform:[{ translateX: shakeTranslate }] }]}>
            <Text style={s.errorTxt}>⚠️  {error}</Text>
          </Animated.View>
        )}

        {/* Bouton confirmer */}
        <TouchableOpacity
          style={[s.confirmBtn, (!date || !heure || loading) && s.confirmBtnDim]}
          onPress={confirmer}
          disabled={loading || !date || !heure}
        >
          {loading
            ? <ActivityIndicator color={C.bg} />
            : <>
                <Text style={s.confirmBtnTxt}>CONFIRMER LA RÉSERVATION</Text>
                <Text style={s.confirmBtnArrow}>→</Text>
              </>
          }
        </TouchableOpacity>

        <Text style={s.legalTxt}>
          En confirmant, vous acceptez que le restaurant puisse vous contacter pour valider votre réservation.
        </Text>

        <View style={{ height:60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:C.bg },

  /* Header */
  header:      { flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:20, paddingTop:12, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border },
  backBtn:     { width:38, height:38, borderRadius:19, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  backBtnTxt:  { color:C.text, fontSize:18 },
  headerSub:   { color:C.accent, fontSize:9, letterSpacing:3, marginBottom:2 },
  headerTitle: { color:C.text, fontSize:17, fontWeight:'300', letterSpacing:0.3 },
  ratingPill:  { backgroundColor:'rgba(200,151,90,0.12)', borderRadius:10, borderWidth:1, borderColor:C.borderAccent, paddingHorizontal:10, paddingVertical:5 },
  ratingTxt:   { color:C.accent, fontSize:12, fontWeight:'500' },

  /* Banner */
  banner:             { width:'100%', height:180 },
  bannerPlaceholder:  { backgroundColor:C.bg2, alignItems:'center', justifyContent:'center', gap:8 },
  bannerPlaceholderTxt:{ color:C.dim, fontSize:14, fontWeight:'300' },

  /* Section headers */
  sectionHeader:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, marginTop:24, marginBottom:14 },
  sectionLeft:     { flexDirection:'row', alignItems:'center', gap:10 },
  sectionNum:      { width:22, height:22, borderRadius:11, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  sectionNumDone:  { backgroundColor:'rgba(61,153,112,0.15)', borderColor:C.green },
  sectionNumTxt:   { color:C.dimmer, fontSize:10, fontWeight:'600' },
  sectionLabel:    { color:C.dim, fontSize:10, letterSpacing:3 },
  sectionLabelDone:{ color:C.green },
  sectionChosen:   { color:C.accent, fontSize:11, fontWeight:'400' },
  optLabel:        { color:C.dim, fontSize:10, letterSpacing:3 },
  optSub:          { color:C.dimmer, fontSize:9, letterSpacing:1, fontWeight:'300' },
  charCount:       { color:C.dimmer, fontSize:10 },

  /* Dates */
  dateRow:        { paddingHorizontal:20, paddingBottom:4, gap:8 },
  dateCard:       { width:66, paddingVertical:13, borderRadius:16, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, alignItems:'center', gap:3 },
  dateCardOn:     { backgroundColor:'rgba(200,151,90,0.12)', borderColor:C.accent },
  dateCardToday:  { borderColor:'rgba(74,127,165,0.5)' },
  dateCardWeekend:{ borderColor:'rgba(200,151,90,0.15)' },
  dateDayName:    { color:C.dimmer, fontSize:9, letterSpacing:1.5 },
  dateDayNum:     { color:C.text, fontSize:22, fontWeight:'200' },
  dateMonth:      { color:C.dimmer, fontSize:9 },
  dateTxtOn:      { color:C.accent },
  weekendDot:     { width:4, height:4, borderRadius:2, backgroundColor:'rgba(200,151,90,0.4)', marginTop:2 },

  /* Slots */
  slotSection:  { paddingHorizontal:20 },
  slotGroupRow: { flexDirection:'row', alignItems:'center', gap:7, marginBottom:10 },
  slotGroupIcon:{ fontSize:14 },
  slotGroupLabel:{ color:C.dim, fontSize:12 },
  slotsWrap:    { flexDirection:'row', flexWrap:'wrap', gap:8 },
  slotChip:     { alignItems:'center', paddingHorizontal:16, paddingVertical:10, borderRadius:12, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, minWidth:78 },
  slotChipOn:   { backgroundColor:'rgba(74,127,165,0.15)', borderColor:C.accent2 },
  slotTxt:      { color:C.dim, fontSize:15, fontWeight:'300' },
  slotTxtOn:    { color:C.accent2, fontWeight:'500' },
  slotBadge:    { marginTop:4, paddingHorizontal:5, paddingVertical:2, borderRadius:4, backgroundColor:'rgba(200,151,90,0.1)' },
  slotBadgePopular:{ backgroundColor:'rgba(200,151,90,0.12)' },
  slotBadgeLast:   { backgroundColor:'rgba(224,90,90,0.1)' },
  slotBadgeTxt: { color:C.accent, fontSize:8 },

  /* Couverts */
  couvCard:    { marginHorizontal:20, backgroundColor:C.bg2, borderRadius:18, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  couvRow:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:18 },
  couvInfo:    { flexDirection:'row', alignItems:'center', gap:14 },
  couvIconWrap:{ width:40, height:40, borderRadius:12, backgroundColor:C.bg3, alignItems:'center', justifyContent:'center' },
  couvEmoji:   { fontSize:20 },
  couvLabel:   { color:C.text, fontSize:14, fontWeight:'300', marginBottom:2 },
  couvSub:     { color:C.dimmer, fontSize:11 },
  couvDivider: { height:1, backgroundColor:C.border, marginHorizontal:20 },

  /* Occasion */
  occasionGrid:  { flexDirection:'row', flexWrap:'wrap', gap:10, paddingHorizontal:20 },
  occasionChip:  { width:'30%', flexGrow:1, alignItems:'center', paddingVertical:14, borderRadius:14, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, gap:6, position:'relative' },
  occasionChipOn:{ backgroundColor:'rgba(200,151,90,0.1)', borderColor:C.accent },
  occasionIcon:  { fontSize:22 },
  occasionLabel: { color:C.dim, fontSize:11, textAlign:'center' },
  occasionLabelOn:{ color:C.accent },
  occasionCheck: { position:'absolute', top:7, right:7, width:16, height:16, borderRadius:8, backgroundColor:'rgba(200,151,90,0.2)', alignItems:'center', justifyContent:'center' },

  /* Note */
  inputWrap:   { marginHorizontal:20, backgroundColor:C.bg2, borderRadius:14, borderWidth:1, borderColor:C.border },
  input:       { color:C.text, fontSize:13, fontWeight:'300', padding:16, minHeight:90, textAlignVertical:'top' },

  /* Résumé */
  summaryCard:  { margin:20, backgroundColor:C.bg2, borderRadius:18, borderWidth:1, borderColor:C.borderAccent, padding:18 },
  summaryTitle: { color:C.dimmer, fontSize:9, letterSpacing:4, marginBottom:14 },
  sumRow:       { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:9 },
  sumBorder:    { borderBottomWidth:1, borderBottomColor:C.border },
  sumIcon:      { fontSize:15, width:22 },
  sumLbl:       { color:C.dim, fontSize:13, flex:1 },
  sumVal:       { color:C.text, fontSize:13, fontWeight:'300', textAlign:'right', flexShrink:1, maxWidth:'55%' },

  /* Erreur */
  errorBox:    { marginHorizontal:20, marginBottom:14, backgroundColor:'rgba(224,90,90,0.1)', borderRadius:12, padding:14, borderWidth:1, borderColor:'rgba(224,90,90,0.3)' },
  errorTxt:    { color:C.red, fontSize:12 },

  /* Bouton confirmer */
  confirmBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, marginHorizontal:20, backgroundColor:C.accent, borderRadius:16, paddingVertical:17 },
  confirmBtnDim: { opacity:0.4 },
  confirmBtnTxt: { color:C.bg, fontSize:13, fontWeight:'500', letterSpacing:1.5 },
  confirmBtnArrow:{ color:C.bg, fontSize:18, fontWeight:'300' },

  /* Note légale */
  legalTxt:    { marginHorizontal:20, marginTop:12, color:C.dimmer, fontSize:10, lineHeight:16, textAlign:'center', fontStyle:'italic' },

  /* ── Succès ── */
  successWrap:     { alignItems:'center', paddingHorizontal:28, paddingTop:48 },
  successRing:     { width:100, height:100, borderRadius:50, borderWidth:1, borderColor:'rgba(61,153,112,0.25)', backgroundColor:'rgba(61,153,112,0.04)', alignItems:'center', justifyContent:'center', marginBottom:22 },
  successCheck:    { width:72, height:72, borderRadius:36, backgroundColor:'rgba(61,153,112,0.12)', borderWidth:2, borderColor:C.green, alignItems:'center', justifyContent:'center' },
  successCheckTxt: { color:C.green, fontSize:32, fontWeight:'300' },
  successTitle:    { color:C.text, fontSize:26, fontWeight:'300', letterSpacing:0.5, marginBottom:8, textAlign:'center' },
  successSub:      { color:C.dim, fontSize:13, textAlign:'center', marginBottom:28, lineHeight:20 },
  successCard:     { width:'100%', backgroundColor:C.bg2, borderRadius:20, borderWidth:1, borderColor:C.borderAccent, overflow:'hidden', marginBottom:14 },
  successPhoto:    { width:'100%', height:120 },
  successCardBody: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:18, paddingVertical:14 },
  successRestoName:{ color:C.accent, fontSize:17, fontWeight:'300', letterSpacing:0.3 },
  successRating:   { color:'#f0c040', fontSize:13 },
  successDivider:  { height:1, backgroundColor:C.border },
  successDetails:  { padding:18, gap:14 },
  successDetailItem:{ flexDirection:'row', alignItems:'center', gap:14 },
  successDetailIcon:{ fontSize:18, width:26 },
  successDetailLabel:{ color:C.dimmer, fontSize:9, letterSpacing:2, marginBottom:2 },
  successDetailVal:{ color:C.text, fontSize:14, fontWeight:'300' },
  successStatus:   { flexDirection:'row', alignItems:'center', gap:8, width:'100%', backgroundColor:C.bg2, borderRadius:12, padding:14, borderWidth:1, borderColor:C.border, marginBottom:24 },
  successStatusDot:{ width:7, height:7, borderRadius:4, backgroundColor:'#f0c040' },
  successStatusTxt:{ color:C.dim, fontSize:12, flex:1 },
  successBtn:        { width:'100%', backgroundColor:C.accent, borderRadius:16, paddingVertical:15, alignItems:'center', marginBottom:10 },
  successBtnTxt:     { color:C.bg, fontSize:13, fontWeight:'500', letterSpacing:2 },
  successBtnOutline: { width:'100%', borderRadius:16, paddingVertical:15, alignItems:'center', borderWidth:1, borderColor:C.border },
  successBtnOutlineTxt:{ color:C.dim, fontSize:13 },
});
