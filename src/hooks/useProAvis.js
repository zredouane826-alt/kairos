import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors } from '../theme';

export const STARS   = [1, 2, 3, 4, 5];
export const FILTERS = ['Tous', '5 ⭐', '4 ⭐', '3 ⭐', '1–2 ⭐', 'Sans réponse'];

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function initials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
}

export const AVATAR_COLORS = [colors.accent, colors.blue, colors.green, colors.purple || '#9B5AE0', colors.accentDim || colors.accent];

export function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

export default function useProAvis() {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('Tous');
  const [restaurant, setRestaurant] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: ownerRow } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!ownerRow?.restaurant_id) return;

      const { data: resto } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', ownerRow.restaurant_id)
        .maybeSingle();
      if (resto) setRestaurant(resto);

      const { data } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, pro_response, users(first_name, last_name)')
        .eq('restaurant_id', ownerRow.restaurant_id)
        .order('created_at', { ascending: false });

      setReviews(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSaveResponse = useCallback((id, text) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, pro_response: text } : r));
  }, []);

  const onRefresh = useCallback(() => load(true), [load]);

  const noReply = useMemo(() => reviews.filter(r => !r.pro_response).length, [reviews]);

  const ratingCounts = useMemo(() => ({
    5:   reviews.filter(r => r.rating === 5).length,
    4:   reviews.filter(r => r.rating === 4).length,
    3:   reviews.filter(r => r.rating === 3).length,
    low: reviews.filter(r => r.rating <= 2).length,
  }), [reviews]);

  const filtered = useMemo(() => reviews.filter(r => {
    if (filter === 'Tous')         return true;
    if (filter === '5 ⭐')         return r.rating === 5;
    if (filter === '4 ⭐')         return r.rating === 4;
    if (filter === '3 ⭐')         return r.rating === 3;
    if (filter === '1–2 ⭐')       return r.rating <= 2;
    if (filter === 'Sans réponse') return !r.pro_response;
    return true;
  }), [reviews, filter]);

  return {
    reviews, loading, refreshing, filter, setFilter, restaurant,
    handleSaveResponse, onRefresh, noReply, ratingCounts, filtered,
  };
}
