import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, ActivityIndicator } from 'react-native';
import { supabase } from './supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332', card:'#141e2e',
  accent:'#c8975a', accent2:'#4a7fa5', green:'#3d9970', red:'#c0392b',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  border:'rgba(255,255,255,0.07)',
};

const STATUS_LABEL = { confirmed:'Confirmé', arrived:'Arrivé', no_show:'No Show', cancelled:'Annulé' };
const STATUS_COLOR = { confirmed: C.green, arrived: C.accent2, no_show: C.dim, cancelled: C.red };
const FILTERS = ['Toutes', 'confirmed', 'arrived', 'no_show', 'cancelled'];
const FILTER_LABEL = { Toutes:'Toutes', confirmed:'Confirmées', arrived:'Arrivés', no_show:'No Show', cancelled:'Annulées' };

function StatCard({ label, value, color }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statValue, { color: color || C.text }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ReservationCard({ item, onConfirm, onCancel }) {
  const restaurant = item.restaurants?.name || item.restaurant_id;
  const isToday = item.date === new Date().toISOString().split('T')[0];
  return (
    <View style={s.resaCard}>
      <View style={s.resaTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.resaRestaurant}>{restaurant}</Text>
          <Text style={s.resaMeta}>
            {item.date} · {item.time_slot} · {item.nb_adults} pers.
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[s.statusBadge, { borderColor: STATUS_COLOR[item.status] + '55', backgroundColor: STATUS_COLOR[item.status] + '15' }]}>
            <Text style={[s.statusTxt, { color: STATUS_COLOR[item.status] }]}>
              {STATUS_LABEL[item.status] || item.status}
            </Text>
          </View>
          {isToday && <Text style={s.todayTag}>AUJOURD'HUI</Text>}
        </View>
      </View>
      {item.status === 'confirmed' && (
        <View style={s.resaActions}>
          <TouchableOpacity style={s.btnConfirm} onPress={() => onConfirm(item.id)}>
            <Text style={s.btnConfirmTxt}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnCancel} onPress={() => onCancel(item.id)}>
            <Text style={s.btnCancelTxt}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ProDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Toutes');

  const today = new Date().toISOString().split('T')[0];

  async function fetchReservations() {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, restaurants(name)')
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });
    if (!error && data) setReservations(data);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { fetchReservations(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchReservations(); }, []);

  async function updateStatus(id, status) {
    await supabase.from('reservations').update({ status }).eq('id', id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  const displayed = filter === 'Toutes' ? reservations : reservations.filter(r => r.status === filter);
  const countToday = reservations.filter(r => r.date === today).length;
  const countPending = reservations.filter(r => r.status === 'confirmed').length;
  const countConfirmed = reservations.filter(r => r.status === 'confirmed').length;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>tableau de bord</Text>
          <Text style={s.headerTitle}>MIDA Pro</Text>
        </View>
        <View style={s.proBadge}><Text style={s.proBadgeTxt}>MANAGER</Text></View>
      </View>

      <View style={s.statsRow}>
        <StatCard label="Aujourd'hui" value={countToday} color={C.accent2} />
        <StatCard label="En attente" value={countPending} color={C.accent} />
        <StatCard label="Confirmées" value={countConfirmed} color={C.green} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersScroll} contentContainerStyle={s.filtersContent}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.filterChip, filter === f && s.filterChipOn]} onPress={() => setFilter(f)}>
            <Text style={[s.filterTxt, filter === f && s.filterTxtOn]}>{FILTER_LABEL[f]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        >
          {displayed.length === 0 ? (
            <View style={s.centered}>
              <Text style={s.emptyTxt}>Aucune réservation</Text>
            </View>
          ) : (
            displayed.map(item => (
              <ReservationCard
                key={item.id}
                item={item}
                onConfirm={id => updateStatus(id, 'confirmed')}
                onCancel={id => updateStatus(id, 'cancelled')}
              />
            ))
          )}
          <TouchableOpacity style={s.logoutBtn} onPress={() => supabase.auth.signOut()}>
            <Text style={s.logoutTxt}>Se déconnecter</Text>
          </TouchableOpacity>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  headerSub:      { color: C.accent, fontSize: 10, letterSpacing: 2, fontStyle: 'italic', marginBottom: 2 },
  headerTitle:    { color: C.text, fontSize: 24, fontWeight: '300', letterSpacing: 4 },
  proBadge:       { borderWidth: 1, borderColor: 'rgba(200,151,90,0.4)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(200,151,90,0.08)' },
  proBadgeTxt:    { color: C.accent, fontSize: 10, letterSpacing: 2 },
  statsRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  statCard:       { flex: 1, backgroundColor: C.bg2, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statValue:      { fontSize: 28, fontWeight: '300', marginBottom: 4 },
  statLabel:      { color: C.dimmer, fontSize: 10, letterSpacing: 1, textAlign: 'center' },
  filtersScroll:  { flexGrow: 0, marginBottom: 8 },
  filtersContent: { paddingHorizontal: 20, gap: 8 },
  filterChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  filterChipOn:   { backgroundColor: 'rgba(200,151,90,0.12)', borderColor: C.accent },
  filterTxt:      { color: C.dim, fontSize: 12 },
  filterTxtOn:    { color: C.accent },
  resaCard:       { marginHorizontal: 20, marginBottom: 10, backgroundColor: C.bg2, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  resaTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  resaRestaurant: { color: C.text, fontSize: 15, fontWeight: '300', marginBottom: 4 },
  resaMeta:       { color: C.dim, fontSize: 12 },
  statusBadge:    { borderWidth: 1, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 3 },
  statusTxt:      { fontSize: 10, letterSpacing: 0.5 },
  todayTag:       { color: C.accent2, fontSize: 9, letterSpacing: 1 },
  resaActions:    { flexDirection: 'row', gap: 8, marginTop: 12 },
  btnConfirm:     { flex: 1, backgroundColor: 'rgba(61,153,112,0.12)', borderWidth: 1, borderColor: 'rgba(61,153,112,0.25)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnConfirmTxt:  { color: C.green, fontSize: 12, fontWeight: '400' },
  btnCancel:      { flex: 1, backgroundColor: 'rgba(192,57,43,0.08)', borderWidth: 1, borderColor: 'rgba(192,57,43,0.2)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnCancelTxt:   { color: C.red, fontSize: 12, fontWeight: '400' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTxt:       { color: C.dimmer, fontSize: 13, letterSpacing: 1 },
  logoutBtn:      { marginHorizontal: 20, marginTop: 10, padding: 14, borderRadius: 14, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  logoutTxt:      { color: '#e74c3c', fontSize: 13, fontWeight: '300' },
});
