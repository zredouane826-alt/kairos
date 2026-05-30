import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, Image, RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';

const SW = Dimensions.get('window').width;

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
  confirmed: { label:'Confirmé',   color: colors.green,    bg: colors.greenSoft,  border:'rgba(76,175,130,0.3)'   },
  pending:   { label:'En attente', color: colors.accent,   bg: colors.accentSoft, border:'rgba(232,160,69,0.3)'   },
  arrived:   { label:'Arrivé',     color: colors.blue,     bg: colors.blueSoft,   border:'rgba(90,155,224,0.25)'  },
  no_show:   { label:'No Show',    color: colors.textMuted, bg:'rgba(138,154,176,0.1)', border:'rgba(138,154,176,0.2)' },
  cancelled: { label:'Annulé',     color: colors.red,      bg: colors.redSoft,    border:'rgba(224,90,90,0.25)'   },
  completed: { label:'Terminé',    color: colors.textDim,  bg:'rgba(74,74,74,0.1)', border:'rgba(74,74,74,0.2)'   },
};

function statusCfg(s) { return SC[s] || SC.pending; }

function Thumb({ url, size = 52 }) {
  if (url) return <Image source={{ uri: url }} style={{ width:size, height:size, borderRadius: radius.xl }} resizeMode="cover" />;
  return (
    <View style={{ width:size, height:size, borderRadius: radius.xl, backgroundColor: colors.cardHover, alignItems:'center', justifyContent:'center' }}>
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
  wrap: { borderWidth:1, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  txt:  { fontSize: typography.size.sm, fontWeight: typography.weight.regular, letterSpacing:0.3 },
});

/* ─── Grande carte prochaine réservation ─── */
function NextCard({ r, onCancel, onViewRestaurant }) {
  const sc    = statusCfg(r.status);
  const resto = r.restaurants || {};
  const diff  = Math.round((new Date(r.date+'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000);
  const urgentColor = diff === 0 ? colors.accent : diff === 1 ? colors.green : colors.blue;

  return (
    <View style={nc.card}>
      <View style={nc.photoWrap}>
        {resto.photo_url
          ? <Image source={{ uri: resto.photo_url }} style={nc.photo} resizeMode="cover" />
          : <View style={[nc.photo, { backgroundColor: colors.cardHover, alignItems:'center', justifyContent:'center' }]}>
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

      <View style={nc.body}>
        <View style={[nc.countdown, { borderColor: urgentColor+'40', backgroundColor: urgentColor+'0d' }]}>
          <Text style={[nc.countdownLabel, { color: urgentColor }]}>
            {diff === 0 ? '🎉' : diff === 1 ? '⏰' : '📅'}
            {'  '}{daysUntil(r.date)}
          </Text>
          <Text style={[nc.countdownDate, { color: urgentColor }]}>{fmtLong(r.date)}</Text>
        </View>

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

        {!!r.notes && (
          <View style={nc.note}>
            <Text style={nc.noteLbl}>💬  Note</Text>
            <Text style={nc.noteTxt}>{r.notes}</Text>
          </View>
        )}

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
  card:         { marginHorizontal: spacing.xl, backgroundColor: colors.card, borderRadius: radius.pill, borderWidth:1, borderColor:'rgba(232,160,69,0.2)', overflow:'hidden', marginBottom: spacing.md },
  photoWrap:    { height:200, position:'relative' },
  photo:        { ...StyleSheet.absoluteFillObject },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(15,13,11,0.45)' },
  photoTop:     { position:'absolute', top: spacing.xl, left: spacing.xl, right: spacing.xl, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  ratingPill:   { backgroundColor:'rgba(15,13,11,0.72)', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth:1, borderColor:'rgba(232,160,69,0.4)' },
  ratingTxt:    { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.medium },
  photoBottom:  { position:'absolute', bottom:0, left:0, right:0, padding: spacing.xl, backgroundColor:'rgba(15,13,11,0.65)' },
  photoCuisine: { color:'rgba(232,160,69,0.85)', fontSize: typography.size.xs, letterSpacing:2.5, marginBottom:3 },
  photoName:    { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing:0.3, marginBottom:2 },
  photoQuartier:{ color:'rgba(240,235,227,0.65)', fontSize: typography.size.caption },
  body:         { padding: spacing.xl, gap: spacing.lg },
  countdown:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  countdownLabel:{ fontSize: typography.size.subheading, fontWeight: typography.weight.medium },
  countdownDate: { fontSize: typography.size.body, fontWeight: typography.weight.regular },
  details:      { flexDirection:'row', backgroundColor:'rgba(0,0,0,0.2)', borderRadius: radius.xl, overflow:'hidden' },
  detailItem:   { flex:1, flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  detailSep:    { width:1, backgroundColor: colors.cardBorder, marginVertical: spacing.md },
  detailIcon:   { fontSize: typography.size.heading2 },
  detailLbl:    { color: colors.textDim, fontSize: typography.size.xs, letterSpacing:2, marginBottom:3 },
  detailVal:    { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular },
  note:         { backgroundColor: colors.cardHover, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.cardBorder },
  noteLbl:      { color: colors.textMuted, fontSize: typography.size.sm, letterSpacing:1, marginBottom: spacing.xs },
  noteTxt:      { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular, lineHeight:18 },
  actions:      { gap: spacing.md },
  viewBtn:      { backgroundColor: colors.blueSoft, borderWidth:1, borderColor:'rgba(90,155,224,0.25)', borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems:'center' },
  viewBtnTxt:   { color: colors.blue, fontSize: typography.size.bodyLg },
  cancelBtn:    { borderWidth:1, borderColor:'rgba(224,90,90,0.3)', borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems:'center', backgroundColor: colors.redSoft },
  cancelTxt:    { color: colors.red, fontSize: typography.size.bodyLg },
});

/* ─── Petite carte "plus tard" ─── */
function SmallCard({ r, onCancel, onPress }) {
  const days = daysUntil(r.date);
  return (
    <TouchableOpacity style={sc2.card} onPress={onPress} activeOpacity={0.85}>
      <Thumb url={r.restaurants?.photo_url} size={56} />
      <View style={{ flex:1 }}>
        <Text style={sc2.name} numberOfLines={1}>{r.restaurants?.name || '—'}</Text>
        <Text style={sc2.meta}>{fmtShort(r.date)} · {r.time_slot?.slice(0,5)} · {(r.nb_adults||0)+(r.nb_children||0)} pers.</Text>
        <Text style={[sc2.countdown, { color: days === 'Demain' ? colors.green : colors.blue }]}>
          {days}
        </Text>
      </View>
      <View style={{ alignItems:'flex-end', gap: spacing.sm }}>
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
  card:      { flexDirection:'row', alignItems:'center', gap: spacing.lg, marginHorizontal: spacing.xl, marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: radius.xxl, padding: spacing.xl, borderWidth:1, borderColor: colors.cardBorder },
  name:      { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular, marginBottom:3 },
  meta:      { color: colors.textMuted, fontSize: typography.size.caption, marginBottom:3 },
  countdown: { fontSize: typography.size.caption, fontWeight: typography.weight.regular },
  cancelTxt: { color: colors.red, fontSize: typography.size.caption },
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
          <TouchableOpacity onPress={onReserveAgain} style={{ marginTop: spacing.xs }}>
            <Text style={hc.reBook}>Réserver à nouveau →</Text>
          </TouchableOpacity>
        )}
      </View>
      <Badge status={r.status} />
    </TouchableOpacity>
  );
}
const hc = StyleSheet.create({
  card:   { flexDirection:'row', alignItems:'center', gap: spacing.lg, paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl, borderBottomWidth:1, borderBottomColor: colors.cardBorder, borderLeftWidth:3 },
  name:   { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular, marginBottom:3 },
  meta:   { color: colors.textMuted, fontSize: typography.size.caption, marginBottom:2 },
  note:   { color: colors.textDim, fontSize: typography.size.sm },
  reBook: { color: colors.blue, fontSize: typography.size.caption, fontWeight: typography.weight.regular },
});

/* ─── Skeleton loading ─── */
function SkeletonView() {
  return (
    <View>
      <View style={{ marginHorizontal: spacing.xl, marginTop: spacing.xl, gap: spacing.lg }}>
        <MLoader width="100%" height={200} borderRadius={radius.pill} />
        <MLoader width="100%" height={60} borderRadius={radius.lg} />
        <MLoader width="100%" height={72} borderRadius={radius.xl} />
      </View>
      <View style={{ marginHorizontal: spacing.xl, marginTop: spacing.xxl, gap: spacing.md }}>
        <MLoader width="40%" height={9} borderRadius={radius.sm} />
        {[1,2].map(i => (
          <MLoader key={i} width="100%" height={84} borderRadius={radius.xxl} />
        ))}
      </View>
    </View>
  );
}

/* ─── Écran principal ─── */
export default function ReservationScreen({ navigation }) {
  const [tab,          setTab]          = useState('avenir');
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [reservations, setReservations] = useState([]);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: pu } = await supabase.from('users').select('id').eq('auth_id', session.user.id).single();
      if (!pu) return;
      const { data } = await supabase
        .from('reservations')
        .select('*, restaurants(id, name, photo_url, cuisine_type, avg_rating, quartier, city)')
        .eq('user_id', pu.id)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });
      setReservations(data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancelResa = useCallback((r) => {
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
  }, [load]);

  const today = useMemo(() => todayStr(), []);

  const aVenir = useMemo(
    () => reservations.filter(r => r.date >= today && ['confirmed','pending'].includes(r.status)),
    [reservations, today],
  );

  const historique = useMemo(
    () => reservations.filter(r => !aVenir.find(a => a.id === r.id)),
    [reservations, aVenir],
  );

  const { next, later } = useMemo(() => ({ next: aVenir[0], later: aVenir.slice(1) }), [aVenir]);
  const pending = useMemo(() => aVenir.filter(r => r.status === 'pending').length, [aVenir]);

  const onRefresh     = useCallback(() => load(true), [load]);
  const goAvenir      = useCallback(() => setTab('avenir'), []);
  const goHistorique  = useCallback(() => setTab('historique'), []);
  const goExplorer    = useCallback(() => navigation?.navigate('Explorer'), [navigation]);
  const onCancelNext  = useCallback(() => next && cancelResa(next), [cancelResa, next]);
  const onViewNext    = useCallback(
    () => next?.restaurants?.id && navigation?.navigate('Restaurant', { restaurant: next.restaurants }),
    [navigation, next],
  );

  const histByMonth = useMemo(() => {
    const groups = {};
    historique.forEach(r => {
      const key = fmtMonth(r.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [historique]);

  if (loading) return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <MLoader width={100} height={9} borderRadius={radius.sm} />
          <MLoader width={200} height={20} borderRadius={radius.sm} />
        </View>
      </View>
      <SkeletonView />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>

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

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab==='avenir' && s.tabOn]} onPress={goAvenir}>
          <Text style={[s.tabTxt, tab==='avenir' && s.tabTxtOn]}>À venir</Text>
          {aVenir.length > 0 && (
            <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{aVenir.length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab==='historique' && s.tabOn]} onPress={goHistorique}>
          <Text style={[s.tabTxt, tab==='historique' && s.tabTxtOn]}>Historique</Text>
          {historique.length > 0 && (
            <View style={[s.tabBadge, { backgroundColor: colors.cardHover }]}>
              <Text style={[s.tabBadgeTxt, { color: colors.textDim }]}>{historique.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex:1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {tab === 'avenir' && (
          !next ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>📅</Text>
              <Text style={s.emptyTitle}>Aucune réservation à venir</Text>
              <Text style={s.emptySub}>Explorez les restaurants et réservez votre prochaine table.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={goExplorer}>
                <Text style={s.emptyBtnTxt}>Explorer les restaurants →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={s.sectionLbl}>PROCHAINE TABLE</Text>
              <NextCard
                r={next}
                onCancel={onCancelNext}
                onViewRestaurant={next?.restaurants?.id ? onViewNext : null}
              />

              {later.length > 0 && (
                <>
                  <Text style={[s.sectionLbl, { marginTop: spacing.xxl }]}>
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
  root: { flex:1, backgroundColor: colors.bg },

  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth:1, borderBottomColor: colors.cardBorder },
  headerSub:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing:3, marginBottom: spacing.xs },
  headerTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing:0.3 },
  pendingPill: { flexDirection:'row', alignItems:'center', gap: spacing.sm, backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  pendingDot:  { width:6, height:6, borderRadius:3, backgroundColor: colors.accent },
  pendingTxt:  { color: colors.accent, fontSize: typography.size.caption },

  tabs:       { flexDirection:'row', margin: spacing.xl, backgroundColor: colors.cardHover, borderRadius: radius.xl, padding: spacing.xs, borderWidth:1, borderColor: colors.cardBorder, gap: spacing.xxs },
  tab:        { flex:1, flexDirection:'row', paddingVertical: spacing.md, borderRadius: radius.lg, alignItems:'center', justifyContent:'center', gap: spacing.sm },
  tabOn:      { backgroundColor: colors.card },
  tabTxt:     { color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  tabTxtOn:   { color: colors.text, fontWeight: typography.weight.regular },
  tabBadge:   { backgroundColor: colors.accent, borderRadius: radius.md, minWidth:18, height:18, alignItems:'center', justifyContent:'center', paddingHorizontal: spacing.xs },
  tabBadgeTxt:{ color: colors.bg, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },

  sectionLbl: { color: colors.textDim, fontSize: typography.size.xs, letterSpacing:4, paddingHorizontal: spacing.xxl, marginBottom: spacing.lg },
  monthLbl:   { color: colors.textDim, fontSize: typography.size.xs, letterSpacing:3, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: spacing.md, borderBottomWidth:1, borderBottomColor: colors.cardBorder },

  empty:      { alignItems:'center', paddingTop:80, gap: spacing.lg },
  emptyEmoji: { fontSize:52 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.regular },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign:'center', lineHeight:20, paddingHorizontal: spacing.section },
  emptyBtn:   { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderWidth:1, borderColor: colors.cardBorder, marginTop: spacing.xs },
  emptyBtnTxt:{ color: colors.blue, fontSize: typography.size.bodyLg },
});
