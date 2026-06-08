import { createContext } from 'react';

// Decoupled Context Instances (Pure configurations, no React components)
export const AuthContext = createContext(null);
export const SocketContext = createContext(null);
export const AppContext = createContext({
  highVisibility: false,
  setHighVisibility: () => {},
});