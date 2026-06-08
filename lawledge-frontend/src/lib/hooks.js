import { useContext } from 'react';
import { AuthContext, SocketContext, AppContext } from './contextInstances.js';

export function useAuth() {
  return useContext(AuthContext);
}

export function useSocket() {
  return useContext(SocketContext);
}

export function useApp() {
  return useContext(AppContext);
}