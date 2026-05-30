import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Switch,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';

const GROUPS = [
  {
    section: '🔔 Notifications',
    items: [
      { label: 'Confirmations de réservation', sub: 'Push & SMS',      toggle: true,  defaultOn: true  },
      { label: 'Rappel 2h avant',              sub: 'Push',            toggle: true,  defaultOn: true  },
      { label: 'Nouvelles promos',             sub: 'Restaurants fav', toggle: true,  defaultOn: true  },
      { label: 'Rappel laisser un avis',       sub: 'Email',           toggle: true,  defaultOn: false },
    ],
  },
  {
    section: '🌐 Langue & région',
    items: [
      { label: 'Langue',  sub: 'Français', arrow: true },
      { label: 'Devise',  sub: 'DZD · Dinar algérien', arrow: true },
    ],
  },
  {
    section: '🔒 Compte & sécurité',
    items: [
      { label: 'Changer le mot de passe',         sub: null,           arrow: true },
      { label: 'Authentification 2 facteurs',      sub: 'Désactivée',   arrow: true },
      { label: 'Sessions actives',                 sub: '1 appareil',   arrow: true },
    ],
  },
  {
    section: '📄 Légal',
    items: [
      { label: "Conditions d'utilisation", arrow: true },
      { label: 'Politique de confidentialité', arrow: true },
    ],
  },
  {
    section: 'ℹ️ À propos',
    items: [
      { label: "Version de l'app", sub: 'Mida v1.0.0' },
      { label: 'Mentions légales', arrow: true },
    ],
  },
];

function ToggleRow({ label, sub, value, onChange }) {
  return (
    <View style={r.row}>
      <View style={{ flex: 1 }}>
        <Text style={r.label}>{label}</Text>
        {!!sub && <Text style={r.sub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.cardBorder, true: colors.accent + '80' }}
        thumbColor={value ? colors.accent : colors.textDim}
        ios_backgroundColor={colors.cardBorder}
      />
    </View>
  );
}

function ArrowRow({ label, sub, onPress, border }) {
  return (
    <TouchableOpacity style={[r.row, border && r.border]} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={r.label}>{label}</Text>
        {!!sub && <Text style={r.sub}>{sub}</Text>}
      </View>
      <Text style={r.arrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const [toggles, setToggles] = useState(() => {
    const map = {};
    GROUPS.forEach(g => g.items.forEach((item, i) => {
      if (item.toggle) map[g.section + i] = item.defaultOn;
    }));
    return map;
  });

  const toggle = useCallback((key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Paramètres</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingVertical: spacing.xl, gap: spacing.xl }}>
          {GROUPS.map((group) => (
            <View key={group.section} style={{ paddingHorizontal: spacing.xl }}>
              <Text style={s.sectionLabel}>{group.section}</Text>
              <View style={s.card}>
                {group.items.map((item, i) => {
                  const key = group.section + i;
                  const isLast = i === group.items.length - 1;
                  if (item.toggle) {
                    return (
                      <View key={i} style={[r.row, !isLast && r.border]}>
                        <View style={{ flex: 1 }}>
                          <Text style={r.label}>{item.label}</Text>
                          {!!item.sub && <Text style={r.sub}>{item.sub}</Text>}
                        </View>
                        <Switch
                          value={!!toggles[key]}
                          onValueChange={() => toggle(key)}
                          trackColor={{ false: colors.cardBorder, true: colors.accent + '80' }}
                          thumbColor={toggles[key] ? colors.accent : colors.textDim}
                          ios_backgroundColor={colors.cardBorder}
                        />
                      </View>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[r.row, !isLast && r.border]}
                      activeOpacity={item.arrow ? 0.7 : 1}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={r.label}>{item.label}</Text>
                        {!!item.sub && <Text style={r.sub}>{item.sub}</Text>}
                      </View>
                      {item.arrow && <Text style={r.arrow}>›</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Aide link */}
          <View style={{ paddingHorizontal: spacing.xl }}>
            <Text style={s.sectionLabel}>❓ Aide</Text>
            <View style={s.card}>
              <TouchableOpacity style={[r.row, r.border]} onPress={() => navigation.navigate('Aide')}>
                <Text style={r.label}>Centre d'aide & FAQ</Text>
                <Text style={r.arrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={r.row}>
                <Text style={r.label}>Signaler un problème</Text>
                <Text style={r.arrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const r = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.lg },
  border: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  label:  { color: colors.text, fontSize: typography.size.body },
  sub:    { color: colors.textDim, fontSize: typography.size.xs, marginTop: 2 },
  arrow:  { color: colors.textDim, fontSize: typography.size.subheading },
});

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: colors.bg },
  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  backBtnTxt: { color: colors.text, fontSize: typography.size.subheading },
  title:      { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  sectionLabel: { color: colors.accent, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.md },
  card:         { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
});
