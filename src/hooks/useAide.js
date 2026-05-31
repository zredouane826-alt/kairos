import { useState, useCallback } from 'react';
import { Linking } from 'react-native';

export const FAQS = [
  { q: 'Comment annuler une réservation ?',         section: 'Réservations',      answer: "Va dans Profil → Réservations, puis appuie sur la réservation concernée et sélectionne \"Annuler\". L'annulation doit être faite au moins 2h avant l'heure prévue." },
  { q: 'Comment fonctionne le système de points ?', section: 'Points & Récompenses', answer: 'Tu gagnes 1 point par tranche de 100 DA dépensés dans les restaurants partenaires Mida. 100 points = 100 DA de bon de réduction.' },
  { q: "Mon avis n'est pas publié ?",               section: 'Avis',               answer: "Les avis Mida sont certifiés : tu peux publier un avis uniquement après avoir honoré une réservation chez ce restaurant. L'avis est visible sous 24h après modération." },
  { q: 'Comment modifier mes informations ?',       section: 'Compte',             answer: 'Va dans Profil → appuie sur ton nom ou photo de profil pour modifier tes informations personnelles (nom, téléphone, photo).' },
  { q: "Le restaurant n'a pas honoré ma réservation", section: 'Réclamations',    answer: "Contacte le support via le chat ci-dessus. Nous traiterons ta réclamation sous 24h et, si justifiée, des points de compensation seront crédités sur ton compte." },
  { q: 'Comment ajouter mon restaurant sur Mida ?', section: 'Restaurateurs',     answer: "Va dans l'onglet Profil et appuie sur \"Inscris ton restaurant\". Tu seras guidé pour créer ta fiche, ajouter tes photos, horaires et menu." },
];

export default function useAide() {
  const [expanded, setExpanded] = useState(null);
  const openSupport = useCallback(() => Linking.openURL('mailto:support@mida.dz'), []);
  const toggleFaq   = useCallback((i) => setExpanded(prev => prev === i ? null : i), []);
  return { expanded, openSupport, toggleFaq };
}
