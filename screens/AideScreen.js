import { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import useAide, { FAQS } from '../src/hooks/useAide';
import MidaLogo from '../src/components/MidaLogo';

export default function AideScreen({ navigation }) {
  const { expanded, openSupport, toggleFaq } = useAide();
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <MidaLogo showTagline={false} style={{ alignItems: 'flex-start', marginBottom: 2 }} />
          <Text style={s.title}>Aide & Support</Text>
          <Text style={s.subtitle}>On est là pour t'aider</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: spacing.xl, gap: spacing.xl }}>

          <View style={s.contactRow}>
            <TouchableOpacity style={s.contactCard} onPress={openSupport} activeOpacity={0.8}>
              <Text style={s.contactIcon}>💬</Text>
              <Text style={s.contactTitle}>Chat en direct</Text>
              <Text style={s.contactSub}>Réponse en {'<'}5 min</Text>
              <View style={s.onlineBadge}>
                <View style={s.onlineDot} />
                <Text style={s.onlineTxt}>En ligne</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[s.contactCard, s.contactCardAlt]} onPress={openSupport} activeOpacity={0.8}>
              <Text style={s.contactIcon}>📧</Text>
              <Text style={[s.contactTitle, { color: colors.text }]}>Email</Text>
              <Text style={s.contactSub}>support@mida.dz</Text>
              <Text style={[s.contactSub, { marginTop: 2 }]}>Réponse en 24h</Text>
            </TouchableOpacity>
          </View>

          <View style={s.urgenceBanner}>
            <Text style={{ fontSize: 16 }}>📞</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.urgenceTitle}>Problème urgent avec un restaurant ?</Text>
              <Text style={s.urgenceSub}>Contacte directement le restaurant via sa fiche, ou le support chat pour une intervention rapide.</Text>
            </View>
          </View>

          <View>
            <Text style={s.sectionLabel}>❓ Questions fréquentes</Text>
            <View style={s.faqCard}>
              {FAQS.map((faq, i) => {
                const isOpen = expanded === i;
                const isLast = i === FAQS.length - 1;
                return (
                  <View key={i} style={[s.faqItem, !isLast && s.faqBorder]}>
                    <TouchableOpacity style={s.faqQ} onPress={() => toggleFaq(i)} activeOpacity={0.8}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.faqQTxt}>{faq.q}</Text>
                        <Text style={s.faqSection}>{faq.section}</Text>
                      </View>
                      <Text style={[s.faqChevron, isOpen && s.faqChevronOpen]}>›</Text>
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={s.faqA}>
                        <Text style={s.faqATxt}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={s.sectionLabel}>📄 Légal</Text>
            <View style={s.legalCard}>
              {["Conditions d'utilisation", "Politique de confidentialité"].map((label, i) => (
                <TouchableOpacity key={i} style={[s.legalRow, i === 0 && s.legalBorder]} activeOpacity={0.7}>
                  <Text style={s.legalTxt}>{label}</Text>
                  <Text style={s.legalArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={s.version}>Mida v1.0.0 · Alger, Algérie</Text>
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: colors.bg },

  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  backBtnTxt: { color: colors.text, fontSize: typography.size.subheading },
  title:      { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  subtitle:   { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 1 },

  contactRow:     { flexDirection: 'row', gap: spacing.lg },
  contactCard:    { flex: 1, backgroundColor: colors.accentSoft, borderRadius: radius.xxl, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  contactCardAlt: { backgroundColor: colors.card, borderColor: colors.cardBorder },
  contactIcon:    { fontSize: 28 },
  contactTitle:   { color: colors.accent, fontSize: typography.size.body, fontWeight: typography.weight.bold, textAlign: 'center' },
  contactSub:     { color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center' },
  onlineBadge:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.greenSoft, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)', marginTop: spacing.xs },
  onlineDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  onlineTxt:      { color: colors.green, fontSize: typography.size.xs },

  urgenceBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg },
  urgenceTitle:  { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.medium, marginBottom: spacing.xxs },
  urgenceSub:    { color: colors.textMuted, fontSize: typography.size.caption, lineHeight: 16 },

  sectionLabel: { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.bold, marginBottom: spacing.md },

  faqCard:        { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  faqItem:        {},
  faqBorder:      { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  faqQ:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.lg },
  faqQTxt:        { color: colors.text, fontSize: typography.size.body },
  faqSection:     { color: colors.textDim, fontSize: typography.size.xs, marginTop: 2 },
  faqChevron:     { color: colors.textDim, fontSize: typography.size.subheading },
  faqChevronOpen: { transform: [{ rotate: '90deg' }] },
  faqA:           { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: 0 },
  faqATxt:        { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 20 },

  legalCard:   { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  legalRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  legalBorder: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  legalTxt:    { color: colors.text, fontSize: typography.size.body },
  legalArrow:  { color: colors.textDim, fontSize: typography.size.subheading },

  version: { color: colors.textDim, fontSize: typography.size.xs, textAlign: 'center', letterSpacing: 1 },
});
