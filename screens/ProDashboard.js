import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../supabase';

const C = {
  night: '#06080E', marine: '#1A2744', sea: '#2A6B9B',
  gold: '#C8965A', sun: '#E8C98A', cream: '#F7F2E8',
  gray: '#8A9BB0', card: '#0D1420', border: '#1A2535', green: '#5CC88A',
  red: '#C84040',
};

export default function ProDashboard() {
  const [reservations, setReservations] = useState([]);
  const [restoName, setRestoName] = useState('—');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: restos } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('owner_id', session.user.id);
    if (!restos || restos.length === 0) return;
    setRestoName(restos.map(r => r.name).join(' · '));
    const ids = restos.map(r => r.id);
    console.log('[ProDashboard] restaurant ids:', ids);
    const { data: res } = await supabase
      .from('reservations')
      .select('*, users(first_name, last_name), restaurants(name)')
      .in('restaurant_id', ids)
      .order('created_at', { ascending: false });
    console.log('[ProDashboard] reservations:', JSON.stringify(res, null, 2));
    if (res) setReservations(res);
  }

  async function handleConfirm(id) {
    const { error } = await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', id);
    if (!error) loadData();
    else Alert.alert('Erreur', error.message);
  }

  async function handleCancel(id) {
    const { error } = await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
    if (!error) loadData();
    else Alert.alert('Erreur', error.message);
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.logoName}> MIDA</Text>
          <View style={s.proBadge}><Text style={s.proBadgeTxt}>Manager</Text></View>
        </View>
      </View>
      <View style={s.restoBar}>
        <View style={s.restoEmoji}><Text style={{ fontSize: 22 }}>🥘</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.restoName}>{restoName.toUpperCase()}</Text>
          <Text style={s.restoLoc}>Alger</Text>
        </View>
        <View style={s.onlinePill}>
          <View style={s.onlineDot} />
          <Text style={s.onlineTxt}>En ligne</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.secHead}>
          <Text style={s.secTitle}>RÉSERVATIONS</Text>
          <Text style={s.secMore}>{reservations.length} total</Text>
        </View>
        {reservations.length === 0 && (
          <Text style={{ color: C.gray, textAlign: 'center', marginTop: 20 }}>Aucune réservation</Text>
        )}
        {reservations.map((r) => {
          const isPending = r.status === 'pending';
          const isCancelled = r.status === 'cancelled';
          const name = r.users ? r.users.first_name + ' ' + r.users.last_name : '—';
          const detail = (r.restaurants?.name || '') + ' · ' + (r.nb_adults || 0) + ' adultes' + (r.nb_children > 0 ? ' · ' + r.nb_children + ' enfants' : '') + ' · ' + r.date + ' · ' + (r.time_slot?.slice(0,5) || '');
          const statusLabel = isPending ? 'EN ATTENTE' : isCancelled ? 'ANNULÉ' : 'CONFIRMÉ';
          return (
            <View key={r.id} style={[s.resItem, isCancelled && { opacity: 0.5 }, isPending && { borderColor: 'rgba(200,150,90,0.4)' }]}>
              <Text style={s.resTime}>{r.time_slot?.slice(0,5)}</Text>
              <View style={s.resDivider} />
              <View style={{ flex: 1 }}>
                <Text style={s.resName}>{name}</Text>
                <Text style={s.resDetail}>{detail}</Text>
              </View>
              <View style={[s.resBadge, isPending && { backgroundColor: 'rgba(200,150,90,0.1)', borderColor: 'rgba(200,150,90,0.3)' }, isCancelled && { backgroundColor: 'rgba(200,64,64,0.1)', borderColor: 'rgba(200,64,64,0.25)' }, !isPending && !isCancelled && { backgroundColor: 'rgba(92,200,138,0.1)', borderColor: 'rgba(92,200,138,0.25)' }]}>
                <Text style={[s.resBadgeTxt, isPending && { color: C.gold }, isCancelled && { color: C.red }, !isPending && !isCancelled && { color: C.green }]}>{statusLabel}</Text>
              </View>
              {isPending && (
                <View style={s.resActions}>
                  <TouchableOpacity style={s.acceptBtn} onPress={() => handleConfirm(r.id)}>
                    <Text style={{ color: C.green, fontSize: 13 }}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => handleCancel(r.id)}>
                    <Text style={{ color: C.red, fontSize: 13 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      <TouchableOpacity style={s.signOutBtn} onPress={() => supabase.auth.signOut()}>
        <Text style={s.signOutTxt}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.night },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoName:    { color: C.cream, fontWeight: '700', fontSize: 16, letterSpacing: 4 },
  proBadge:    { backgroundColor: 'rgba(200,150,90,0.15)', borderWidth: 1, borderColor: 'rgba(200,150,90,0.3)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  proBadgeTxt: { color: C.gold, fontSize: 9, letterSpacing: 2, fontWeight: '600' },
  restoBar:    { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14 },
  restoEmoji:  { width: 46, height: 46, borderRadius: 12, backgroundColor: C.marine, alignItems: 'center', justifyContent: 'center' },
  restoName:   { color: C.cream, fontWeight: '700', fontSize: 13, letterSpacing: 1, marginBottom: 2 },
  restoLoc:    { color: C.gray, fontSize: 10 },
  onlinePill:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(92,200,138,0.1)', borderWidth: 1, borderColor: 'rgba(92,200,138,0.25)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  onlineDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  onlineTxt:   { color: C.green, fontSize: 10, fontWeight: '500' },
  secHead:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  secTitle:    { color: C.cream, fontSize: 10, fontWeight: '700', letterSpacing: 3 },
  secMore:     { color: C.sea, fontSize: 11 },
  resItem:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginHorizontal: 20, marginBottom: 8 },
  resTime:     { color: C.cream, fontWeight: '700', fontSize: 12, minWidth: 44, textAlign: 'center' },
  resDivider:  { width: 1, height: 36, backgroundColor: C.border },
  resName:     { color: C.cream, fontSize: 12, fontWeight: '500', marginBottom: 2 },
  resDetail:   { color: C.gray, fontSize: 10 },
  resBadge:    { borderWidth: 1, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  resBadgeTxt: { fontSize: 9, fontWeight: '600' },
  resActions:  { flexDirection: 'row', gap: 6 },
  acceptBtn:   { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(92,200,138,0.15)', borderWidth: 1, borderColor: 'rgba(92,200,138,0.3)', alignItems: 'center', justifyContent: 'center' },
  rejectBtn:   { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(200,64,64,0.12)', borderWidth: 1, borderColor: 'rgba(200,64,64,0.25)', alignItems: 'center', justifyContent: 'center' },
  signOutBtn:  { margin: 20, marginTop: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(200,64,64,0.25)', alignItems: 'center' },
  signOutTxt:  { color: C.red, fontSize: 13, fontWeight: '500', letterSpacing: 1 },
});
