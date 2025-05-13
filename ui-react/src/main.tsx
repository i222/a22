import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ElectronBridgeProvider } from './contexts/electronBridgeContext';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ConfigProvider
			theme={{ token: { colorPrimary: '#1677ff', borderRadius: 4 } }}
		>
			<ElectronBridgeProvider>
				<HashRouter>
					<App />
				</HashRouter>
			</ElectronBridgeProvider>
		</ConfigProvider>
	</React.StrictMode>
);
