import { useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  accent:    '#006233',
  dim:       'rgba(255,255,255,0.45)',
  activeTxt: '#FFFFFF',
  activeBg:  'rgba(255,255,255,0.18)',
  border:    'rgba(255,255,255,0.12)',
};

const CLIENT_TABS = [
  { name: 'Accueil',   label: 'Accueil',      route: 'Accueil' },
  { name: 'Recherche', label: 'Recherche',     route: 'Recherche' },
  { name: 'Favoris',   label: 'Favoris',       route: 'Favoris' },
  { name: 'Resa',      label: 'Réservations',  route: 'Resa' },
  { name: 'Profil',    label: 'Profil',        route: 'Profil' },
];

const PRO_TABS = [
  { name: 'Accueil',   label: 'Accueil',   route: 'Accueil' },
  { name: 'Recherche', label: 'Recherche', route: 'Recherche' },
  { name: 'Favoris',   label: 'Favoris',   route: 'Favoris' },
  { name: 'Manager',   label: 'Manager',   route: 'Manager' },
  { name: 'Profil',    label: 'Profil',    route: 'Profil' },
];

function TabItem({ tab, isActive, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.84, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 12 }),
    ]).start();
    onPress();
  }, [scale, onPress]);

  return (
    <TouchableOpacity style={s.tab} onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[s.tabInner, isActive && s.tabInnerActive, { transform: [{ scale }] }]}>
        <Text style={[s.label, isActive && s.labelActive]} numberOfLines={1}>
          {tab.label}
        </Text>
        {isActive && <View style={s.activeDot} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

function detectManager(navigation) {
  try {
    const state = navigation.getState?.();
    if (!state) return false;
    const routes = state.type === 'tab'
      ? state.routes
      : state.routes?.find(r => r.name === 'Main')?.state?.routes;
    if (routes) return routes.some(r => r.name === 'Manager');
    const parent = navigation.getParent?.();
    if (parent) {
      const ps = parent.getState?.();
      if (ps?.type === 'tab') return ps.routes?.some(r => r.name === 'Manager') ?? false;
    }
    return false;
  } catch { return false; }
}

export default function BottomTabBar({ navigation, isPro = false, activeTab = null }) {
  const insets = useSafeAreaInsets();
  const [effectiveIsPro, setEffectiveIsPro] = useState(() => isPro || detectManager(navigation));

  useEffect(() => {
    if (effectiveIsPro) return;
    if (detectManager(navigation)) { setEffectiveIsPro(true); return; }
    const unsub = navigation.addListener?.('state', () => {
      if (detectManager(navigation)) setEffectiveIsPro(true);
    });
    return unsub;
  }, [navigation, effectiveIsPro]);

  const tabs = effectiveIsPro ? PRO_TABS : CLIENT_TABS;
  const goTab = useCallback((route) => {
    navigation.navigate('Main', { screen: route });
  }, [navigation]);

  return (
    <View style={[s.outerWrap, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12) }]}>
      <View style={s.container}>
        {tabs.map(tab => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={tab.name === activeTab}
            onPress={() => goTab(tab.route)}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outerWrap: {
    paddingHorizontal: 12,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13,22,40,0.72)',
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 18,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 3,
  },
  tabInnerActive: {
    backgroundColor: C.activeBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.3,
    fontWeight: '400',
    color: C.dim,
  },
  labelActive: {
    color: C.activeTxt,
    fontWeight: '600',
    fontSize: 11,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#006233',
  },
});
