import { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Share, Platform } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function ShareRestaurant({ restaurantName, restaurantId, style }) {
  const handleShare = useCallback(async () => {
    const deepLink = `mida://restaurant/${restaurantId}`;
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { title: restaurantName, message: `Découvre ${restaurantName} sur Mida 🍽️`, url: deepLink }
          : { title: restaurantName, message: `Découvre ${restaurantName} sur Mida 🍽️\n${deepLink}` }
      );
    } catch {
      // utilisateur a annulé ou plateforme non supportée
    }
  }, [restaurantName, restaurantId]);

  return (
    <TouchableOpacity style={[s.btn, style]} onPress={handleShare} activeOpacity={0.8}>
      <Text style={s.icon}>⬆</Text>
      <Text style={s.label}>Partager</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  icon:  { color: colors.accent, fontSize: typography.size.subheading, fontWeight: typography.weight.bold },
  label: { color: colors.text,   fontSize: typography.size.body,       fontWeight: typography.weight.medium },
});
