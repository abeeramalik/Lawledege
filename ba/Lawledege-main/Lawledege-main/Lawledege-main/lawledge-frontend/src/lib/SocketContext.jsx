import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './hooks'; // Read from unified hook channel
import { SocketContext } from './contextInstances.js';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeSocket, setActiveSocket] = useState(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:4000', { transports: ['websocket'] });
    const socket = socketRef.current;
    setActiveSocket(socket); 
    
    socket.on('online_users', setOnlineUsers);
    
    if (user) {
      socket.emit('join', user.id);
    }
    
    return () => {
      socket.disconnect();
      setActiveSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: activeSocket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}