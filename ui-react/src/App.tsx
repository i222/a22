import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
	HomeOutlined,
	SettingOutlined,
	PlusOutlined
} from '@ant-design/icons';
import Home from './pages/Home';
import Settings from './pages/Settings';
import AddSource from './pages/AddSource';

const { Header, Content } = Layout;

export default function App() {
	const location = useLocation();

	return (
		<Layout style={{ minHeight: '100vh' }}>
			<Header style={{ display: 'flex', alignItems: 'center' }}>
				<Menu
					theme="dark"
					mode="horizontal"
					selectedKeys={[location.pathname]}
					style={{ flex: 1 }}
					items={[
						{
							key: '/',
							icon: <HomeOutlined />,
							label: <Link to="/">Home</Link>,
						},
						{
							key: '/add-source',
							icon: <PlusOutlined />,
							label: <Link to="/add-source">Add Source</Link>,
						},
						{
							key: '/settings',
							icon: <SettingOutlined />,
							label: <Link to="/settings">Settings</Link>,
							style: { marginLeft: 'auto' },
						},
					]}
				/>

			</Header>

			<Content style={{ padding: '24px' }}>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/add-source" element={<AddSource />} />
					<Route path="/settings" element={<Settings />} />
				</Routes>
			</Content>
		</Layout>
	);
}
