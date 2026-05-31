import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { PAST_PROMOS } from '../hooks/useProPromos';

export default function PromoListView({ restaurant, onCreate }) {
  const hasActive = true;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ padding: spacing.xl, gap: spacing.xl }}>

        {hasActive && (
          <View style={s.activeBanner}>
            <Text style={{ fontSize: 22 }}>🟢</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.activeBannerTitle}>1 promo active en ce moment</Text>
              <Text style={s.activeBannerSub}>Visible par tous les clients sur ta fiche</Text>
            </View>
          </View>
        )}

        <View>
          <Text style={s.sectionLabel}>⚡ Active</Text>
          <View style={s.promoCard}>
            <View style={s.promoCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.promoTitle}>−20% sur l'addition</Text>
                <Text style={s.promoSub}>Avant 21h · Tous les soirs</Text>
              </View>
              <View style={s.livePill}>
                <View style={s.liveDot} />
                <Text style={s.liveTxt}>Live</Text>
              </View>
            </View>

            <View style={s.tagRow}>
              {['📅 Lun–Ven', '🕐 18h–21h', '👥 Sans minimum'].map(t => (
                <View key={t} style={s.tag}><Text style={s.tagTxt}>{t}</Text></View>
              ))}
            </View>

            <View style={s.progressBox}>
              <View style={s.progressRow}>
                <Text style={s.progressLabel}>Utilisations aujourd'hui</Text>
                <Text style={s.progressVal}>7 / 20</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: '35%' }]} />
              </View>
            </View>

            <View style={s.actionRow}>
              <TouchableOpacity style={s.editBtn}>
                <Text style={s.editBtnTxt}>✏️ Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.pauseBtn}>
                <Text style={s.pauseBtnTxt}>⏸ Suspendre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View>
          <Text style={s.sectionLabel}>📋 Passées</Text>
          {PAST_PROMOS.map((p, i) => (
            <View key={i} style={s.pastCard}>
              <View style={s.pastCardTop}>
                <Text style={s.pastTitle}>{p.label}</Text>
                <View style={s.usesPill}>
                  <Text style={s.usesTxt}>{p.uses} utilisations</Text>
                </View>
              </View>
              <Text style={s.pastPeriod}>{p.period}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  activeBanner:      { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.greenSoft, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  activeBannerTitle: { color: colors.green, fontSize: typography.size.body, fontWeight: typography.weight.bold },
  activeBannerSub:   { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 2 },
  sectionLabel:      { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.bold, marginBottom: spacing.md },
  promoCard:         { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1.5, borderColor: colors.accent },
  promoCardTop:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  promoTitle:        { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.extrabold },
  promoSub:          { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 2 },
  livePill:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.greenSoft, borderRadius: 100, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  liveDot:           { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  liveTxt:           { color: colors.green, fontSize: typography.size.caption, fontWeight: typography.weight.semibold },
  tagRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  tag:               { backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.2)' },
  tagTxt:            { color: colors.accent, fontSize: typography.size.caption },
  progressBox:       { backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg },
  progressRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressLabel:     { color: colors.textMuted, fontSize: typography.size.caption },
  progressVal:       { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  progressTrack:     { height: 4, backgroundColor: colors.cardBorder, borderRadius: 2 },
  progressFill:      { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  actionRow:         { flexDirection: 'row', gap: spacing.sm },
  editBtn:           { flex: 1, backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,160,69,0.2)' },
  editBtnTxt:        { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  pauseBtn:          { flex: 1, backgroundColor: colors.redSoft, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(224,90,90,0.2)' },
  pauseBtnTxt:       { color: colors.red, fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  pastCard:          { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, opacity: 0.75 },
  pastCardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  pastTitle:         { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.bold },
  pastPeriod:        { color: colors.textDim, fontSize: typography.size.caption },
  usesPill:          { backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  usesTxt:           { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.medium },
});
