// import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
// import { ElectronBridge, validateElectronBridge } from 'a22-shared';
// import { RIPIT_BRIDGE_NAME } from 'a22-shared';
// import { mockElectronBridge } from '../../mocks/mockElectronBridge'; // Uncomment for development/testing
// import { A22_ENV_USE_MOCK } from '../env-config';

// // Define the shape of the context
// interface ElectronBridgeContextType {
//   electronBridge: ElectronBridge | null;
// }

// // Create a context with null as default
// const ElectronBridgeContext = createContext<ElectronBridgeContextType | undefined>(undefined);

// /**
//  * Provides access to ElectronBridge via React Context.
//  * Must wrap this provider around any component that uses `useElectronBridge`.
//  */
// export const ElectronBridgeProvider = ({ children }: { children: ReactNode }) => {
//   const [electronBridge, setElectronBridge] = useState<ElectronBridge | null>(null);

//   useEffect(() => {
//     // Simulate async bridge initialization
//     const bridge = A22_ENV_USE_MOCK
//       ? mockElectronBridge as ElectronBridge
//       : window[RIPIT_BRIDGE_NAME] as ElectronBridge;

//     if (!bridge) {
//       console.error('ElectronBridge not found on window');
//       throw new Error('ElectronBridge is missing');
//     }

//     if (!validateElectronBridge(bridge)) {
//       throw new Error('ElectronBridge is missing required handlers');
//     }

//     setElectronBridge(bridge); // Set the bridge in state
//   }, []);

//   if (!electronBridge) {
//     return <div>Loading...</div>; // Show loading state until ElectronBridge is ready
//   }

//   return (
//     <ElectronBridgeContext.Provider value={{ electronBridge }}>
//       {children}
//     </ElectronBridgeContext.Provider>
//   );
// };

// /**
//  * Hook to access ElectronBridge from React Context.
//  * Must be called inside an ElectronBridgeProvider.
//  */
// export const useElectronBridge = (): ElectronBridge => {
//   const context = useContext(ElectronBridgeContext);

//   if (!context) {
//     throw new Error('useElectronBridge must be used within ElectronBridgeProvider');
//   }

//   return context.electronBridge!;
// };
