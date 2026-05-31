import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export const PROMO_TYPES = [
  { id: 'percent', icon: '%',   label: 'Réduction %',  desc: "Ex : −20% sur l'addition" },
  { id: 'fixed',   icon: 'DA',  label: 'Montant fixe', desc: 'Ex : −500 DA offerts' },
  { id: 'free',    icon: '🎁',  label: 'Offert',        desc: 'Ex : Dessert offert' },
  { id: '2for1',   icon: '2×1', label: '2 pour 1',     desc: 'Le moins cher offert' },
];
export const PERCENTS = ['10%', '15%', '20%', '25%', '30%'];
export const PAST_PROMOS = [
  { label: '−15% weekend',         period: '1–15 Mai',  uses: 34  },
  { label: 'Menu spécial Ramadan', period: 'Mars–Avr.', uses: 112 },
];

export default function useProPromos() {
  const [view,       setView]       = useState('list');
  const [restaurant, setRestaurant] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: ownerRow } = await supabase
          .from('restaurant_owners')
          .select('restaurant_id')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        if (ownerRow?.restaurant_id) {
          const { data: resto } = await supabase
            .from('restaurants')
            .select('id, name')
            .eq('id', ownerRow.restaurant_id)
            .maybeSingle();
          if (resto) setRestaurant(resto);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []));

  const goList   = useCallback(() => setView('list'),   []);
  const goCreate = useCallback(() => setView('create'), []);
  const goActive = useCallback(() => setView('active'), []);

  return { view, restaurant, loading, goList, goCreate, goActive };
}
