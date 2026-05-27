import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, SafeAreaView, TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#e05a5a', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.25)',
};

const STATUS = {
  confirmed: { label:'Confirmée',  color:C.green   },
  pending:   { label:'En attente', color:C.accent   },
  cancelled: { label:'Annulée',    color:C.red      },
  arrived:   { label:'Arrivé',     color:C.accent2  },
  no_show:   { label:'No-show',    color:C.dimmer   },
  completed: { label:'Terminée',   color:C.dimmer   },
};

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};
const CARD_BG = ['#1a2e1a','#1a1e2e','#2e2a1a','#2a1a2e','#1a2a2e','#2e1a1a'];

const SITUATIONS = ['🌙 Dîner calme','👪 En famille','⚡ Déjeuner rapide','🌿 Terrasse','💼 Affaires','🎉 Occasion spéciale'];
const CUISINES   = ['🥘 Algérien','🐟 Méditerranéen','🍕 Italien','🍣 Japonais','🍢 Turc','🌿 Libanais','🍷 Français'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' });
}
function todayStr() { return new Date().toISOString().split('T')[0]; }

/* ─── Carte réservation ─── */
function ResaCard({ r, cancelling, onCancel, onReserveAgain }) {
  const resto = r.restaurants || {};
  const st = STATUS[r.status] || { label: r.status, color: C.dimmer };
  const isCancelling = cancelling.has(r.id);
  const isPast = r.date < todayStr() || ['cancelled','completed','no_show','arrived'].includes(r.status);
  return (
    <View style={[rc.card, { borderLeftColor: st.color }]}>
      <View style={rc.top}>
        <View style={rc.iconWrap}>
          <Text style={rc.icon}>{CUISINE_EMOJI[resto.cuisine_type] || '🍽️'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rc.name} numberOfLines={1}>{resto.name || '—'}</Text>
          {!!resto.quartier && <Text style={rc.quartier}>{resto.quartier}</Text>}
          <View style={rc.meta}>
            <Text style={rc.metaTxt}>📅 {fmtDate(r.date)}</Text>
            <Text style={rc.sep}>·</Text>
            <Text style={rc.metaTxt}>🕐 {r.time_slot?.slice(0,5)}</Text>
            <Text style={rc.sep}>·</Text>
            <Text style={rc.metaTxt}>👥 {(r.nb_adults||0)+(r.nb_children||0)}</Text>
          </View>
        </View>
        <View style={[rc.badge, { borderColor: st.color+'55', backgroundColor: st.color+'15' }]}>
          <Text style={[rc.badgeTxt, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      {!!r.notes && (
        <View style={rc.note}><Text style={rc.noteTxt}>💬  {r.notes}</Text></View>
      )}
      {(!isPast || onReserveAgain) && (
        <View style={rc.foot}>
          {!isPast && (
            <TouchableOpacity style={rc.cancelBtn} onPress={() => onCancel(r.id, resto.name)} disabled={isCancelling}>
              {isCancelling
                ? <ActivityIndicator size={12} color={C.red} />
                : <Text style={rc.cancelTxt}>Annuler la réservation</Text>
              }
            </TouchableOpacity>
          )}
          {isPast && onReserveAgain && (
            <TouchableOpacity style={rc.againBtn} onPress={onReserveAgain}>
              <Text style={rc.againTxt}>Réserver à nouveau →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const rc = StyleSheet.create({
  card:     { marginHorizontal:20, marginTop:10, backgroundColor:C.card, borderRadius:14, borderWidth:1, borderColor:C.border, borderLeftWidth:3, overflow:'hidden' },
  top:      { flexDirection:'row', alignItems:'center', gap:12, padding:14 },
  iconWrap: { width:44, height:44, borderRadius:12, backgroundColor:C.bg2, alignItems:'center', justifyContent:'center', flexShrink:0 },
  icon:     { fontSize:20 },
  name:     { color:C.text, fontSize:14, fontWeight:'400', marginBottom:2 },
  quartier: { color:C.dimmer, fontSize:10, marginBottom:4 },
  meta:     { flexDirection:'row', alignItems:'center', gap:5 },
  metaTxt:  { color:C.dim, fontSize:11 },
  sep:      { color:C.dimmer },
  badge:    { paddingHorizontal:8, paddingVertical:4, borderRadius:8, borderWidth:1, flexShrink:0 },
  badgeTxt: { fontSize:9, fontWeight:'600' },
  note:     { backgroundColor:C.bg2, marginHorizontal:14, marginBottom:10, padding:10, borderRadius:10 },
  noteTxt:  { color:C.dim, fontSize:12, lineHeight:18 },
  foot:     { borderTopWidth:1, borderTopColor:C.border },
  cancelBtn:{ paddingVertical:11, alignItems:'center' },
  cancelTxt:{ color:C.red, fontSize:12 },
  againBtn: { paddingVertical:11, alignItems:'center' },
  againTxt: { color:C.accent2, fontSize:12 },
});

/* ─── Écran principal ─── */
export default function ProfilScreen({ navigation }) {
  const [tab,          setTab]          = useState('profil');
  const [authId,       setAuthId]       = useState(null);
  const [userId,       setUserId]       = useState(null);
  const [userEmail,    setUserEmail]    = useState('');
  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [city,         setCity]         = useState('');
  const [memberSince,  setMemberSince]  = useState('');
  const [avatarUri,    setAvatarUri]    = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [editingName,  setEditingName]  = useState(false);
  const [savingName,   setSavingName]   = useState(false);
  const [reservations, setReservations] = useState([]);
  const [resaLoading,  setResaLoading]  = useState(false);
  const [favorites,    setFavorites]    = useState([]);
  const [favLoading,   setFavLoading]   = useState(false);
  const [cancelling,   setCancelling]   = useState(new Set());
  const [activeSits,   setActiveSits]   = useState([]);
  const [activeCuisines, setActiveCuisines] = useState([]);
  const [removing,     setRemoving]     = useState(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      setAuthId(u.id);
      setUserEmail(u.email || '');
      if (u.created_at) setMemberSince(
        new Date(u.created_at).toLocaleDateString('fr-FR', { month:'long', year:'numeric' })
      );
      supabase.from('users')
        .select('id, avatar_url, first_name, last_name, city')
        .eq('auth_id', u.id).single()
        .then(({ data: row }) => {
          if (!row) return;
          setUserId(row.id);
          setAvatarUri(row.avatar_url ?? null);
          setFirstName(row.first_name ?? '');
          setLastName(row.last_name  ?? '');
          setCity(row.city ?? '');
        });
    });
  }, []);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    setResaLoading(true);
    supabase.from('reservations')
      .select('*, restaurants(id, name, cuisine_type, quartier)')
      .eq('user_id', userId).order('date', { ascending: false }).limit(30)
      .then(({ data }) => { setReservations(data ?? []); setResaLoading(false); });
    setFavLoading(true);
    supabase.from('favorites')
      .select('id, restaurant_id, restaurants(id, name, cuisine_type, quartier, avg_rating, avg_ticket, photos, photo_url)')
      .eq('user_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => { setFavorites(data ?? []); setFavLoading(false); });
  }, [userId]));

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1,1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const ext  = uri.split('.').pop().toLowerCase().replace('jpg','jpeg');
      const path = `${authId}/avatar.${ext}`;
      const blob = await (await fetch(uri)).blob();
      await supabase.storage.from('avatars').upload(path, blob, { upsert:true, contentType:`image/${ext}` });
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('auth_id', authId);
      setAvatarUri(urlData.publicUrl);
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const saveName = async () => {
    setSavingName(true);
    await supabase.from('users')
      .update({ first_name: firstName.trim(), last_name: lastName.trim() })
      .eq('id', userId);
    setSavingName(false);
    setEditingName(false);
  };

  const cancelResa = (id, restoName) => {
    Alert.alert('Annuler la réservation', `Confirmer l'annulation chez ${restoName} ?`, [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Annuler', style: 'destructive',
        onPress: async () => {
          setCancelling(p => new Set(p).add(id));
          await supabase.from('reservations')
            .update({ status:'cancelled', cancelled_at: new Date().toISOString() }).eq('id', id);
          setReservations(p => p.map(r => r.id === id ? {...r, status:'cancelled'} : r));
          setCancelling(p => { const s = new Set(p); s.delete(id); return s; });
        },
      },
    ]);
  };

  const removeFav = async (favId) => {
    setRemoving(p => new Set(p).add(favId));
    await supabase.from('favorites').delete().eq('id', favId);
    setFavorites(p => p.filter(f => f.id !== favId));
    setRemoving(p => { const s = new Set(p); s.delete(favId); return s; });
  };

  const displayName  = [firstName, lastName].filter(Boolean).join(' ') || userEmail.split('@')[0] || 'Mon profil';
  const initial      = displayName[0]?.toUpperCase() || '?';
  const today        = todayStr();
  const upcoming     = reservations.filter(r => r.date >= today && ['confirmed','pending'].includes(r.status));
  const upcomingIds  = new Set(upcoming.map(r => r.id));
  const history      = reservations.filter(r => !upcomingIds.has(r.id));
  const pendingCount = reservations.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnTxt}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Mon profil</Text>
          <TouchableOpacity style={s.editBtn} onPress={() => setEditingName(v => !v)}>
            <Text style={s.editBtnTxt}>{editingName ? '✕  Fermer' : '✏️  Modifier'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero centré ── */}
        <View style={s.heroBlock}>
          <Text style={s.heroDeco}>✦</Text>

          <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} disabled={uploading}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={s.avatarImg} />
              : <View style={s.avatarFallback}><Text style={s.avatarInitial}>{initial}</Text></View>
            }
            <View style={s.avatarBadge}>
              {uploading
                ? <ActivityIndicator size={10} color={C.bg} />
                : <Text style={{ fontSize:11 }}>📷</Text>
              }
            </View>
          </TouchableOpacity>

          {editingName ? (
            <View style={s.editBlock}>
              <View style={s.editRow}>
                <TextInput style={s.editInput} value={firstName} onChangeText={setFirstName} placeholder="Prénom" placeholderTextColor={C.dimmer} />
                <TextInput style={s.editInput} value={lastName}  onChangeText={setLastName}  placeholder="Nom"    placeholderTextColor={C.dimmer} />
              </View>
              <TouchableOpacity style={s.saveBtn} onPress={saveName} disabled={savingName}>
                {savingName
                  ? <ActivityIndicator size={14} color={C.bg} />
                  : <Text style={s.saveBtnTxt}>Enregistrer</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.heroInfo}>
              <Text style={s.heroName}>{displayName}</Text>
              <Text style={s.heroEmail}>{userEmail}</Text>
              {!!city        && <Text style={s.heroCity}>📍 {city}</Text>}
              {!!memberSince && <Text style={s.heroMember}>Membre depuis {memberSince}</Text>}
            </View>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{reservations.length}</Text>
            <Text style={s.statLbl}>RÉSERVATIONS</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statVal, upcoming.length > 0 && { color: C.green }]}>{upcoming.length}</Text>
            <Text style={s.statLbl}>À VENIR</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{favorites.length}</Text>
            <Text style={s.statLbl}>FAVORIS</Text>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={s.tabWrap}>
          {[
            { key:'profil',       label:'Profil'        },
            { key:'reservations', label:'Réservations'  },
            { key:'favoris',      label:'Favoris'       },
          ].map(t => (
            <TouchableOpacity key={t.key} style={[s.tabBtn, tab === t.key && s.tabBtnOn]} onPress={() => setTab(t.key)}>
              <Text style={[s.tabTxt, tab === t.key && s.tabTxtOn]}>{t.label}</Text>
              {t.key === 'reservations' && pendingCount > 0 && (
                <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{pendingCount}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ══ PROFIL ══ */}
        {tab === 'profil' && (
          <View>
            <Text style={s.sectionLbl}>MES SITUATIONS</Text>
            <View style={s.chipsWrap}>
              {SITUATIONS.map((sit, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.chip, activeSits.includes(i) && s.chipOn]}
                  onPress={() => setActiveSits(p => p.includes(i) ? p.filter(x=>x!==i) : [...p,i])}
                >
                  <Text style={[s.chipTxt, activeSits.includes(i) && s.chipTxtOn]}>{sit}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionLbl}>MES CUISINES PRÉFÉRÉES</Text>
            <View style={s.chipsWrap}>
              {CUISINES.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.chip, activeCuisines.includes(i) && s.chipOn]}
                  onPress={() => setActiveCuisines(p => p.includes(i) ? p.filter(x=>x!==i) : [...p,i])}
                >
                  <Text style={[s.chipTxt, activeCuisines.includes(i) && s.chipTxtOn]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.proCard} onPress={() => navigation.navigate('ProInscription')}>
              <View style={s.proCardIcon}><Text style={{ fontSize:22 }}>🍽️</Text></View>
              <View style={{ flex:1 }}>
                <Text style={s.proCardTitle}>Je suis restaurateur</Text>
                <Text style={s.proCardSub}>Rejoignez MIDA Pro · Gérez vos réservations</Text>
              </View>
              <Text style={s.proCardArrow}>›</Text>
            </TouchableOpacity>

            <Text style={s.sectionLbl}>COMPTE</Text>
            <View style={s.settingsCard}>
              {[
                { icon:'🔔', label:'Notifications'          },
                { icon:'📍', label:'Localisation'           },
                { icon:'🌐', label:'Langue'                 },
                { icon:'🔒', label:'Confidentialité'        },
                { icon:'⭐', label:'Donner un avis sur MIDA'},
              ].map((item, i, arr) => (
                <TouchableOpacity key={i} style={[s.settingRow, i < arr.length-1 && s.settingBorder]}>
                  <View style={s.settingIconWrap}><Text style={s.settingIcon}>{item.icon}</Text></View>
                  <Text style={s.settingLabel}>{item.label}</Text>
                  <Text style={s.settingArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.signOutBtn} onPress={() => supabase.auth.signOut()}>
              <Text style={s.signOutTxt}>Se déconnecter</Text>
            </TouchableOpacity>
            <View style={{ height:32 }} />
          </View>
        )}

        {/* ══ RÉSERVATIONS ══ */}
        {tab === 'reservations' && (
          <View>
            {resaLoading ? (
              <View style={s.center}><ActivityIndicator color={C.accent} size="large" /></View>
            ) : reservations.length === 0 ? (
              <View style={s.center}>
                <Text style={s.emptyEmoji}>📅</Text>
                <Text style={s.emptyTitle}>Aucune réservation</Text>
                <Text style={s.emptySub}>Vos réservations apparaîtront ici</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Explorer')}>
                  <Text style={s.emptyBtnTxt}>Explorer les restaurants →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <>
                    <Text style={s.sectionLbl}>À VENIR  ·  {upcoming.length}</Text>
                    {upcoming.map(r => (
                      <ResaCard key={r.id} r={r} cancelling={cancelling} onCancel={cancelResa} />
                    ))}
                  </>
                )}
                {history.length > 0 && (
                  <>
                    <Text style={s.sectionLbl}>HISTORIQUE  ·  {history.length}</Text>
                    {history.map(r => (
                      <ResaCard
                        key={r.id} r={r} cancelling={cancelling} onCancel={cancelResa}
                        onReserveAgain={r.restaurants?.id ? () => navigation.navigate('ReservationForm', { restaurant: r.restaurants }) : undefined}
                      />
                    ))}
                  </>
                )}
              </>
            )}
            <View style={{ height:40 }} />
          </View>
        )}

        {/* ══ FAVORIS ══ */}
        {tab === 'favoris' && (
          <View>
            {favLoading ? (
              <View style={s.center}><ActivityIndicator color={C.accent} size="large" /></View>
            ) : favorites.length === 0 ? (
              <View style={s.center}>
                <Text style={s.emptyEmoji}>🤍</Text>
                <Text style={s.emptyTitle}>Aucun favori</Text>
                <Text style={s.emptySub}>Appuyez sur ❤️ sur la page{'\n'}d'un restaurant pour l'ajouter</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Explorer')}>
                  <Text style={s.emptyBtnTxt}>Explorer les restaurants →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={s.sectionLbl}>
                  {favorites.length} RESTAURANT{favorites.length > 1 ? 'S' : ''} SAUVEGARDÉ{favorites.length > 1 ? 'S' : ''}
                </Text>
                {favorites.map((fav, i) => {
                  const r = fav.restaurants || {};
                  const photo = r.photos?.[0] || r.photo_url;
                  return (
                    <TouchableOpacity
                      key={fav.id}
                      style={s.favCard}
                      onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
                      activeOpacity={0.85}
                    >
                      <View style={[s.favThumb, { backgroundColor: CARD_BG[i % CARD_BG.length] }]}>
                        {photo
                          ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                          : <Text style={s.favEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
                        }
                      </View>
                      <View style={s.favBody}>
                        <Text style={s.favCuisine}>
                          {(r.cuisine_type||'').toUpperCase().replace(/_/g,' ')}
                          {r.quartier ? '  ·  '+r.quartier : ''}
                        </Text>
                        <Text style={s.favName} numberOfLines={1}>{r.name}</Text>
                        <View style={s.favMeta}>
                          {r.avg_rating > 0 && <Text style={s.favRating}>★ {Number(r.avg_rating).toFixed(1)}</Text>}
                          {r.avg_ticket > 0 && <><Text style={s.favSep}>·</Text><Text style={s.favPrice}>{r.avg_ticket.toLocaleString('fr-FR')} DA</Text></>}
                        </View>
                        <TouchableOpacity
                          style={s.favResaBtn}
                          onPress={() => navigation.navigate('ReservationForm', { restaurant: r })}
                        >
                          <Text style={s.favResaBtnTxt}>Réserver →</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={s.favHeart} onPress={() => removeFav(fav.id)} disabled={removing.has(fav.id)}>
                        {removing.has(fav.id)
                          ? <ActivityIndicator size={12} color={C.accent} />
                          : <Text style={s.favHeartTxt}>❤️</Text>
                        }
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
            <View style={{ height:40 }} />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:C.bg },

  /* Header */
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:16, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border },
  backBtn:     { width:36, height:36, borderRadius:18, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  backBtnTxt:  { color:C.text, fontSize:16 },
  headerTitle: { color:C.text, fontSize:18, fontWeight:'300', letterSpacing:0.5 },
  editBtn:     { paddingHorizontal:12, paddingVertical:6, borderRadius:10, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border },
  editBtnTxt:  { color:C.dim, fontSize:11 },

  /* Hero */
  heroBlock:     { alignItems:'center', paddingTop:28, paddingBottom:24, borderBottomWidth:1, borderBottomColor:C.border, paddingHorizontal:20, overflow:'hidden' },
  heroDeco:      { position:'absolute', top:-30, color:'rgba(200,151,90,0.06)', fontSize:220, fontWeight:'700' },
  avatarWrap:    { position:'relative', marginBottom:14 },
  avatarImg:     { width:100, height:100, borderRadius:50, borderWidth:2.5, borderColor:C.accent },
  avatarFallback:{ width:100, height:100, borderRadius:50, backgroundColor:C.bg3, borderWidth:2.5, borderColor:C.accent, alignItems:'center', justifyContent:'center' },
  avatarInitial: { color:C.accent, fontSize:36, fontWeight:'200' },
  avatarBadge:   { position:'absolute', bottom:2, right:2, width:26, height:26, borderRadius:13, backgroundColor:C.accent, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:C.bg },
  heroInfo:      { alignItems:'center', gap:5 },
  heroName:      { color:C.text, fontSize:22, fontWeight:'300', letterSpacing:0.5 },
  heroEmail:     { color:C.dim, fontSize:13 },
  heroCity:      { color:C.dimmer, fontSize:12 },
  heroMember:    { color:C.dimmer, fontSize:10, letterSpacing:1, marginTop:2 },
  editBlock:     { width:'100%', gap:10 },
  editRow:       { flexDirection:'row', gap:10 },
  editInput:     { flex:1, backgroundColor:C.bg2, borderRadius:12, borderWidth:1, borderColor:C.border, color:C.text, fontSize:14, paddingHorizontal:14, paddingVertical:10 },
  saveBtn:       { backgroundColor:C.accent, borderRadius:12, paddingVertical:11, alignItems:'center' },
  saveBtnTxt:    { color:C.bg, fontSize:13, fontWeight:'500' },

  /* Stats */
  statsRow: { flexDirection:'row', marginHorizontal:20, marginVertical:16, backgroundColor:C.bg2, borderRadius:18, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  statItem: { flex:1, alignItems:'center', paddingVertical:16 },
  statVal:  { color:C.accent, fontSize:24, fontWeight:'200', marginBottom:4 },
  statLbl:  { color:C.dimmer, fontSize:8, letterSpacing:1.5 },
  statDiv:  { width:1, backgroundColor:C.border, marginVertical:12 },

  /* Tabs */
  tabWrap:    { flexDirection:'row', marginHorizontal:20, marginBottom:8, backgroundColor:C.bg2, borderRadius:14, borderWidth:1, borderColor:C.border, padding:3, gap:2 },
  tabBtn:     { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:9, borderRadius:11, gap:5 },
  tabBtnOn:   { backgroundColor:C.bg3 },
  tabTxt:     { color:C.dimmer, fontSize:12, fontWeight:'300' },
  tabTxtOn:   { color:C.text, fontWeight:'400' },
  tabBadge:   { width:16, height:16, borderRadius:8, backgroundColor:C.accent, alignItems:'center', justifyContent:'center' },
  tabBadgeTxt:{ color:C.bg, fontSize:9, fontWeight:'700' },

  /* Section */
  sectionLbl: { color:C.dimmer, fontSize:9, letterSpacing:3, paddingHorizontal:20, marginTop:20, marginBottom:12 },

  /* Chips */
  chipsWrap: { flexDirection:'row', flexWrap:'wrap', gap:8, paddingHorizontal:20 },
  chip:      { paddingHorizontal:14, paddingVertical:8, borderRadius:100, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border },
  chipOn:    { backgroundColor:'rgba(200,151,90,0.12)', borderColor:C.accent },
  chipTxt:   { color:C.dim, fontSize:12, fontWeight:'300' },
  chipTxtOn: { color:C.accent },

  /* CTA Pro */
  proCard:      { flexDirection:'row', alignItems:'center', gap:14, marginHorizontal:20, marginTop:20, padding:16, borderRadius:16, backgroundColor:'rgba(200,151,90,0.07)', borderWidth:1, borderColor:C.borderAccent },
  proCardIcon:  { width:46, height:46, borderRadius:12, backgroundColor:'rgba(200,151,90,0.12)', alignItems:'center', justifyContent:'center' },
  proCardTitle: { color:C.accent, fontSize:14, fontWeight:'400', marginBottom:2 },
  proCardSub:   { color:C.dim, fontSize:11 },
  proCardArrow: { color:C.dimmer, fontSize:22 },

  /* Settings */
  settingsCard:    { marginHorizontal:20, backgroundColor:C.bg2, borderRadius:16, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  settingRow:      { flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:16, paddingVertical:14 },
  settingBorder:   { borderBottomWidth:1, borderBottomColor:C.border },
  settingIconWrap: { width:32, height:32, borderRadius:8, backgroundColor:C.bg3, alignItems:'center', justifyContent:'center' },
  settingIcon:     { fontSize:16 },
  settingLabel:    { flex:1, color:C.text, fontSize:14, fontWeight:'300' },
  settingArrow:    { color:C.dimmer, fontSize:20 },

  /* Sign out */
  signOutBtn: { marginHorizontal:20, marginTop:14, paddingVertical:14, borderRadius:14, borderWidth:1, borderColor:'rgba(224,90,90,0.2)', alignItems:'center' },
  signOutTxt: { color:C.red, fontSize:13 },

  /* Empty */
  center:     { alignItems:'center', paddingVertical:52, gap:12 },
  emptyEmoji: { fontSize:44 },
  emptyTitle: { color:C.text, fontSize:18, fontWeight:'300' },
  emptySub:   { color:C.dim, fontSize:13, textAlign:'center', lineHeight:20 },
  emptyBtn:   { backgroundColor:C.bg2, borderRadius:12, paddingHorizontal:20, paddingVertical:10, borderWidth:1, borderColor:C.border },
  emptyBtnTxt:{ color:C.accent2, fontSize:13 },

  /* Favoris */
  favCard:      { flexDirection:'row', alignItems:'flex-start', gap:12, marginHorizontal:20, marginTop:10, backgroundColor:C.card, borderRadius:14, borderWidth:1, borderColor:C.border, padding:12, overflow:'hidden' },
  favThumb:     { width:70, height:90, borderRadius:12, alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 },
  favEmoji:     { fontSize:28 },
  favBody:      { flex:1, gap:3 },
  favCuisine:   { color:C.accent, fontSize:8, letterSpacing:2, marginBottom:1 },
  favName:      { color:C.text, fontSize:14, fontWeight:'300', marginBottom:2 },
  favMeta:      { flexDirection:'row', alignItems:'center', gap:5, marginBottom:6 },
  favRating:    { color:C.accent, fontSize:11, fontWeight:'500' },
  favSep:       { color:C.dimmer },
  favPrice:     { color:C.dim, fontSize:11 },
  favResaBtn:   { alignSelf:'flex-start', backgroundColor:C.accent, borderRadius:9, paddingHorizontal:12, paddingVertical:6 },
  favResaBtnTxt:{ color:C.bg, fontSize:11, fontWeight:'600' },
  favHeart:     { width:32, height:32, borderRadius:16, backgroundColor:'rgba(200,151,90,0.1)', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:C.borderAccent, flexShrink:0 },
  favHeartTxt:  { fontSize:14 },
});
