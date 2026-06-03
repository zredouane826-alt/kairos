import * as Linking from 'expo-linking';

export const linkingConfig = {
  prefixes: [Linking.createURL('/'), 'mida://'],
  config: {
    screens: {
      Main: {
        screens: {
          Accueil: 'home',
          Recherche: 'explorer',
          Favoris: 'favoris',
          Resa: 'reservations',
          Manager: 'dashboard',
        },
      },
      Restaurant: 'restaurant/:id',
      ReservationForm: 'reservation/:restaurantId',
      Profil: 'profil',
      Notifications: 'notifications',
      Search: 'search',
      Settings: 'settings',
      Aide: 'aide',
    },
  },
};
