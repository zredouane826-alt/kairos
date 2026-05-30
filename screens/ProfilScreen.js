import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, SafeAreaView, TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';

const STATUS = {
  confirmed: { label:'Confirmée',  color: colors.green   },
  pending:   { label:'En attente', color: colors.accent  },
  cancelled: { label:'Annulée',    color: colors.red     },
  arrived:   { label:'Arrivé',     color: colors.blue    },
  no_show:   { label:'No-show',    color: colors.textDim },
  completed: { label:'Terminée',   color: colors.textDim },
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

function SkeletonResaCard() {
  return (
    <View style={{ marginHorizontal: spacing.xxl, marginTop: spacing.lg }}>
      <MLoader width="100%" height={90} borderRadius={radius.xl} />
    </View>
  );
}

function SkeletonFavRow() {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.lg, marginHorizontal: spacing.xxl, marginTop: spacing.lg }}>
      <MLoader width={70} height={90} borderRadius={radius.lg} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <MLoader width="40%" height={10} borderRadius={radius.sm} />
        <MLoader width="75%" height={14} borderRadius={radius.sm} />
        <MLoader width="55%" height={10} borderRadius={radius.sm} />
      </View>
    </View>
  );
}

/* ─── Carte réservation ─── */
function ResaCard({ r, cancelling, onCancel, onReserveAgain }) {
  const resto = r.restaurants || {};
  const st = STATUS[r.status] || { label: r.status, color: colors.textDim };
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
              <Text style={rc.cancelTxt}>{isCancelling ? '···' : 'Annuler la réservation'}</Text>
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
  card:     { marginHorizontal: spacing.xxl, marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 3, overflow: 'hidden' },
  top:      { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  iconWrap: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:     { fontSize: 20 },
  name:     { color: colors.text, fontSize: typography.size.subheading, marginBottom: 2 },
  quartier: { color: colors.textDim, fontSize: typography.size.sm, marginBottom: spacing.xs },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaTxt:  { color: colors.textMuted, fontSize: typography.size.caption },
  sep:      { color: colors.textDim },
  badge:    { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.md, borderWidth: 1, flexShrink: 0 },
  badgeTxt: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  note:     { backgroundColor: colors.cardHover, marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radius.md },
  noteTxt:  { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 18 },
  foot:     { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  cancelBtn:{ paddingVertical: 11, alignItems: 'center' },
  cancelTxt:{ color: colors.red, fontSize: typography.size.body },
  againBtn: { paddingVertical: 11, alignItems: 'center' },
  againTxt: { color: colors.blue, fontSize: typography.size.body },
});

/* ─── Écran principal ─── */
export default function ProfilScreen({ navigation }) {
  const [tab,            setTab]          = useState('profil');
  const [authId,         setAuthId]       = useState(null);
  const [userId,         setUserId]       = useState(null);
  const [userEmail,      setUserEmail]    = useState('');
  const [firstName,      setFirstName]    = useState('');
  const [lastName,       setLastName]     = useState('');
  const [city,           setCity]         = useState('');
  const [phone,          setPhone]        = useState('');
  const [memberSince,    setMemberSince]  = useState('');
  const [avatarUri,      setAvatarUri]    = useState(null);
  const [uploading,      setUploading]    = useState(false);
  const [editingName,    setEditingName]  = useState(false);
  const [savingName,     setSavingName]   = useState(false);
  const [reservations,   setReservations] = useState([]);
  const [resaLoading,    setResaLoading]  = useState(false);
  const [favorites,      setFavorites]    = useState([]);
  const [favLoading,     setFavLoading]   = useState(false);
  const [cancelling,     setCancelling]   = useState(new Set());
  const [activeSits,     setActiveSits]   = useState([]);
  const [activeCuisines, setActiveCuisines] = useState([]);
  const [removing,       setRemoving]     = useState(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      setAuthId(u.id);
      setUserEmail(u.email || '');
      if (u.created_at) setMemberSince(
        new Date(u.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      );
      const { data: row } = await supabase.from('users')
        .select('id, avatar_url, first_name, last_name, city, phone')
        .eq('auth_id', u.id).single();
      if (!row) return;
      setUserId(row.id);
      setAvatarUri(row.avatar_url ?? null);
      setFirstName(row.first_name ?? '');
      setLastName(row.last_name  ?? '');
      setCity(row.city ?? '');
      setPhone(row.phone ?? '');
    })();
  }, []);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    setResaLoading(true);
    setFavLoading(true);
    (async () => {
      try {
        const [{ data: resas }, { data: favs }] = await Promise.all([
          supabase.from('reservations')
            .select('*, restaurants(id, name, cuisine_type, quartier)')
            .eq('user_id', userId).order('date', { ascending: false }).limit(30),
          supabase.from('favorites')
            .select('id, restaurant_id, restaurants(id, name, cuisine_type, quartier, avg_rating, avg_ticket, photos, photo_url)')
            .eq('user_id', userId).order('created_at', { ascending: false }),
        ]);
        setReservations(resas ?? []);
        setFavorites(favs ?? []);
      } finally {
        setResaLoading(false);
        setFavLoading(false);
      }
    })();
  }, [userId]));

  const pickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const ext  = uri.split('.').pop().toLowerCase().replace('jpg', 'jpeg');
      const path = `${authId}/avatar.${ext}`;
      const blob = await (await fetch(uri)).blob();
      await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: `image/${ext}` });
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('auth_id', authId);
      setAvatarUri(urlData.publicUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }, [authId]);

  const saveName = useCallback(async () => {
    setSavingName(true);
    try {
      await supabase.from('users')
        .update({ first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() })
        .eq('id', userId);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  }, [firstName, lastName, phone, userId]);

  const cancelResa = useCallback((id, restoName) => {
    Alert.alert('Annuler la réservation', `Confirmer l'annulation chez ${restoName} ?`, [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Annuler', style: 'destructive',
        onPress: async () => {
          setCancelling(p => new Set(p).add(id));
          await supabase.from('reservations')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', id);
          setReservations(p => p.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
          setCancelling(p => { const next = new Set(p); next.delete(id); return next; });
        },
      },
    ]);
  }, []);

  const removeFav = useCallback(async (favId) => {
    setRemoving(p => new Set(p).add(favId));
    await supabase.from('favorites').delete().eq('id', favId);
    setFavorites(p => p.filter(f => f.id !== favId));
    setRemoving(p => { const next = new Set(p); next.delete(favId); return next; });
  }, []);

  const displayName = useMemo(
    () => [firstName, lastName].filter(Boolean).join(' ') || userEmail.split('@')[0] || 'Mon profil',
    [firstName, lastName, userEmail],
  );
  const initial = useMemo(() => displayName[0]?.toUpperCase() || '?', [displayName]);
  const today   = useMemo(() => todayStr(), []);

  const goBack           = useCallback(() => navigation.goBack(), [navigation]);
  const toggleEditing    = useCallback(() => setEditingName(v => !v), []);
  const goProInscription = useCallback(() => navigation.navigate('ProInscription'), [navigation]);
  const signOut          = useCallback(() => supabase.auth.signOut(), []);
  const goExplorer       = useCallback(() => navigation.navigate('Explorer'), [navigation]);

  const upcoming = useMemo(
    () => reservations.filter(r => r.date >= today && ['confirmed', 'pending'].includes(r.status)),
    [reservations, today],
  );
  const history = useMemo(() => {
    const ids = new Set(upcoming.map(r => r.id));
    return reservations.filter(r => !ids.has(r.id));
  }, [reservations, upcoming]);
  const pendingCount = useMemo(
    () => reservations.filter(r => r.status === 'pending').length,
    [reservations],
  );

  return (
    <SafeAreaView style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={goBack}>
            <Text style={s.backBtnTxt}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Mon profil</Text>
          <TouchableOpacity style={s.editBtn} onPress={toggleEditing}>
            <Text style={s.editBtnTxt}>{editingName ? '✕  Fermer' : '✏️  Modifier'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero ── */}
        <View style={s.heroBlock}>
          <Text style={s.heroDeco}>✦</Text>
          <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} disabled={uploading}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={s.avatarImg} />
              : <View style={s.avatarFallback}><Text style={s.avatarInitial}>{initial}</Text></View>
            }
            <View style={s.avatarBadge}>
              {uploading
                ? <Text style={{ color: colors.bg, fontSize: 10 }}>···</Text>
                : <Text style={{ fontSize: 11 }}>📷</Text>
              }
            </View>
          </TouchableOpacity>

          {editingName ? (
            <View style={s.editBlock}>
              <View style={s.editRow}>
                <TextInput style={s.editInput} value={firstName} onChangeText={setFirstName} placeholder="Prénom" placeholderTextColor={colors.textDim} />
                <TextInput style={s.editInput} value={lastName}  onChangeText={setLastName}  placeholder="Nom"    placeholderTextColor={colors.textDim} />
              </View>
              <TextInput
                style={[s.editInput, { width: '100%' }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+213 6XX XXX XXX"
                placeholderTextColor={colors.textDim}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={s.saveBtn} onPress={saveName} disabled={savingName}>
                <Text style={s.saveBtnTxt}>{savingName ? '···' : 'Enregistrer'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.heroInfo}>
              <Text style={s.heroName}>{displayName}</Text>
              <Text style={s.heroEmail}>{userEmail}</Text>
              {!!city        && <Text style={s.heroCity}>📍 {city}</Text>}
              {!!phone       && <Text style={s.heroCity}>📞 {phone}</Text>}
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
            <Text style={[s.statVal, upcoming.length > 0 && { color: colors.green }]}>{upcoming.length}</Text>
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

            <TouchableOpacity style={s.proCard} onPress={goProInscription}>
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
                { icon:'⚙️', label:'Paramètres',             screen:'Settings'  },
                { icon:'❓', label:'Aide & Support',          screen:'Aide'      },
                { icon:'🔔', label:'Notifications'                               },
                { icon:'🔒', label:'Confidentialité'                             },
                { icon:'⭐', label:'Donner un avis sur MIDA'                     },
              ].map((item, i, arr) => (
                <TouchableOpacity key={i} style={[s.settingRow, i < arr.length-1 && s.settingBorder]} onPress={() => item.screen && navigation.navigate(item.screen)}>
                  <View style={s.settingIconWrap}><Text style={s.settingIcon}>{item.icon}</Text></View>
                  <Text style={s.settingLabel}>{item.label}</Text>
                  <Text style={s.settingArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
              <Text style={s.signOutTxt}>Se déconnecter</Text>
            </TouchableOpacity>
            <View style={{ height:32 }} />
          </View>
        )}

        {/* ══ RÉSERVATIONS ══ */}
        {tab === 'reservations' && (
          <View>
            {resaLoading ? (
              <View>{[1,2,3].map(i => <SkeletonResaCard key={i} />)}</View>
            ) : reservations.length === 0 ? (
              <View style={s.center}>
                <Text style={s.emptyEmoji}>📅</Text>
                <Text style={s.emptyTitle}>Aucune réservation</Text>
                <Text style={s.emptySub}>Vos réservations apparaîtront ici</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={goExplorer}>
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
              <View>{[1,2,3].map(i => <SkeletonFavRow key={i} />)}</View>
            ) : favorites.length === 0 ? (
              <View style={s.center}>
                <Text style={s.emptyEmoji}>🤍</Text>
                <Text style={s.emptyTitle}>Aucun favori</Text>
                <Text style={s.emptySub}>Appuyez sur ❤️ sur la page{'\n'}d'un restaurant pour l'ajouter</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={goExplorer}>
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
                        <Text style={s.favHeartTxt}>{removing.has(fav.id) ? '···' : '❤️'}</Text>
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
  root: { flex:1, backgroundColor: colors.bg },

  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth:1, borderBottomColor: colors.cardBorder },
  backBtn:     { width:36, height:36, borderRadius:18, backgroundColor: colors.card, borderWidth:1, borderColor: colors.cardBorder, alignItems:'center', justifyContent:'center' },
  backBtnTxt:  { color: colors.text, fontSize: typography.size.heading2 },
  headerTitle: { color: colors.text, fontSize: typography.size.heading1, fontWeight:typography.weight.regular, letterSpacing:0.5 },
  editBtn:     { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.card, borderWidth:1, borderColor: colors.cardBorder },
  editBtnTxt:  { color: colors.textMuted, fontSize: typography.size.caption },

  heroBlock:     { alignItems:'center', paddingTop:28, paddingBottom:24, borderBottomWidth:1, borderBottomColor: colors.cardBorder, paddingHorizontal: spacing.xxl, overflow:'hidden' },
  heroDeco:      { position:'absolute', top:-30, color:'rgba(232,160,69,0.06)', fontSize:220, fontWeight:'700' },
  avatarWrap:    { position:'relative', marginBottom: spacing.lg },
  avatarImg:     { width:100, height:100, borderRadius:50, borderWidth:2.5, borderColor: colors.accent },
  avatarFallback:{ width:100, height:100, borderRadius:50, backgroundColor: colors.cardHover, borderWidth:2.5, borderColor: colors.accent, alignItems:'center', justifyContent:'center' },
  avatarInitial: { color: colors.accent, fontSize:36, fontWeight:typography.weight.regular },
  avatarBadge:   { position:'absolute', bottom:2, right:2, width:26, height:26, borderRadius:13, backgroundColor: colors.accent, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor: colors.bg },
  heroInfo:      { alignItems:'center', gap: spacing.sm },
  heroName:      { color: colors.text, fontSize: typography.size.title, fontWeight:typography.weight.regular, letterSpacing:0.5 },
  heroEmail:     { color: colors.textMuted, fontSize: typography.size.bodyLg },
  heroCity:      { color: colors.textDim, fontSize: typography.size.body },
  heroMember:    { color: colors.textDim, fontSize: typography.size.sm, letterSpacing:1, marginTop:2 },
  editBlock:     { width:'100%', gap: spacing.lg },
  editRow:       { flexDirection:'row', gap: spacing.lg },
  editInput:     { flex:1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth:1, borderColor: colors.cardBorder, color: colors.text, fontSize: typography.size.subheading, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  saveBtn:       { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical:11, alignItems:'center' },
  saveBtnTxt:    { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },

  statsRow: { flexDirection:'row', marginHorizontal: spacing.xxl, marginVertical: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth:1, borderColor: colors.cardBorder, overflow:'hidden' },
  statItem: { flex:1, alignItems:'center', paddingVertical: spacing.xl },
  statVal:  { color: colors.accent, fontSize: typography.size.title, fontWeight:typography.weight.regular, marginBottom: spacing.xs },
  statLbl:  { color: colors.textDim, fontSize: typography.size.xs, letterSpacing:1.5 },
  statDiv:  { width:1, backgroundColor: colors.cardBorder, marginVertical: spacing.lg },

  tabWrap:    { flexDirection:'row', marginHorizontal: spacing.xxl, marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth:1, borderColor: colors.cardBorder, padding: spacing.xxs+1, gap: spacing.xxs },
  tabBtn:     { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical: spacing.md+1, borderRadius: radius.lg, gap: spacing.sm },
  tabBtnOn:   { backgroundColor: colors.cardHover },
  tabTxt:     { color: colors.textDim, fontSize: typography.size.body, fontWeight:typography.weight.regular },
  tabTxtOn:   { color: colors.text },
  tabBadge:   { width:16, height:16, borderRadius:8, backgroundColor: colors.accent, alignItems:'center', justifyContent:'center' },
  tabBadgeTxt:{ color: colors.bg, fontSize: typography.size.xs, fontWeight: typography.weight.bold },

  sectionLbl: { color: colors.textDim, fontSize: typography.size.xs, letterSpacing:3, paddingHorizontal: spacing.xxl, marginTop: spacing.xxl, marginBottom: spacing.lg },

  chipsWrap: { flexDirection:'row', flexWrap:'wrap', gap: spacing.md, paddingHorizontal: spacing.xxl },
  chip:      { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.full, backgroundColor: colors.card, borderWidth:1, borderColor: colors.cardBorder },
  chipOn:    { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipTxt:   { color: colors.textMuted, fontSize: typography.size.body, fontWeight:typography.weight.regular },
  chipTxtOn: { color: colors.accent },

  proCard:      { flexDirection:'row', alignItems:'center', gap: spacing.lg, marginHorizontal: spacing.xxl, marginTop: spacing.xxl, padding: spacing.xl, borderRadius: radius.xxl, backgroundColor: 'rgba(232,160,69,0.07)', borderWidth:1, borderColor: 'rgba(232,160,69,0.25)' },
  proCardIcon:  { width:46, height:46, borderRadius: radius.lg, backgroundColor: colors.accentSoft, alignItems:'center', justifyContent:'center' },
  proCardTitle: { color: colors.accent, fontSize: typography.size.subheading, marginBottom:2 },
  proCardSub:   { color: colors.textMuted, fontSize: typography.size.caption },
  proCardArrow: { color: colors.textDim, fontSize: 22 },

  settingsCard:    { marginHorizontal: spacing.xxl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth:1, borderColor: colors.cardBorder, overflow:'hidden' },
  settingRow:      { flexDirection:'row', alignItems:'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  settingBorder:   { borderBottomWidth:1, borderBottomColor: colors.cardBorder },
  settingIconWrap: { width:32, height:32, borderRadius: radius.md, backgroundColor: colors.cardHover, alignItems:'center', justifyContent:'center' },
  settingIcon:     { fontSize:16 },
  settingLabel:    { flex:1, color: colors.text, fontSize: typography.size.subheading, fontWeight:typography.weight.regular },
  settingArrow:    { color: colors.textDim, fontSize:20 },

  signOutBtn: { marginHorizontal: spacing.xxl, marginTop: spacing.lg, paddingVertical: spacing.lg, borderRadius: radius.xl, borderWidth:1, borderColor:'rgba(224,90,90,0.2)', alignItems:'center' },
  signOutTxt: { color: colors.red, fontSize: typography.size.bodyLg },

  center:     { alignItems:'center', paddingVertical:52, gap: spacing.lg },
  emptyEmoji: { fontSize:44 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading1, fontWeight:typography.weight.regular },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign:'center', lineHeight:20 },
  emptyBtn:   { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderWidth:1, borderColor: colors.cardBorder },
  emptyBtnTxt:{ color: colors.blue, fontSize: typography.size.bodyLg },

  favCard:      { flexDirection:'row', alignItems:'flex-start', gap: spacing.lg, marginHorizontal: spacing.xxl, marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth:1, borderColor: colors.cardBorder, padding: spacing.lg, overflow:'hidden' },
  favThumb:     { width:70, height:90, borderRadius: radius.lg, alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 },
  favEmoji:     { fontSize:28 },
  favBody:      { flex:1, gap: spacing.xxs+1 },
  favCuisine:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing:2, marginBottom:1 },
  favName:      { color: colors.text, fontSize: typography.size.subheading, fontWeight:typography.weight.regular, marginBottom:2 },
  favMeta:      { flexDirection:'row', alignItems:'center', gap: spacing.sm, marginBottom: spacing.sm },
  favRating:    { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.medium },
  favSep:       { color: colors.textDim },
  favPrice:     { color: colors.textMuted, fontSize: typography.size.caption },
  favResaBtn:   { alignSelf:'flex-start', backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  favResaBtnTxt:{ color: colors.bg, fontSize: typography.size.caption, fontWeight: typography.weight.semibold },
  favHeart:     { width:32, height:32, borderRadius:16, backgroundColor: colors.accentSoft, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(232,160,69,0.25)', flexShrink:0 },
  favHeartTxt:  { fontSize:14 },
});
