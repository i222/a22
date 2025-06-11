// ui-react/src/contexts/BridgeServiceContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import EventService from '../services/eventService';

// Creating a context for BridgeService
const BridgeServiceContext = createContext<EventService | null>(null);

// Custom hook for easy access to the context
export const useBridgeService = (): EventService => {
	const context = useContext(BridgeServiceContext);
	if (!context) {
		throw new Error('useBridgeService must be used within a BridgeServiceProvider');
	}
	return context;
};

// Context provider component with typed children
interface BridgeServiceProviderProps {
	children: ReactNode; // Typing children as ReactNode
}

export const BridgeServiceProvider: React.FC<BridgeServiceProviderProps> = ({ children }) => {
	// Creating a single instance of the service for the entire app
	const bridgeService = new EventService();

	return (
		<BridgeServiceContext.Provider value={bridgeService}>
			{children}
		</BridgeServiceContext.Provider>
	);
};
