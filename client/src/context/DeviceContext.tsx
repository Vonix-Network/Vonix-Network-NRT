import React, { createContext, useContext, useEffect, useState } from 'react';
import { isMobileDevice, getDeviceType } from '../utils/deviceDetection';

interface DeviceContextType {
  isMobile: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

interface DeviceProviderProps {
  children: React.ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceContextType>({
    isMobile: isMobileDevice(),
    deviceType: getDeviceType(),
    orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo({
        isMobile: isMobileDevice(),
        deviceType: getDeviceType(),
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      });
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return (
    <DeviceContext.Provider value={deviceInfo}>
      {children}
    </DeviceContext.Provider>
  );
};
