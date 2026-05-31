import { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ScrollView, useWindowDimensions,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useComptoir from '../src/hooks/useComptoir';
import Clock from '../src/components/Clock';
import ResaRow from '../src/components/ResaRow';
import CompactResaRow from '../src/components/CompactResaRow';
import ResaDetail from '../src/components/ResaDetail';

function StatBox({ label, value, color }) {
  return (
    <View style={sb.wrap}>
      <Text style={[sb.val, { color }]}>{value}</Text>
      <Text style={sb.lbl}>{label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl - 2 },
  val:  { fontSize: 36, fontWeight: '200', lineHeight: 40 },
  lbl:  { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 2, marginTop: 2 },
});

function SkeletonComptoir() {
  return (
    <View style={{ flex: 1 }}>
      {[1,2,3,4,5,6].map(i => (
        <View key={i} style={sk.row}>
          <MLoader width={90}  height={36} borderRadius={radius.sm} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <MLoader width="60%" height={26} borderRadius={radius.sm} />
            <MLoader width="35%" height={14} borderRadius={radius.sm} />
          </View>
          <MLoader width={60}  height={40} borderRadius={radius.sm} />
          <MLoader width={140} height={32} borderRadius={radius.lg} />
          <MLoader width={200} height={44} borderRadius={radius.lg} />
        </View>
      ))}
    </View>
  );
}
const sk = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxl, paddingVertical: spacing.xl, paddingHorizontal: spacing.xxxl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
});

export default function ProComptoir({ navigation }) {
  const {
    restaurant, reservations, loading, refreshing,
    acting, selectedResa, selectedResaId, stats, emptyDateStr,
    load, confirm, arrive, cancel, selectResa,
  } = useComptoir();

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const goBack    = useCallback(() => navigation.goBack(), [navigation]);
  const onRefresh = useCallback(() => load(true), [load]);

  const { total, confirmed, pending, arrived, covers } = stats;

  const renderCompact = useCallback(({ item }) => (
    <CompactResaRow
      resa={item}
      isSelected={item.id === selectedResaId}
      onSelect={selectResa}
    />
  ), [selectedResaId, selectResa]);

  const header = (
    <View style={s.header}>
      <View style={s.headerLeft}>
        {navigation && (
          <TouchableOpacity style={s.backBtn} onPress={goBack}>
            <Text style={s.backTxt}>←</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={s.logo}>MIDA</Text>
          <Text style={s.restoName}>{restaurant?.name || 'Mode comptoir'}</Text>
        </View>
      </View>
      <Clock />
      <View style={s.headerRight}>
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh} disabled={refreshing}>
          <Text style={s.refreshTxt}>{refreshing ? '···' : '↺  Actualiser'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const statsStrip = (
    <View style={s.statsStrip}>
      <StatBox label="TOTAL"      value={total}     color={colors.textMuted} />
      <View style={s.statDiv} />
      <StatBox label="CONFIRMÉES" value={confirmed}  color={colors.green}    />
      <View style={s.statDiv} />
      <StatBox label="EN ATTENTE" value={pending}    color={colors.accent}   />
      <View style={s.statDiv} />
      <StatBox label="ARRIVÉS"    value={arrived}    color={colors.blue}     />
      <View style={s.statDiv} />
      <StatBox label="COUVERTS"   value={covers}     color={colors.accent}   />
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      {header}
      {statsStrip}

      {isLandscape ? (
        <View style={s.landscape}>
          <View style={s.leftPanel}>
            <View style={s.panelHeader}>
              <Text style={s.panelTitle}>RÉSERVATIONS</Text>
              {!loading && <Text style={s.panelCount}>{reservations.length}</Text>}
            </View>
            {loading ? (
              <View style={{ padding: spacing.xl, gap: spacing.lg }}>
                {[1,2,3,4].map(i => <MLoader key={i} width="100%" height={64} borderRadius={radius.lg} />)}
              </View>
            ) : reservations.length === 0 ? (
              <View style={s.center}>
                <Text style={{ fontSize: 40 }}>📅</Text>
                <Text style={s.emptyTitleSm}>Aucune réservation</Text>
                <Text style={s.emptySub}>{emptyDateStr}</Text>
              </View>
            ) : (
              <FlatList
                data={reservations}
                keyExtractor={item => String(item.id)}
                renderItem={renderCompact}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            )}
          </View>
          <View style={s.rightPanel}>
            <ResaDetail
              resa={selectedResa}
              onConfirm={confirm}
              onCancel={cancel}
              onArrive={arrive}
              acting={acting}
            />
          </View>
        </View>
      ) : loading ? (
        <SkeletonComptoir />
      ) : reservations.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>📅</Text>
          <Text style={s.emptyTitle}>Aucune réservation aujourd'hui</Text>
          <Text style={s.emptySub}>{emptyDateStr}</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
          <View style={{ minWidth: 760 }}>
            <View style={s.colHeader}>
              <Text style={[s.colLbl, { width: 110 }]}>HEURE</Text>
              <Text style={[s.colLbl, { width: 200 }]}>CLIENT</Text>
              <Text style={[s.colLbl, { width: 90, textAlign: 'center' }]}>COUVERTS</Text>
              <Text style={[s.colLbl, { width: 160, textAlign: 'center' }]}>STATUT</Text>
              <Text style={[s.colLbl, { width: 240, textAlign: 'center' }]}>ACTIONS</Text>
            </View>
            {reservations.map((item, index) => (
              <ResaRow
                key={String(item.id)}
                resa={item}
                index={index}
                onConfirm={confirm}
                onCancel={cancel}
                onArrive={arrive}
                acting={acting}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxxl, paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, flex: 1 },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  backBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backTxt:     { color: colors.text, fontSize: 22 },
  logo:        { color: colors.accent, fontSize: typography.size.title, fontWeight: typography.weight.bold, letterSpacing: 6 },
  restoName:   { color: colors.textMuted, fontSize: typography.size.caption, letterSpacing: 1, marginTop: 2 },
  refreshBtn:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.cardHover, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder },
  refreshTxt:  { color: colors.accent, fontSize: typography.size.subheading, fontWeight: typography.weight.regular, letterSpacing: 0.5 },

  statsStrip: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  statDiv:    { width: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.lg },

  landscape:   { flex: 1, flexDirection: 'row' },
  leftPanel:   { width: '40%', borderRightWidth: 1, borderRightColor: colors.cardBorder },
  rightPanel:  { flex: 1 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.cardHover },
  panelTitle:  { color: colors.textDim, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 3 },
  panelCount:  { color: colors.accent, fontSize: typography.size.bodyLg, fontWeight: typography.weight.semibold },

  colHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xxxl, paddingVertical: spacing.lg, backgroundColor: colors.cardHover, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  colLbl:    { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 3, fontWeight: typography.weight.medium },

  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  emptyEmoji:  { fontSize: 72 },
  emptyTitle:  { color: colors.text, fontSize: 32, fontWeight: '200', letterSpacing: 0.5 },
  emptyTitleSm:{ color: colors.text, fontSize: typography.size.heading2, fontWeight: '300' },
  emptySub:    { color: colors.textMuted, fontSize: 18, fontWeight: '300', textTransform: 'capitalize' },
});
