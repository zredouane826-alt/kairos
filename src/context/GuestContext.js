import { createContext, useContext } from 'react';

export const GuestContext = createContext({ isGuest: false, exitGuestMode: () => {} });
export const useGuestContext = () => useContext(GuestContext);
