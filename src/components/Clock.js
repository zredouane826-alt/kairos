import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export default function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={s.wrap}>
      <Text style={s.time}>
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={s.date}>
        {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.md },
  time: { color: colors.accent, fontSize: 52, fontWeight: '200', letterSpacing: 2, lineHeight: 58 },
  date: { color: colors.textMuted, fontSize: typography.size.heading3, fontWeight: '300', letterSpacing: 1, textTransform: 'capitalize' },
});
