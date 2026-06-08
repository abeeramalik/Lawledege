import { useState } from 'react';
import { AppContext } from './contextInstances'; // Imported safely from our non-component registry

export function AppProvider({ children }) {
  const [highVisibility, setHighVisibility] = useState(false);

  return (
    <AppContext.Provider value={{ highVisibility, setHighVisibility }}>
      {children}
    </AppContext.Provider>
  );
}

// Default fallback export layer
export default AppProvider;