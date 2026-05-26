import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { supabase } from '../supabase';

const C = { bg:'#0d1628', bg2:'#111827', bg3:'#1a2332', accent:'#c8975a', accent2:'#4a7fa5', text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568', green:'#3d9970', card:'#141e2e', border:'rgba(255,255,255,0.07)', red:'#c0392b' };

const heures = ['12:00','12:30','13:00','13:30','19:00','19:30','20:00','20:30','21:00','21:30'];
const couverts = [1,2,3,4,5,6,7,8];
const enfants  = [0,1,2,3,4,5,6];

const jours = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: d.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' }),
      value: d.toISOString().split('T')[0],
    });
  }
  return days;
};

export default function ReservationFormScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || { name:'Dar Zitoun', id:'1' };
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHeure, setSelectedHeure] = useState(null);
  const [selectedCouverts, setSelectedCouverts] = useState(2);
  const [selectedEnfants, setSelectedEnfants] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const days = jours();

  async function confirmerReservation() {
    if (!selectedDate || !selectedHeure) {
      setError('Choisissez une date et une heure');
      return;
    }
    setLoading(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Connectez-vous d\'abord'); setLoading(false); return; }
    const { data: publicUser, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();
    if (userErr || !publicUser) { setError('Utilisateur introuvable'); setLoading(false); return; }
    console.log('[INSERT] public user_id:', publicUser.id, '| restaurant_id:', restaurant.id);
    const { error: err } = await supabase.from('reservations').insert({
      user_id: publicUser.id,
      restaurant_id: restaurant.id,
      date: selectedDate,
      time_slot: selectedHeure,
      nb_adults: selectedCouverts,
      nb_children: selectedEnfants,
    });
    if (err) { setError(err.message); } else { setSuccess(true); }
    setLoading(false);
  }

  if (success) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.successWrap}>
          <Text style={s.successEmoji}>✅</Text>
          <Text style={s.successTitle}>Réservation confirmée</Text>
          <Text style={s.successSub}>{restaurant.name} · {selectedDate} · {selectedHeure} · {selectedCouverts} pers.</Text>
          <TouchableOpacity style={s.successBtn} onPress={() => navigation.navigate('Main')}>
            <Text style={s.successBtnTxt}>RETOUR À L'ACCUEIL</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={s.headerSub}>réserver</Text>
          <Text style={s.headerTitle}>{restaurant.name}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <Text style={s.sectionLabel}>DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft:20, marginBottom:8 }}>
          {days.map((d, i) => (
            <TouchableOpacity key={i} style={[s.dateChip, selectedDate===d.value && s.dateChipOn]} onPress={() => setSelectedDate(d.value)}>
              <Text style={[s.dateTxt, selectedDate===d.value && s.dateTxtOn]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.sectionLabel}>HEURE</Text>
        <View style={s.heuresGrid}>
          {heures.map((h, i) => (
            <TouchableOpacity key={i} style={[s.heureChip, selectedHeure===h && s.heureChipOn]} onPress={() => setSelectedHeure(h)}>
              <Text style={[s.heureTxt, selectedHeure===h && s.heureTxtOn]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>ADULTES</Text>
        <View style={s.couvertsRow}>
          {couverts.map((n) => (
            <TouchableOpacity key={n} style={[s.couvertChip, selectedCouverts===n && s.couvertChipOn]} onPress={() => setSelectedCouverts(n)}>
              <Text style={[s.couvertTxt, selectedCouverts===n && s.couvertTxtOn]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>ENFANTS</Text>
        <View style={s.couvertsRow}>
          {enfants.map((n) => (
            <TouchableOpacity key={n} style={[s.couvertChip, selectedEnfants===n && s.couvertChipOn]} onPress={() => setSelectedEnfants(n)}>
              <Text style={[s.couvertTxt, selectedEnfants===n && s.couvertTxtOn]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>RÉCAPITULATIF</Text>
          <View style={s.summaryRow}><Text style={s.summaryLbl}>Restaurant</Text><Text style={s.summaryVal}>{restaurant.name}</Text></View>
          <View style={s.summaryRow}><Text style={s.summaryLbl}>Date</Text><Text style={s.summaryVal}>{selectedDate || '—'}</Text></View>
          <View style={s.summaryRow}><Text style={s.summaryLbl}>Heure</Text><Text style={[s.summaryVal, { color:C.accent2 }]}>{selectedHeure || '—'}</Text></View>
          <View style={s.summaryRow}><Text style={s.summaryLbl}>Couverts</Text><Text style={s.summaryVal}>{selectedCouverts} personne{selectedCouverts > 1 ? 's' : ''}</Text></View>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={s.confirmBtn} onPress={confirmerReservation} disabled={loading}>
          <Text style={s.confirmBtnTxt}>{loading ? '...' : 'CONFIRMER LA RÉSERVATION'}</Text>
        </TouchableOpacity>

        <View style={{ height:60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{ flex:1, backgroundColor:C.bg }, header:{ flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:20, paddingTop:56, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border }, backBtn:{ width:38, height:38, borderRadius:19, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' }, backBtnTxt:{ color:C.text, fontSize:18 }, headerSub:{ color:C.accent, fontSize:10, fontStyle:'italic', letterSpacing:2 }, headerTitle:{ color:C.text, fontSize:20, fontWeight:'300', letterSpacing:0.5 }, sectionLabel:{ color:C.dimmer, fontSize:10, letterSpacing:5, paddingHorizontal:20, marginTop:20, marginBottom:12, textTransform:'uppercase' }, dateChip:{ paddingHorizontal:14, paddingVertical:10, borderRadius:12, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, marginRight:8, alignItems:'center' }, dateChipOn:{ backgroundColor:'rgba(200,151,90,0.12)', borderColor:C.accent }, dateTxt:{ color:C.dim, fontSize:12, fontWeight:'300' }, dateTxtOn:{ color:C.accent }, heuresGrid:{ flexDirection:'row', flexWrap:'wrap', gap:10, paddingHorizontal:20 }, heureChip:{ width:'22%', paddingVertical:12, borderRadius:12, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, alignItems:'center' }, heureChipOn:{ backgroundColor:'rgba(74,127,165,0.15)', borderColor:C.accent2 }, heureTxt:{ color:C.dim, fontSize:13 }, heureTxtOn:{ color:C.accent2, fontWeight:'400' }, couvertsRow:{ flexDirection:'row', flexWrap:'wrap', gap:10, paddingHorizontal:20 }, couvertChip:{ width:44, height:44, borderRadius:22, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' }, couvertChipOn:{ backgroundColor:'rgba(200,151,90,0.12)', borderColor:C.accent }, couvertTxt:{ color:C.dim, fontSize:14 }, couvertTxtOn:{ color:C.accent, fontWeight:'400' }, summaryCard:{ margin:20, backgroundColor:C.bg2, borderRadius:16, borderWidth:1, borderColor:'rgba(200,151,90,0.2)', padding:16 }, summaryTitle:{ color:C.dimmer, fontSize:9, letterSpacing:4, marginBottom:14 }, summaryRow:{ flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:1, borderBottomColor:C.border }, summaryLbl:{ color:C.dim, fontSize:13 }, summaryVal:{ color:C.text, fontSize:13, fontWeight:'300' }, error:{ color:C.red, fontSize:12, textAlign:'center', marginHorizontal:20, marginBottom:12 }, confirmBtn:{ marginHorizontal:20, backgroundColor:C.accent, borderRadius:14, paddingVertical:16, alignItems:'center' }, confirmBtnTxt:{ color:C.bg, fontSize:13, fontWeight:'500', letterSpacing:2 }, successWrap:{ flex:1, alignItems:'center', justifyContent:'center', padding:40 }, successEmoji:{ fontSize:64, marginBottom:20 }, successTitle:{ color:C.text, fontSize:24, fontWeight:'300', letterSpacing:0.5, marginBottom:10 }, successSub:{ color:C.dim, fontSize:13, textAlign:'center', lineHeight:20, marginBottom:32 }, successBtn:{ backgroundColor:C.accent, borderRadius:14, paddingVertical:14, paddingHorizontal:32 }, successBtnTxt:{ color:C.bg, fontSize:13, fontWeight:'500', letterSpacing:2 },
});
