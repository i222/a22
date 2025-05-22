// src/main.tsx

/**
 * Application entry point.
 *
 * This file sets up the root React rendering, applies global configuration (e.g. Ant Design theme),
 * wraps the application in routing, context providers (e.g. BridgeServiceProvider), and an error boundary
 * to catch and display rendering/runtime errors gracefully.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary'; // Error handler component
import 'antd/dist/reset.css'; // Reset Ant Design styles
import { BridgeServiceProvider } from './contexts/BridgeServiceContext'; // Updated import for BridgeServiceProvider

import { defaultConfig, defaultTheme } from 'antd/es/theme/context';
import { getComputedToken } from 'antd/es/theme/useToken';
import { customTheme } from './theme/customTheme';

// const fullToken = defaultTheme.getDerivativeToken(defaultConfig.token);
// console.log(fullToken, defaultConfig.token, theme.defaultSeed);

// const computed = getComputedToken(theme.defaultSeed, {}, defaultTheme);
// console.log(computed.token);

// Create root and render the application
ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		{/* Top-level error boundary to catch crashes in any child component (including BridgeServiceProvider) */}
		<ErrorBoundary>
			{/* Global UI configuration for Ant Design */}
			<ConfigProvider
				theme={customTheme}
			>
				{/* BridgeServiceProvider exposes the Bridge service via React context */}
				<BridgeServiceProvider>
					{/* HashRouter enables routing inside Electron-based or static apps */}
					<HashRouter>
						{/* Main application layout and routing */}
						<App />
					</HashRouter>
				</BridgeServiceProvider>
			</ConfigProvider>
		</ErrorBoundary>
	</React.StrictMode>
);
