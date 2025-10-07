import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

export type FeatureFlags = {
  servers: boolean;
  forum: boolean;
  social: boolean;
  messages: boolean;
  discord_chat: boolean;
};

const defaultFlags: FeatureFlags = {
  servers: true,
  forum: true,
  social: true,
  messages: true,
  discord_chat: true,
};

const FeatureContext = createContext<{ flags: FeatureFlags; refresh: () => void }>({
  flags: defaultFlags,
  refresh: () => {},
});

export const useFeatures = () => useContext(FeatureContext);

export const FeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);

  const load = async () => {
    try {
      const res = await api.get('/features');
      setFlags({ ...defaultFlags, ...res.data });
    } catch {
      setFlags(defaultFlags);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FeatureContext.Provider value={{ flags, refresh: load }}>
      {children}
    </FeatureContext.Provider>
  );
};
