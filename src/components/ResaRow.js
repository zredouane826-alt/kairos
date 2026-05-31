import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { STATUS_CFG, clientName } from '../hooks/useComptoir';

export default function ResaRow({ resa, index, onConfirm, onCancel, onArrive, acting }) {
  const cfg       = STATUS_CFG[resa.status] || STATUS_CFG.pending;
  const isAct     = acting.has(resa.id);
  const isPending = resa.status === 'pending';
  const isConf    = resa.status === 'confirmed';
  const canAct    = isPending || isConf;

  return (
    <View style={[s.row, index % 2 === 0 && s.rowStripe, { borderLeftColor: cfg.color }]}>
      <View style={s.timeCol}>
        <Text style={[s.time, { color: cfg.color }]}>{resa.time_slot?.slice(0, 5)}</Text>
      </View>
      <View style={s.clientCol}>
        <Text style={s.clientName} numberOfLines={1}>{clientName(resa)}</Text>
        {!!resa.notes && <Text style={s.notes} numberOfLines={1}>📝 {resa.notes}</Text>}
      </View>
      <View style={s.couvCol}>
        <Text style={s.couvNum}>{resa.nb_adults + (resa.nb_children || 0)}</Text>
        <Text style={s.couvLbl}>pers.</Text>
      </View>
      <View style={s.statusCol}>
        <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <Text style={[s.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      <View style={s.actionsCol}>
        {isAct ? (
          <Text style={s.acting}>···</Text>
        ) : canAct ? (
          <>
            {isPending && (
              <TouchableOpacity style={s.btnConfirm} onPress={() => onConfirm(resa)}>
                <Text style={s.btnConfirmTxt}>✓  CONFIRMER</Text>
              </TouchableOpacity>
            )}
            {isConf && (
              <TouchableOpacity style={s.btnArrive} onPress={() => onArrive(resa)}>
                <Text style={s.btnArriveTxt}>✓  ARRIVÉ</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.btnCancel} onPress={() => onCancel(resa)}>
              <Text style={s.btnCancelTxt}>✕  ANNULER</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={s.noAction}>—</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: spacing.xxxl, borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  rowStripe:     { backgroundColor: colors.cardHover },
  timeCol:       { width: 110 },
  time:          { fontSize: 32, fontWeight: '300', letterSpacing: 1 },
  clientCol:     { width: 200, paddingRight: spacing.xl },
  clientName:    { color: colors.text, fontSize: 26, fontWeight: '300', letterSpacing: 0.5, marginBottom: spacing.xs },
  notes:         { color: colors.textMuted, fontSize: typography.size.subheading, fontStyle: 'italic' },
  couvCol:       { width: 90, alignItems: 'center' },
  couvNum:       { color: colors.text, fontSize: 36, fontWeight: '200' },
  couvLbl:       { color: colors.textMuted, fontSize: typography.size.body, letterSpacing: 1 },
  statusCol:     { width: 160, alignItems: 'center', paddingHorizontal: spacing.md },
  badge:         { borderRadius: radius.lg, borderWidth: 1.5, paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 1, alignItems: 'center' },
  badgeTxt:      { fontSize: typography.size.caption, fontWeight: typography.weight.semibold, letterSpacing: 1.5 },
  actionsCol:    { width: 240, gap: spacing.md, alignItems: 'flex-end' },
  acting:        { color: colors.accent, fontSize: 28, fontWeight: '200', width: 220, textAlign: 'center' },
  btnConfirm:    { backgroundColor: colors.greenSoft, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'rgba(76,175,130,0.5)', paddingVertical: 12, paddingHorizontal: spacing.xl, alignItems: 'center', width: 220 },
  btnConfirmTxt: { color: colors.green, fontSize: typography.size.heading3, fontWeight: typography.weight.semibold, letterSpacing: 1 },
  btnArrive:     { backgroundColor: colors.blueSoft, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'rgba(90,155,224,0.4)', paddingVertical: 12, paddingHorizontal: spacing.xl, alignItems: 'center', width: 220 },
  btnArriveTxt:  { color: colors.blue, fontSize: typography.size.heading3, fontWeight: typography.weight.semibold, letterSpacing: 1 },
  btnCancel:     { backgroundColor: colors.redSoft, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'rgba(224,90,90,0.35)', paddingVertical: 12, paddingHorizontal: spacing.xl, alignItems: 'center', width: 220 },
  btnCancelTxt:  { color: colors.red, fontSize: typography.size.heading3, fontWeight: typography.weight.semibold, letterSpacing: 1 },
  noAction:      { color: colors.textDim, fontSize: 22, width: 220, textAlign: 'center' },
});
