import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../supabase';

const C = { bg:'#0d1628', marine:'#1a2332', sea:'#4a7fa5', accent:'#c8975a', text:'#f0ece4', dim:'#8a9ab0', card:'#111827', border:'rgba(255,255,255,0.07)', red:'#c0392b' };

export default function AuthScreen({ onAuth }) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendOTP() {
    setLoading(true);
    setError('');
    const full = phone.startsWith('+') ? phone : '+213' + phone.replace(/^0/, '');
    const { error: err } = await supabase.auth.signInWithOtp({ phone: full });
    if (err) setError(err.message);
    else setStep('otp');
    setLoading(false);
  }

  async function verifyOTP() {
    setLoading(true);
    setError('');
    const full = phone.startsWith('+') ? phone : '+213' + phone.replace(/^0/, '');
    const { data, error: err } = await supabase.auth.verifyOtp({ phone: full, token: otp, type: 'sms' });
    if (err) setError(err.message);
    else if (data.session) onAuth(data.session);
    setLoading(false);
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, width: '100%' }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.logo}>MIDA</Text>
          <Text style={s.tagline}>La bonne table, au bon moment.</Text>
          <View style={s.card}>
            {step === 'phone' ? (
              <>
                <Text style={s.title}>Bienvenue</Text>
                <Text style={s.desc}>Entrez votre numero pour continuer</Text>
                <View style={s.row}>
                  <View style={s.prefix}><Text style={s.prefixTxt}>+213</Text></View>
                  <TextInput style={s.input} placeholder="6XX XX XX XX" placeholderTextColor={C.dim} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                </View>
                {error ? <Text style={s.err}>{error}</Text> : null}
                <TouchableOpacity style={s.btn} onPress={sendOTP}>
                  <Text style={s.btnTxt}>{loading ? '...' : 'RECEVOIR LE CODE'}</Text>
                </TouchableOpacity>
                <Text style={s.legal}>En continuant, vous acceptez nos <Text style={s.legalLink}>Conditions d utilisation</Text> et notre <Text style={s.legalLink}>Politique de confidentialite</Text></Text>
              </>
            ) : (
              <>
                <Text style={s.title}>Code de verification</Text>
                <Text style={s.desc}>Code envoye sur votre telephone</Text>
                <TextInput style={s.otpInput} placeholder="000000" placeholderTextColor={C.dim} keyboardType="number-pad" value={otp} onChangeText={setOtp} maxLength={6} />
                {error ? <Text style={s.err}>{error}</Text> : null}
                <TouchableOpacity style={s.btn} onPress={verifyOTP}>
                  <Text style={s.btnTxt}>{loading ? '...' : 'CONFIRMER'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('phone')}>
                  <Text style={s.back}>Changer de numero</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },
  scroll:     { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo:       { color: C.accent, fontSize: 36, fontWeight: '300', letterSpacing: 10, marginBottom: 6 },
  tagline:    { color: C.dim, fontSize: 12, fontStyle: 'italic', marginBottom: 32, letterSpacing: 1 },
  card:       { width: '100%', maxWidth: 360, backgroundColor: C.bg, borderRadius: 20, padding: 28 },
  title:      { color: C.text, fontSize: 22, fontWeight: '300', marginBottom: 8 },
  desc:       { color: C.dim, fontSize: 13, marginBottom: 24 },
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  prefix:     { backgroundColor: C.marine, paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: 1, borderRightColor: C.border },
  prefixTxt:  { color: C.text, fontSize: 13 },
  input:      { flex: 1, color: C.text, fontSize: 16, paddingHorizontal: 14, paddingVertical: 14 },
  otpInput:   { backgroundColor: C.bg, borderWidth: 1, borderColor: C.sea, borderRadius: 12, color: C.text, fontSize: 28, fontWeight: '300', paddingVertical: 16, marginBottom: 16, textAlign: 'center' },
  err:        { color: C.red, fontSize: 12, marginBottom: 12, textAlign: 'center' },
  btn:        { backgroundColor: C.sea, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnTxt:     { color: C.text, fontSize: 13, fontWeight: '400', letterSpacing: 2 },
  back:       { color: C.sea, fontSize: 12, textAlign: 'center', marginTop: 8 },
  legal:      { color: C.dim, fontSize: 10, textAlign: 'center', marginTop: 8, lineHeight: 16 },
  legalLink:  { color: C.sea },
});
