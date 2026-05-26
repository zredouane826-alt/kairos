import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const C = {
  bg:'#0a0f1a', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#c0392b', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
};

const aVenir = [
  { name:'Atlas Grill', lieu:'Didouche Mourad · Alger', date:'Ven. 21 mai', heure:'20h00', couverts:'2 pers.', statut:'Confirmé', emoji:'🍲', bg:'linear-gradient(135deg, #1a2e1a, #243d24)' },
  { name:'Le Corsaire', lieu:'Hydra · Alger', date:'Sam. 28 mai', heure:'19h30', couverts:'4 pers.', statut:'A venir', emoji:'🐟', bg:'#1a1e2e' },
];

const historique = [
  { name:'Cafe Tantonville', date:'Dim. 10 mai · 17h00 · 2 pers.', statut:'Passe', emoji:'☕', bg:'#1e2a1a' },
  { name:'Dar Zitoun', date:'Sam. 2 mai · 20h30 · 3 pers.', statut:'Passe', emoji:'🥘', bg:'#2a1e1a' },
  { name:'Atlas Grill', date:'Ven. 18 avr. · 19h00 · 2 pers.', statut:'Passe', emoji:'🍲', bg:'#1a2e1a' },
  { name:'Le Corsaire', date:'Sam. 5 avr. · 20h00 · 2 pers.', statut:'Annule', emoji:'🐟', bg:'#1a1e2e' },
];

export default function ReservationScreen() {
  const [tab, setTab] = useState('avenir');

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Mes réservations</Text>
        <Text style={s.headerSub}>Redouane · {aVenir.length} à venir</Text>
      </View>

      {/* TABS */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab==='avenir' && s.tabOn]} onPress={() => setTab('avenir')}>
          <Text style={[s.tabTxt, tab==='avenir' && s.tabTxtOn]}>À venir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab==='historique' && s.tabOn]} onPress={() => setTab('historique')}>
          <Text style={[s.tabTxt, tab==='historique' && s.tabTxtOn]}>Historique</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {tab === 'avenir' ? (
          <>
            <Text style={s.sectionLabel}>PROCHAINE RÉSERVATION</Text>

            {/* GRANDE CARD */}
            <View style={s.bigCard}>
              <View style={s.bigCardTop}>
                <Text style={s.bigEmoji}>{aVenir[0].emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.bigName}>{aVenir[0].name}</Text>
                  <Text style={s.bigLieu}>{aVenir[0].lieu}</Text>
                </View>
                <View style={s.confirmedBadge}>
                  <Text style={s.confirmedTxt}>{aVenir[0].statut}</Text>
                </View>
              </View>

              <View style={s.bigBody}>
                <View style={s.countdown}>
                  <Text style={s.countdownIcon}>⏳</Text>
                  <Text style={s.countdownTxt}>Dans 2 jours — vendredi 21 mai, 20h00</Text>
                </View>

                <View style={s.detailsGrid}>
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>DATE</Text>
                    <Text style={s.detailValue}>{aVenir[0].date}</Text>
                  </View>
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>HEURE</Text>
                    <Text style={[s.detailValue, { color: C.accent2 }]}>{aVenir[0].heure}</Text>
                  </View>
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>COUVERTS</Text>
                    <Text style={s.detailValue}>{aVenir[0].couverts}</Text>
                  </View>
                </View>

                <View style={s.actions}>
                  <TouchableOpacity style={s.btnModify}>
                    <Text style={s.btnModifyTxt}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnCancel}>
                    <Text style={s.btnCancelTxt}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={[s.sectionLabel, { marginTop: 20 }]}>PLUS TARD</Text>

            <View style={s.smallItem}>
              <View style={[s.smallThumb, { backgroundColor: '#1a1e2e' }]}>
                <Text style={{ fontSize: 24 }}>{aVenir[1].emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.smallName}>{aVenir[1].name}</Text>
                <Text style={s.smallMeta}>{aVenir[1].lieu}</Text>
                <Text style={s.smallMeta}>{aVenir[1].date} · {aVenir[1].heure} · {aVenir[1].couverts}</Text>
              </View>
              <View style={s.aVenirBadge}>
                <Text style={s.aVenirBadgeTxt}>À venir</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={s.sectionLabel}>MAI 2026</Text>
            {historique.map((r, i) => (
              <View key={i} style={s.histItem}>
                <View style={[s.histThumb, { backgroundColor: r.bg }]}>
                  <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.histName}>{r.name}</Text>
                  <Text style={s.histMeta}>{r.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={[s.histBadge, r.statut==='Annule' && s.histBadgeRed]}>
                    <Text style={[s.histBadgeTxt, r.statut==='Annule' && { color: '#e74c3c' }]}>
                      {r.statut === 'Passe' ? 'Passé' : 'Annulé'}
                    </Text>
                  </View>
                  <Text style={s.reorder}>Réserver à nouveau</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  header:         { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle:    { color: C.text, fontSize: 26, fontWeight: '300', letterSpacing: 0.5, marginBottom: 4 },
  headerSub:      { color: C.dim, fontSize: 12, fontWeight: '300' },
  tabs:           { flexDirection: 'row', margin: 16, backgroundColor: C.bg3, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.border },
  tab:            { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabOn:          { backgroundColor: C.bg2, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 },
  tabTxt:         { color: C.dim, fontSize: 13, fontWeight: '300', letterSpacing: 0.5 },
  tabTxtOn:       { color: C.text, fontWeight: '400' },
  sectionLabel:   { color: C.dimmer, fontSize: 10, letterSpacing: 5, paddingHorizontal: 24, marginBottom: 12, textTransform: 'uppercase' },
  bigCard:        { marginHorizontal: 20, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(200,151,90,0.2)', overflow: 'hidden' },
  bigCardTop:     { backgroundColor: '#1a2e1a', padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  bigEmoji:       { fontSize: 36 },
  bigName:        { color: C.text, fontSize: 20, fontWeight: '300', letterSpacing: 0.5, marginBottom: 4 },
  bigLieu:        { color: 'rgba(240,236,228,0.6)', fontSize: 11, fontWeight: '300' },
  confirmedBadge: { backgroundColor: 'rgba(200,151,90,0.2)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.4)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  confirmedTxt:   { color: C.accent, fontSize: 10, fontWeight: '400', letterSpacing: 1 },
  bigBody:        { padding: 18 },
  countdown:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(200,151,90,0.08)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.15)', borderRadius: 10, padding: 12, marginBottom: 16 },
  countdownIcon:  { fontSize: 14 },
  countdownTxt:   { color: C.accent, fontSize: 12, fontWeight: '300', flex: 1 },
  detailsGrid:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  detailItem:     { flex: 1, backgroundColor: 'rgba(10,15,26,0.4)', borderRadius: 10, padding: 10, alignItems: 'center' },
  detailLabel:    { color: C.dimmer, fontSize: 9, letterSpacing: 3, marginBottom: 4 },
  detailValue:    { color: C.text, fontSize: 13, fontWeight: '400' },
  actions:        { flexDirection: 'row', gap: 10 },
  btnModify:      { flex: 1, backgroundColor: C.bg3, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  btnModifyTxt:   { color: C.text, fontSize: 13, fontWeight: '300' },
  btnCancel:      { flex: 1, backgroundColor: 'rgba(192,57,43,0.1)', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(192,57,43,0.2)' },
  btnCancelTxt:   { color: '#e74c3c', fontSize: 13, fontWeight: '300' },
  smallItem:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 20, backgroundColor: C.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  smallThumb:     { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  smallName:      { color: C.text, fontSize: 14, fontWeight: '300', marginBottom: 3 },
  smallMeta:      { color: C.dim, fontSize: 11, fontWeight: '300' },
  aVenirBadge:    { backgroundColor: 'rgba(74,127,165,0.12)', borderWidth: 1, borderColor: 'rgba(74,127,165,0.2)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  aVenirBadgeTxt: { color: C.accent2, fontSize: 10 },
  histItem:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: C.border },
  histThumb:      { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  histName:       { color: C.text, fontSize: 14, fontWeight: '300', marginBottom: 3 },
  histMeta:       { color: C.dim, fontSize: 11, fontWeight: '300' },
  histBadge:      { backgroundColor: 'rgba(61,153,112,0.1)', borderWidth: 1, borderColor: 'rgba(61,153,112,0.2)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  histBadgeRed:   { backgroundColor: 'rgba(192,57,43,0.1)', borderColor: 'rgba(192,57,43,0.2)' },
  histBadgeTxt:   { color: C.green, fontSize: 10 },
  reorder:        { color: C.accent2, fontSize: 10, fontWeight: '300' },
});