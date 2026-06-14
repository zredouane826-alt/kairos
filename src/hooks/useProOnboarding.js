import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../supabase';

export const SETUP_STEPS = [
  { key: 'info',     icon: '✏️', label: 'Informations',  desc: 'Cuisine, adresse, description',      screen: 'ProInfo' },
  { key: 'photos',   icon: '📷', label: 'Photos',         desc: 'Ajoutez des photos attrayantes',     screen: 'ProPhotos' },
  { key: 'menu',     icon: '🍽️', label: 'Menu',           desc: 'Créez vos plats et tarifs',          screen: 'ProMenu' },
  { key: 'horaires', icon: '🕐', label: 'Horaires',       desc: "Définissez vos heures d'ouverture",  screen: 'ProHoraires' },
];

async function checkDbCompletion(restaurantId) {
  const [restoRes, dishRes, schedRes] = await Promise.all([
    supabase.from('restaurants').select('description, cuisine_type, photos').eq('id', restaurantId).maybeSingle(),
    supabase.from('dishes').select('id', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
    supabase.from('restaurant_schedules').select('id', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
  ]);

  const r = restoRes.data;
  return {
    info:     !!(r?.description && r?.cuisine_type),
    photos:   Array.isArray(r?.photos) && r.photos.length > 0,
    menu:     (dishRes.count || 0) > 0,
    horaires: (schedRes.count || 0) > 0,
  };
}

export default function useProOnboarding() {
  const [userId,       setUserId]      = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [visible,      setVisible]     = useState(false);
  const [visited,      setVisited]     = useState({});

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);

      const { data: ownerRows } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', uid)
        .limit(1);
      const ownerRow = ownerRows?.[0] ?? null;

      if (!ownerRow?.restaurant_id) return;
      setRestaurantId(ownerRow.restaurant_id);

      const dbDone = await checkDbCompletion(ownerRow.restaurant_id);
      setVisited(dbDone);

      const allDone = SETUP_STEPS.every(s => dbDone[s.key]);
      setVisible(!allDone);
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Mise à jour optimiste locale après retour d'un écran
  const markVisited = useCallback((key) => {
    setVisited(prev => ({ ...prev, [key]: true }));
  }, []);

  const dismiss = useCallback(() => setVisible(false), []);

  const reset = useCallback(async () => {
    if (userId) await AsyncStorage.removeItem('@mida_setup_' + userId).catch(() => {});
    await load();
  }, [userId, load]);

  return { visible, visited, markVisited, dismiss, reset };
}
