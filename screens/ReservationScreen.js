import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert, Image, RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';

const SW = Dimensions.get('window').width;

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#e05a5a', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.2)',
};

function fmtShort(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' });
}
function fmtLong(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}
function fmtMonth(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { month:'long', year:'numeric' });
}
function daysUntil(d) {
  const today = new Date(); today.setHours(0,0,0,0);
  const diff  = Math.round((new Date(d+'T00:00:00') - today) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff > 1)  return `Dans ${diff} jours`;
  return `Il y a ${Math.abs(diff)} j`;
}
function todayStr() { return new Date().toISOString().split('T')[0]; }

const SC = {
  confirmed: { label:'Confirmé',   color:C.green,   bg:'rgba(61,153,112,0.12)',  border:'rgba(61,153,112,0.3)'  },
  pending:   { label:'En attente', color:C.accent,  bg:'rgba(200,151,90,0.12)',  border:'rgba(200,151,90,0.3)'  },
  arrived:   { label:'Arrivé',     color:C.accent2, bg:'rgba(74,127,165,0.12)',  border:'rgba(74,127,165,0.25)' },
  no_show:   { label:'No Show',    color:C.dim,     bg:'rgba(138,154,176,0.1)',  border:'rgba(138,154,176,0.2)' },
  cancelled: { label:'Annulé',     color:C.red,     bg:'rgba(224,90,90,0.1)',    border:'rgba(224,90,90,0.25)'  },
  completed: { label:'Terminé',    color:C.dimmer,  bg:'rgba(74,74,74,0.1)',     border:'rgba(74,74,74,0.2)'    },
};

function statusCfg(s) { return SC[s] || SC.pending; }

function Thumb({ url, size = 52 }) {
  if (url) return <Image source={{ uri: url }} style={{ width:size, height:size, borderRadius:14 }} resizeMode="cover" />;
  return (
    <View style={{ width:size, height:size, borderRadius:14, backgroundColor:C.bg3, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ fontSize: size * 0.38 }}>🍽️</Text>
    </View>
  );
}

function Badge({ status }) {
  const sc = statusCfg(status);
  return (
    <View style={[b.wrap, { backgroundColor: sc.bg, borderColor: sc.border }]}>
      <Text style={[b.txt, { color: sc.color }]}>{sc.label}</Text>
    </View>
  );
}
const b = StyleSheet.create({
  wrap: { borderWidth:1, borderRadius:100, paddingHorizontal:10, paddingVertical:4 },
  txt:  { fontSize:10, fontWeight:'400', letterSpacing:0.3 },
});

/* ─── Grande carte prochaine réservation ─── */
function NextCard({ r, onCancel, onViewRestaurant }) {
  const sc    = statusCfg(r.status);
  const resto = r.restaurants || {};
  const diff  = Math.round((new Date(r.date+'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000);
  const urgentColor = diff === 0 ? C.accent : diff === 1 ? C.green : C.accent2;

  return (
    <View style={nc.card}>
      {/* Photo + overlay */}
      <View style={nc.photoWrap}>
        {resto.photo_url
          ? <Image source={{ uri: resto.photo_url }} style={nc.photo} resizeMode="cover" />
          : <View style={[nc.photo, { backgroundColor:'#1a2e1a', alignItems:'center', justifyContent:'center' }]}>
              <Text style={{ fontSize:52 }}>🍽️</Text>
            </View>
        }
        <View style={nc.photoOverlay} />
        <View style={nc.photoTop}>
          <Badge status={r.status} />
          {resto.avg_rating > 0 && (
            <View style={nc.ratingPill}>
              <Text style={nc.ratingTxt}>★ {Number(resto.avg_rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={nc.photoBottom}>
          {resto.cuisine_type && (
            <Text style={nc.photoCuisine}>{resto.cuisine_type.toUpperCase().replace(/_/g,' ')}</Text>
          )}
          <Text style={nc.photoName}>{resto.name || '—'}</Text>
          {resto.quartier && <Text style={nc.photoQuartier}>📍 {resto.quartier}</Text>}
        </View>
      </View>

      {/* Corps */}
      <View style={nc.body}>
        {/* Countdown banner */}
        <View style={[nc.countdown, { borderColor: urgentColor+'40', backgroundColor: urgentColor+'0d' }]}>
          <Text style={[nc.countdownLabel, { color: urgentColor }]}>
            {diff === 0 ? '🎉' : diff === 1 ? '⏰' : '📅'}
            {'  '}{daysUntil(r.date)}
          </Text>
          <Text style={[nc.countdownDate, { color: urgentColor }]}>{fmtLong(r.date)}</Text>
        </View>

        {/* Détails */}
        <View style={nc.details}>
          <View style={nc.detailItem}>
            <Text style={nc.detailIcon}>🕐</Text>
            <View>
              <Text style={nc.detailLbl}>HEURE</Text>
              <Text style={nc.detailVal}>{r.time_slot?.slice(0,5) || '—'}</Text>
            </View>
          </View>
          <View style={nc.detailSep} />
          <View style={nc.detailItem}>
            <Text style={nc.detailIcon}>👤</Text>
            <View>
              <Text style={nc.detailLbl}>COUVERTS</Text>
              <Text style={nc.detailVal}>
                {r.nb_adults}{r.nb_children > 0 ? ` + ${r.nb_children}` : ''}
              </Text>
            </View>
          </View>
          {!!resto.quartier && (
            <>
              <View style={nc.detailSep} />
              <View style={nc.detailItem}>
                <Text style={nc.detailIcon}>📍</Text>
                <View>
                  <Text style={nc.detailLbl}>QUARTIER</Text>
                  <Text style={nc.detailVal} numberOfLines={1}>{resto.quartier}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Note */}
        {!!r.notes && (
          <View style={nc.note}>
            <Text style={nc.noteLbl}>💬  Note</Text>
            <Text style={nc.noteTxt}>{r.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={nc.actions}>
          {onViewRestaurant && (
            <TouchableOpacity style={nc.viewBtn} onPress={onViewRestaurant}>
              <Text style={nc.viewBtnTxt}>Voir le restaurant →</Text>
            </TouchableOpacity>
          )}
          {['confirmed','pending'].includes(r.status) && (
            <TouchableOpacity style={nc.cancelBtn} onPress={onCancel}>
              <Text style={nc.cancelTxt}>Annuler la réservation</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const nc = StyleSheet.create({
  card:         { marginHorizontal:16, backgroundColor:C.bg2, borderRadius:22, borderWidth:1, borderColor:C.borderAccent, overflow:'hidden', marginBottom:8 },
  photoWrap:    { height:200, position:'relative' },
  photo:        { ...StyleSheet.absoluteFillObject },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(8,14,26,0.45)' },
  photoTop:     { position:'absolute', top:14, left:14, right:14, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  ratingPill:   { backgroundColor:'rgba(8,14,26,0.72)', borderRadius:100, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:'rgba(200,151,90,0.4)' },
  ratingTxt:    { color:C.accent, fontSize:11, fontWeight:'500' },
  photoBottom:  { position:'absolute', bottom:0, left:0, right:0, padding:16, backgroundColor:'rgba(8,14,26,0.65)' },
  photoCuisine: { color:'rgba(200,151,90,0.85)', fontSize:8, letterSpacing:2.5, marginBottom:3 },
  photoName:    { color:'#fff', fontSize:20, fontWeight:'400', letterSpacing:0.3, marginBottom:2 },
  photoQuartier:{ color:'rgba(240,236,228,0.65)', fontSize:11 },
  body:         { padding:16, gap:12 },
  countdown:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1, borderRadius:12, paddingHorizontal:14, paddingVertical:11 },
  countdownLabel:{ fontSize:14, fontWeight:'500' },
  countdownDate: { fontSize:12, fontWeight:'300' },
  details:      { flexDirection:'row', backgroundColor:'rgba(0,0,0,0.2)', borderRadius:14, overflow:'hidden' },
  detailItem:   { flex:1, flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:12, paddingVertical:12 },
  detailSep:    { width:1, backgroundColor:C.border, marginVertical:8 },
  detailIcon:   { fontSize:16 },
  detailLbl:    { color:C.dimmer, fontSize:8, letterSpacing:2, marginBottom:3 },
  detailVal:    { color:C.text, fontSize:14, fontWeight:'400' },
  note:         { backgroundColor:C.bg3, borderRadius:12, padding:12, borderWidth:1, borderColor:C.border },
  noteLbl:      { color:C.dim, fontSize:10, letterSpacing:1, marginBottom:4 },
  noteTxt:      { color:C.text, fontSize:13, fontWeight:'300', lineHeight:18 },
  actions:      { gap:8 },
  viewBtn:      { backgroundColor:'rgba(74,127,165,0.1)', borderWidth:1, borderColor:'rgba(74,127,165,0.25)', borderRadius:12, paddingVertical:11, alignItems:'center' },
  viewBtnTxt:   { color:C.accent2, fontSize:13 },
  cancelBtn:    { borderWidth:1, borderColor:'rgba(224,90,90,0.3)', borderRadius:12, paddingVertical:11, alignItems:'center', backgroundColor:'rgba(224,90,90,0.06)' },
  cancelTxt:    { color:C.red, fontSize:13 },
});

/* ─── Petite carte "plus tard" ─── */
function SmallCard({ r, onCancel, onPress }) {
  return (
    <TouchableOpacity style={sc2.card} onPress={onPress} activeOpacity={0.85}>
      <Thumb url={r.restaurants?.photo_url} size={56} />
      <View style={{ flex:1 }}>
        <Text style={sc2.name} numberOfLines={1}>{r.restaurants?.name || '—'}</Text>
        <Text style={sc2.meta}>{fmtShort(r.date)} · {r.time_slot?.slice(0,5)} · {(r.nb_adults||0)+(r.nb_children||0)} pers.</Text>
        <Text style={[sc2.countdown, { color: daysUntil(r.date) === 'Demain' ? C.green : C.accent2 }]}>
          {daysUntil(r.date)}
        </Text>
      </View>
      <View style={{ alignItems:'flex-end', gap:7 }}>
        <Badge status={r.status} />
        {['confirmed','pending'].includes(r.status) && (
          <TouchableOpacity onPress={onCancel}>
            <Text style={sc2.cancelTxt}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
const sc2 = StyleSheet.create({
  card:      { flexDirection:'row', alignItems:'center', gap:12, marginHorizontal:16, marginBottom:10, backgroundColor:C.bg2, borderRadius:16, padding:14, borderWidth:1, borderColor:C.border },
  name:      { color:C.text, fontSize:14, fontWeight:'300', marginBottom:3 },
  meta:      { color:C.dim, fontSize:11, marginBottom:3 },
  countdown: { fontSize:11, fontWeight:'400' },
  cancelTxt: { color:C.red, fontSize:11 },
});

/* ─── Carte historique ─── */
function HistCard({ r, onReserveAgain, onPress }) {
  const sc = statusCfg(r.status);
  const canRebook = ['completed','arrived','no_show'].includes(r.status);
  return (
    <TouchableOpacity style={[hc.card, { borderLeftColor: sc.color }]} onPress={onPress} activeOpacity={0.85}>
      <Thumb url={r.restaurants?.photo_url} size={50} />
      <View style={{ flex:1 }}>
        <Text style={hc.name} numberOfLines={1}>{r.restaurants?.name || '—'}</Text>
        <Text style={hc.meta}>{fmtShort(r.date)} · {r.time_slot?.slice(0,5)} · {(r.nb_adults||0)+(r.nb_children||0)} pers.</Text>
        {!!r.notes && <Text style={hc.note} numberOfLines={1}>💬 {r.notes}</Text>}
        {canRebook && onReserveAgain && (
          <TouchableOpacity onPress={onReserveAgain} style={{ marginTop:4 }}>
            <Text style={hc.reBook}>Réserver à nouveau →</Text>
          </TouchableOpacity>
        )}
      </View>
      <Badge status={r.status} />
    </TouchableOpacity>
  );
}
const hc = StyleSheet.create({
  card:   { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:14, paddingHorizontal:20, borderBottomWidth:1, borderBottomColor:C.border, borderLeftWidth:3 },
  name:   { color:C.text, fontSize:14, fontWeight:'300', marginBottom:3 },
  meta:   { color:C.dim, fontSize:11, marginBottom:2 },
  note:   { color:C.dimmer, fontSize:10 },
  reBook: { color:C.accent2, fontSize:11, fontWeight:'400' },
});

/* ─── Écran principal ─── */
export default function ReservationScreen({ navigation }) {
  const [tab,          setTab]          = useState('avenir');
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [reservations, setReservations] = useState([]);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); setRefreshing(false); return; }
    const { data: pu } = await supabase.from('users').select('id').eq('auth_id', session.user.id).single();
    if (!pu)  { setLoading(false); setRefreshing(false); return; }
    const { data } = await supabase
      .from('reservations')
      .select('*, restaurants(id, name, photo_url, cuisine_type, avg_rating, quartier, city)')
      .eq('user_id', pu.id)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });
    setReservations(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancelResa = (r) => {
    Alert.alert(
      'Annuler la réservation',
      `Annuler chez ${r.restaurants?.name || 'ce restaurant'} le ${fmtShort(r.date)} à ${r.time_slot?.slice(0,5)} ?`,
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui, annuler', style: 'destructive',
          onPress: async () => {
            await supabase.from('reservations')
              .update({ status:'cancelled', cancelled_at: new Date().toISOString() })
              .eq('id', r.id);
            load(true);
          },
        },
      ]
    );
  };

  const today      = todayStr();
  const aVenir     = reservations.filter(r => r.date >= today && ['confirmed','pending'].includes(r.status));
  const historique = reservations.filter(r => !aVenir.find(a => a.id === r.id));
  const next       = aVenir[0];
  const later      = aVenir.slice(1);
  const pending    = aVenir.filter(r => r.status === 'pending').length;

  // Grouper l'historique par mois
  const histByMonth = {};
  historique.forEach(r => {
    const key = fmtMonth(r.date);
    if (!histByMonth[key]) histByMonth[key] = [];
    histByMonth[key].push(r);
  });

  if (loading) return (
    <SafeAreaView style={s.root}>
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <View style={{ flex:1 }}>
          <Text style={s.headerSub}>MES RÉSERVATIONS</Text>
          <Text style={s.headerTitle}>
            {aVenir.length > 0
              ? next ? (next.date === today ? `Ce soir chez ${next.restaurants?.name || '…'}` : `Prochaine table ${daysUntil(next.date).toLowerCase()}`) : 'À venir'
              : 'Aucune réservation'
            }
          </Text>
        </View>
        {pending > 0 && (
          <View style={s.pendingPill}>
            <View style={s.pendingDot} />
            <Text style={s.pendingTxt}>{pending} en attente</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab==='avenir' && s.tabOn]} onPress={() => setTab('avenir')}>
          <Text style={[s.tabTxt, tab==='avenir' && s.tabTxtOn]}>À venir</Text>
          {aVenir.length > 0 && (
            <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{aVenir.length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab==='historique' && s.tabOn]} onPress={() => setTab('historique')}>
          <Text style={[s.tabTxt, tab==='historique' && s.tabTxtOn]}>Historique</Text>
          {historique.length > 0 && (
            <View style={[s.tabBadge, { backgroundColor:C.bg3 }]}>
              <Text style={[s.tabBadgeTxt, { color:C.dimmer }]}>{historique.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex:1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}
      >
        {/* ── À VENIR ── */}
        {tab === 'avenir' && (
          !next ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>📅</Text>
              <Text style={s.emptyTitle}>Aucune réservation à venir</Text>
              <Text style={s.emptySub}>Explorez les restaurants et réservez votre prochaine table.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation?.navigate('Explorer')}>
                <Text style={s.emptyBtnTxt}>Explorer les restaurants →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={s.sectionLbl}>PROCHAINE TABLE</Text>
              <NextCard
                r={next}
                onCancel={() => cancelResa(next)}
                onViewRestaurant={next.restaurants?.id
                  ? () => navigation?.navigate('Restaurant', { restaurant: next.restaurants })
                  : null
                }
              />

              {later.length > 0 && (
                <>
                  <Text style={[s.sectionLbl, { marginTop:20 }]}>
                    PLUS TARD  ·  {later.length}
                  </Text>
                  {later.map(r => (
                    <SmallCard
                      key={r.id}
                      r={r}
                      onCancel={() => cancelResa(r)}
                      onPress={() => r.restaurants?.id && navigation?.navigate('Restaurant', { restaurant: r.restaurants })}
                    />
                  ))}
                </>
              )}
            </>
          )
        )}

        {/* ── HISTORIQUE ── */}
        {tab === 'historique' && (
          historique.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🕰️</Text>
              <Text style={s.emptyTitle}>Aucun historique</Text>
              <Text style={s.emptySub}>Vos réservations passées apparaîtront ici.</Text>
            </View>
          ) : (
            Object.entries(histByMonth).map(([month, items]) => (
              <View key={month}>
                <Text style={s.monthLbl}>{month.toUpperCase()}</Text>
                {items.map(r => (
                  <HistCard
                    key={r.id}
                    r={r}
                    onPress={() => r.restaurants?.id && navigation?.navigate('Restaurant', { restaurant: r.restaurants })}
                    onReserveAgain={r.restaurants?.id
                      ? () => navigation?.navigate('ReservationForm', { restaurant: r.restaurants })
                      : null
                    }
                  />
                ))}
              </View>
            ))
          )
        )}

        <View style={{ height:100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:C.bg },

  /* Header */
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:16, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border },
  headerSub:   { color:C.accent, fontSize:9, letterSpacing:3, marginBottom:4 },
  headerTitle: { color:C.text, fontSize:20, fontWeight:'300', letterSpacing:0.3 },
  pendingPill: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(200,151,90,0.1)', borderRadius:100, paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor:'rgba(200,151,90,0.3)' },
  pendingDot:  { width:6, height:6, borderRadius:3, backgroundColor:C.accent },
  pendingTxt:  { color:C.accent, fontSize:11 },

  /* Tabs */
  tabs:       { flexDirection:'row', margin:16, backgroundColor:C.bg3, borderRadius:14, padding:4, borderWidth:1, borderColor:C.border, gap:3 },
  tab:        { flex:1, flexDirection:'row', paddingVertical:10, borderRadius:11, alignItems:'center', justifyContent:'center', gap:6 },
  tabOn:      { backgroundColor:C.bg2 },
  tabTxt:     { color:C.dim, fontSize:13, fontWeight:'300' },
  tabTxtOn:   { color:C.text, fontWeight:'400' },
  tabBadge:   { backgroundColor:C.accent, borderRadius:10, minWidth:18, height:18, alignItems:'center', justifyContent:'center', paddingHorizontal:4 },
  tabBadgeTxt:{ color:C.bg, fontSize:10, fontWeight:'600' },

  /* Section labels */
  sectionLbl: { color:C.dimmer, fontSize:9, letterSpacing:4, paddingHorizontal:20, marginBottom:12 },
  monthLbl:   { color:C.dimmer, fontSize:9, letterSpacing:3, paddingHorizontal:20, paddingTop:20, paddingBottom:10, borderBottomWidth:1, borderBottomColor:C.border },

  /* Empty */
  empty:      { alignItems:'center', paddingTop:80, gap:12 },
  emptyEmoji: { fontSize:52 },
  emptyTitle: { color:C.text, fontSize:16, fontWeight:'300' },
  emptySub:   { color:C.dim, fontSize:13, textAlign:'center', lineHeight:20, paddingHorizontal:32 },
  emptyBtn:   { backgroundColor:C.bg2, borderRadius:12, paddingHorizontal:20, paddingVertical:10, borderWidth:1, borderColor:C.border, marginTop:4 },
  emptyBtnTxt:{ color:C.accent2, fontSize:13 },
});
