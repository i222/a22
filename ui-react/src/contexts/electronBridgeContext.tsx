import React, { createContext, useContext, ReactNode } from 'react';
import { ElectronBridge, validateElectronBridge } from 'a22-shared';
import { RIPIT_BRIDGE_NAME } from 'a22-shared';
// import { mockElectronBridge } from '../mocks/mockElectronBridge'; // Uncomment for development/testing

// Define the shape of the context
interface ElectronBridgeContextType {
	electronBridge: ElectronBridge;
}

// Create a context with undefined as default
const ElectronBridgeContext = createContext<ElectronBridgeContextType | undefined>(undefined);

/**
 * Provides access to ElectronBridge via React Context.
 * Must wrap this provider around any component that uses `useElectronBridge`.
 */
export const ElectronBridgeProvider = ({ children }: { children: ReactNode }) => {
	// Try to get the bridge from the global window object
	const electronBridge = window[RIPIT_BRIDGE_NAME] as ElectronBridge;
	// const electronBridge = mockElectronBridge as ElectronBridge;


	// ✅ For development or testing, you can use a mock:
	// const electronBridge = mockElectronBridge;

	if (!electronBridge) {
		console.error('ElectronBridge not found on window');
		throw new Error('ElectronBridge is missing');
	}

	if (!validateElectronBridge(electronBridge)) {
		throw new Error('ElectronBridge is missing required handlers');
	}

	return (
		<ElectronBridgeContext.Provider value={{ electronBridge }}>
			{children}
		</ElectronBridgeContext.Provider>
	);
};

/**
 * Hook to access ElectronBridge from React Context.
 * Must be called inside an ElectronBridgeProvider.
 */
export const useElectronBridge = (): ElectronBridge => {
	const context = useContext(ElectronBridgeContext);

	if (!context) {
		throw new Error('useElectronBridge must be used within ElectronBridgeProvider');
	}

	return context.electronBridge;
};
