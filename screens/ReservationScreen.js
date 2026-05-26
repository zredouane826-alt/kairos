import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#c0392b', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  return `Dans ${diff} jours`;
}

function statusCfg(status) {
  switch (status) {
    case 'confirmed': return { label: 'Confirmé', color: C.accent,  bg: 'rgba(200,151,90,0.2)',   border: 'rgba(200,151,90,0.4)' };
    case 'arrived':   return { label: 'Arrivé',   color: C.accent2, bg: 'rgba(74,127,165,0.12)',  border: 'rgba(74,127,165,0.2)' };
    case 'no_show':   return { label: 'No Show',  color: C.dim,     bg: 'rgba(138,154,176,0.1)', border: 'rgba(138,154,176,0.2)' };
    case 'cancelled': return { label: 'Annulé',   color: '#e74c3c', bg: 'rgba(192,57,43,0.1)',   border: 'rgba(192,57,43,0.2)' };
    default:          return { label: status,     color: C.dim,     bg: 'rgba(138,154,176,0.1)', border: 'rgba(138,154,176,0.2)' };
  }
}

export default function ReservationScreen() {
  const [tab, setTab] = useState('avenir');
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const u = session.user;
      setUserName(u.user_metadata?.name || u.user_metadata?.full_name || '');
      const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', u.id)
        .single();
      if (!publicUser) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('reservations')
        .select('*, restaurants(name)')
        .eq('user_id', publicUser.id)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });
      console.log('[ReservationScreen] data:', JSON.stringify(data), '| error:', error);
      setReservations(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const aVenir    = reservations.filter(r => r.date >= today && r.status === 'confirmed');
  const historique = reservations.filter(r => r.date < today  || r.status !== 'confirmed');
  const next  = aVenir[0];
  const later = aVenir.slice(1);

  if (loading) return (
    <View style={[s.container, { alignItems:'center', justifyContent:'center' }]}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Mes réservations</Text>
        <Text style={s.headerSub}>{userName ? `${userName} · ` : ''}{aVenir.length} à venir</Text>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab==='avenir' && s.tabOn]} onPress={() => setTab('avenir')}>
          <Text style={[s.tabTxt, tab==='avenir' && s.tabTxtOn]}>À venir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab==='historique' && s.tabOn]} onPress={() => setTab('historique')}>
          <Text style={[s.tabTxt, tab==='historique' && s.tabTxtOn]}>Historique</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1 }}>
        {tab === 'avenir' ? (
          !next ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>📅</Text>
              <Text style={s.emptyTxt}>Aucune réservation à venir</Text>
            </View>
          ) : <>
            <Text style={s.sectionLabel}>PROCHAINE RÉSERVATION</Text>

            {/* GRANDE CARD */}
            <View style={s.bigCard}>
              <View style={s.bigCardTop}>
                <Text style={s.bigEmoji}>🍽️</Text>
                <View style={{ flex:1 }}>
                  <Text style={s.bigName}>{next.restaurants?.name || '—'}</Text>
                </View>
                {(() => { const sc = statusCfg(next.status); return (
                  <View style={[s.badge, { backgroundColor:sc.bg, borderColor:sc.border }]}>
                    <Text style={[s.badgeTxt, { color:sc.color }]}>{sc.label}</Text>
                  </View>
                ); })()}
              </View>

              <View style={s.bigBody}>
                <View style={s.countdown}>
                  <Text style={s.countdownIcon}>⏳</Text>
                  <Text style={s.countdownTxt}>{daysUntil(next.date)} — {formatDate(next.date)}, {next.time_slot}</Text>
                </View>
                <View style={s.detailsGrid}>
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>DATE</Text>
                    <Text style={s.detailValue}>{formatDate(next.date)}</Text>
                  </View>
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>HEURE</Text>
                    <Text style={[s.detailValue, { color:C.accent2 }]}>{next.time_slot}</Text>
                  </View>
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>COUVERTS</Text>
                    <Text style={s.detailValue}>{next.nb_adults} pers.</Text>
                  </View>
                </View>
              </View>
            </View>

            {later.length > 0 && <>
              <Text style={[s.sectionLabel, { marginTop:20 }]}>PLUS TARD</Text>
              {later.map(r => {
                const sc = statusCfg(r.status);
                return (
                  <View key={r.id} style={s.smallItem}>
                    <View style={[s.smallThumb, { backgroundColor:C.bg3 }]}>
                      <Text style={{ fontSize:22 }}>🍽️</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={s.smallName}>{r.restaurants?.name || '—'}</Text>
                      <Text style={s.smallMeta}>{formatDate(r.date)} · {r.time_slot} · {r.nb_adults} pers.</Text>
                    </View>
                    <View style={[s.badge, { backgroundColor:sc.bg, borderColor:sc.border }]}>
                      <Text style={[s.badgeTxt, { color:sc.color }]}>{sc.label}</Text>
                    </View>
                  </View>
                );
              })}
            </>}
          </>
        ) : (
          historique.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🕰️</Text>
              <Text style={s.emptyTxt}>Aucun historique</Text>
            </View>
          ) : historique.map(r => {
            const sc = statusCfg(r.status);
            return (
              <View key={r.id} style={s.histItem}>
                <View style={[s.histThumb, { backgroundColor:C.bg3 }]}>
                  <Text style={{ fontSize:22 }}>🍽️</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.histName}>{r.restaurants?.name || '—'}</Text>
                  <Text style={s.histMeta}>{formatDate(r.date)} · {r.time_slot} · {r.nb_adults} pers.</Text>
                </View>
                <View style={[s.histBadge, { backgroundColor:sc.bg, borderColor:sc.border }]}>
                  <Text style={[s.histBadgeTxt, { color:sc.color }]}>{sc.label}</Text>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height:20 }} />
        <TouchableOpacity style={s.signOutBtn} onPress={() => supabase.auth.signOut()}>
          <Text style={s.signOutTxt}>Se déconnecter</Text>
        </TouchableOpacity>
        <View style={{ height:100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:C.bg },
  header:        { paddingHorizontal:24, paddingTop:56, paddingBottom:14, borderBottomWidth:1, borderBottomColor:C.border },
  headerTitle:   { color:C.text, fontSize:26, fontWeight:'300', letterSpacing:0.5, marginBottom:4 },
  headerSub:     { color:C.dim, fontSize:12, fontWeight:'300' },
  tabs:          { flexDirection:'row', margin:16, backgroundColor:C.bg3, borderRadius:12, padding:4, borderWidth:1, borderColor:C.border },
  tab:           { flex:1, paddingVertical:10, borderRadius:9, alignItems:'center' },
  tabOn:         { backgroundColor:C.bg2, shadowColor:'#000', shadowOpacity:0.3, shadowRadius:8 },
  tabTxt:        { color:C.dim, fontSize:13, fontWeight:'300', letterSpacing:0.5 },
  tabTxtOn:      { color:C.text, fontWeight:'400' },
  sectionLabel:  { color:C.dimmer, fontSize:10, letterSpacing:5, paddingHorizontal:24, marginBottom:12, textTransform:'uppercase' },
  bigCard:       { marginHorizontal:20, backgroundColor:C.card, borderRadius:20, borderWidth:1, borderColor:'rgba(200,151,90,0.2)', overflow:'hidden' },
  bigCardTop:    { backgroundColor:'#1a2e1a', padding:20, flexDirection:'row', alignItems:'center', gap:14 },
  bigEmoji:      { fontSize:36 },
  bigName:       { color:C.text, fontSize:20, fontWeight:'300', letterSpacing:0.5, marginBottom:4 },
  badge:         { borderWidth:1, borderRadius:100, paddingHorizontal:10, paddingVertical:4 },
  badgeTxt:      { fontSize:10, fontWeight:'400', letterSpacing:1 },
  bigBody:       { padding:18 },
  countdown:     { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(200,151,90,0.08)', borderWidth:1, borderColor:'rgba(200,151,90,0.15)', borderRadius:10, padding:12, marginBottom:16 },
  countdownIcon: { fontSize:14 },
  countdownTxt:  { color:C.accent, fontSize:12, fontWeight:'300', flex:1 },
  detailsGrid:   { flexDirection:'row', gap:10 },
  detailItem:    { flex:1, backgroundColor:'rgba(10,15,26,0.4)', borderRadius:10, padding:10, alignItems:'center' },
  detailLabel:   { color:C.dimmer, fontSize:9, letterSpacing:3, marginBottom:4 },
  detailValue:   { color:C.text, fontSize:13, fontWeight:'400' },
  smallItem:     { flexDirection:'row', alignItems:'center', gap:14, marginHorizontal:20, marginBottom:10, backgroundColor:C.bg2, borderRadius:14, padding:14, borderWidth:1, borderColor:C.border },
  smallThumb:    { width:48, height:48, borderRadius:12, alignItems:'center', justifyContent:'center' },
  smallName:     { color:C.text, fontSize:14, fontWeight:'300', marginBottom:3 },
  smallMeta:     { color:C.dim, fontSize:11, fontWeight:'300' },
  histItem:      { flexDirection:'row', alignItems:'center', gap:14, paddingVertical:14, paddingHorizontal:24, borderBottomWidth:1, borderBottomColor:C.border },
  histThumb:     { width:46, height:46, borderRadius:12, alignItems:'center', justifyContent:'center' },
  histName:      { color:C.text, fontSize:14, fontWeight:'300', marginBottom:3 },
  histMeta:      { color:C.dim, fontSize:11, fontWeight:'300' },
  histBadge:     { borderWidth:1, borderRadius:100, paddingHorizontal:8, paddingVertical:3 },
  histBadgeTxt:  { fontSize:10 },
  empty:         { alignItems:'center', justifyContent:'center', paddingTop:80, gap:12 },
  emptyEmoji:    { fontSize:48 },
  emptyTxt:      { color:C.dim, fontSize:14, fontWeight:'300' },
  signOutBtn:    { marginHorizontal:24, marginTop:8, paddingVertical:14, borderRadius:12, borderWidth:1, borderColor:'rgba(192,57,43,0.25)', alignItems:'center' },
  signOutTxt:    { color:C.red, fontSize:13, fontWeight:'500', letterSpacing:1 },
});
