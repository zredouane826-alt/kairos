import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg: '#0d1628', bg2: '#111827', bg3: '#1a2332',
  accent: '#c8975a', accent2: '#4a7fa5',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#4a5568',
  green: '#3d9970', red: '#e05a5a', card: '#141e2e',
  border: 'rgba(255,255,255,0.07)',
};

const TYPE_CFG = {
  confirm:      { icon: '✅', color: '#3d9970', label: 'Confirmation',  group: 'resa' },
  cancellation: { icon: '❌', color: '#e05a5a', label: 'Annulation',    group: 'resa' },
  new_resa:     { icon: '📅', color: '#4a7fa5', label: 'Réservation',   group: 'resa' },
  reminder:     { icon: '⏰', color: '#c8975a', label: 'Rappel',        group: 'rappel' },
  review_ask:   { icon: '⭐', color: '#f0c040', label: 'Avis',          group: 'rappel' },
};

const TABS = [
  { id: 'all',    label: 'Tout' },
  { id: 'resa',   label: 'Réservations' },
  { id: 'rappel', label: 'Rappels' },
];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)   return "à l'instant";
  if (m < 60)  return `il y a ${m} min`;
  if (h < 24)  return `il y a ${h}h`;
  if (d === 1) return 'hier';
  if (d < 7)   return `il y a ${d} jours`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function grouped(notifs) {
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const out = [
    { label: "Aujourd'hui",   items: [] },
    { label: 'Cette semaine', items: [] },
    { label: 'Plus ancien',   items: [] },
  ];
  notifs.forEach(n => {
    const d = new Date(n.sent_at);
    if (d >= today)       out[0].items.push(n);
    else if (d >= weekAgo) out[1].items.push(n);
    else                  out[2].items.push(n);
  });
  return out.filter(g => g.items.length > 0);
}

export default function NotificationsScreen({ navigation }) {
  const [notifs,     setNotifs]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId,     setUserId]     = useState(null);
  const [tab,        setTab]        = useState('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      supabase.from('users').select('id').eq('auth_id', u.id).single()
        .then(({ data: row }) => { if (row) setUserId(row.id); });
    });
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (!userId) return;
    if (refresh) setRefreshing(true); else setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .eq('recipient_type', 'user')
      .order('sent_at', { ascending: false });
    setNotifs(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const markRead = async (n) => {
    if (n.is_read) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('recipient_type', 'user')
      .eq('is_read', false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotif = (n) => {
    Alert.alert('Supprimer', 'Supprimer cette notification ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await supabase.from('notifications').delete().eq('id', n.id);
          setNotifs(prev => prev.filter(x => x.id !== n.id));
        },
      },
    ]);
  };

  const filtered = notifs.filter(n => {
    if (tab === 'all') return true;
    return (TYPE_CFG[n.type]?.group || 'autre') === tab;
  });

  const unread      = notifs.filter(n => !n.is_read).length;
  const unreadResa  = notifs.filter(n => !n.is_read && TYPE_CFG[n.type]?.group === 'resa').length;
  const unreadRappel= notifs.filter(n => !n.is_read && TYPE_CFG[n.type]?.group === 'rappel').length;
  const groups      = grouped(filtered);

  const badgeFor = (id) => {
    if (id === 'all')    return unread;
    if (id === 'resa')   return unreadResa;
    if (id === 'rappel') return unreadRappel;
    return 0;
  };

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerSub}>ALERTES & RAPPELS</Text>
          <Text style={s.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity onPress={markAllRead} disabled={unread === 0} style={s.markAllBtn}>
          <Text style={[s.markAllTxt, unread === 0 && s.markAllDim]}>Tout lire</Text>
        </TouchableOpacity>
      </View>

      {/* Barre résumé */}
      {unread > 0 && !loading && (
        <View style={s.summaryBar}>
          <View style={s.summaryDot} />
          <Text style={s.summaryTxt}>
            {unread} non lue{unread > 1 ? 's' : ''}
          </Text>
          <Text style={s.summaryHint}>  ·  Appuyez pour marquer comme lue</Text>
        </View>
      )}

      {/* Tabs filtre */}
      <View style={s.tabBar}>
        {TABS.map(t => {
          const badge = badgeFor(t.id);
          return (
            <TouchableOpacity key={t.id} style={[s.tabBtn, tab === t.id && s.tabBtnOn]} onPress={() => setTab(t.id)}>
              <Text style={[s.tabTxt, tab === t.id && s.tabTxtOn]}>{t.label}</Text>
              {badge > 0 && (
                <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{badge}</Text></View>
              )}
              {tab === t.id && <View style={s.tabLine} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contenu */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.accent} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>
            {tab === 'resa' ? '📅' : tab === 'rappel' ? '⏰' : '🔔'}
          </Text>
          <Text style={s.emptyTitle}>
            {tab === 'all' ? 'Aucune notification' : `Aucune notification\n${TABS.find(t => t.id === tab)?.label.toLowerCase()}`}
          </Text>
          <Text style={s.emptySub}>Vous serez notifié ici de vos{'\n'}réservations et rappels.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}
        >
          {groups.map(({ label, items }) => (
            <View key={label}>
              <Text style={s.groupLabel}>{label.toUpperCase()}</Text>
              {items.map(n => {
                const cfg = TYPE_CFG[n.type] || { icon: '🔔', color: C.dim, group: 'autre' };
                const isResa = cfg.group === 'resa';
                return (
                  <TouchableOpacity
                    key={n.id}
                    style={[s.card, !n.is_read && s.cardUnread, { borderLeftColor: cfg.color }]}
                    onPress={() => markRead(n)}
                    onLongPress={() => deleteNotif(n)}
                    activeOpacity={0.75}
                  >
                    {/* Icône */}
                    <View style={[s.iconWrap, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '35' }]}>
                      <Text style={s.icon}>{cfg.icon}</Text>
                    </View>

                    {/* Contenu */}
                    <View style={s.cardContent}>
                      <View style={s.cardTopRow}>
                        <View style={[s.typeBadge, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '30' }]}>
                          <Text style={[s.typeBadgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        <Text style={s.cardTime}>{timeAgo(n.sent_at)}</Text>
                      </View>
                      <Text style={[s.cardTitle, !n.is_read && s.cardTitleBold]}>{n.title}</Text>
                      <Text style={s.cardBody}>{n.body}</Text>

                      {/* Action contextuelle */}
                      {isResa && (
                        <TouchableOpacity
                          style={s.actionBtn}
                          onPress={() => { markRead(n); navigation.navigate('Main'); }}
                        >
                          <Text style={s.actionBtnTxt}>Voir mes réservations →</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Dot non lue */}
                    {!n.is_read && <View style={[s.unreadDot, { backgroundColor: cfg.color }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:     { color: C.text, fontSize: 16 },
  headerCenter:   { flex: 1, alignItems: 'center' },
  headerSub:      { color: C.accent, fontSize: 9, letterSpacing: 3, marginBottom: 2 },
  headerTitle:    { color: C.text, fontSize: 22, fontWeight: '300', letterSpacing: 1 },
  markAllBtn:     { width: 60, alignItems: 'flex-end' },
  markAllTxt:     { color: C.accent2, fontSize: 12 },
  markAllDim:     { color: C.dimmer },

  /* Summary bar */
  summaryBar:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 9, backgroundColor: 'rgba(200,151,90,0.06)', borderBottomWidth: 1, borderBottomColor: C.border },
  summaryDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  summaryTxt:     { color: C.accent, fontSize: 12, fontWeight: '400' },
  summaryHint:    { color: C.dimmer, fontSize: 11 },

  /* Tabs */
  tabBar:         { flexDirection: 'row', backgroundColor: C.bg2, borderBottomWidth: 1, borderBottomColor: C.border },
  tabBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 5, position: 'relative' },
  tabBtnOn:       {},
  tabTxt:         { color: C.dim, fontSize: 12, fontWeight: '300' },
  tabTxtOn:       { color: C.text, fontWeight: '400' },
  tabBadge:       { backgroundColor: C.accent, borderRadius: 8, minWidth: 16, height: 16, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  tabBadgeTxt:    { color: C.bg, fontSize: 9, fontWeight: '700' },
  tabLine:        { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, backgroundColor: C.accent, borderRadius: 1 },

  /* Group label */
  groupLabel:     { color: C.dimmer, fontSize: 9, letterSpacing: 4, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },

  /* Card */
  card:           { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  cardUnread:     { backgroundColor: 'rgba(255,255,255,0.02)' },
  iconWrap:       { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  icon:           { fontSize: 20 },
  cardContent:    { flex: 1, gap: 4 },
  cardTopRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  typeBadge:      { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  typeBadgeTxt:   { fontSize: 9, fontWeight: '500', letterSpacing: 0.5 },
  cardTime:       { color: C.dimmer, fontSize: 10 },
  cardTitle:      { color: C.text, fontSize: 14, fontWeight: '300', lineHeight: 20 },
  cardTitleBold:  { fontWeight: '500' },
  cardBody:       { color: C.dim, fontSize: 12, lineHeight: 18 },
  unreadDot:      { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 6 },

  /* Action button */
  actionBtn:      { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: 'rgba(74,127,165,0.12)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(74,127,165,0.25)' },
  actionBtnTxt:   { color: C.accent2, fontSize: 11, fontWeight: '400' },

  /* Empty */
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji:     { fontSize: 52 },
  emptyTitle:     { color: C.text, fontSize: 18, fontWeight: '300', textAlign: 'center', lineHeight: 26 },
  emptySub:       { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
