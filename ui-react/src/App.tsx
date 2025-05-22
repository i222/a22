// src/App.tsx

import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Badge, Space, Tooltip, Flex } from 'antd';
import { HomeOutlined, SettingOutlined, PlusOutlined, AppstoreOutlined, AppstoreFilled, DownloadOutlined } from '@ant-design/icons';

import Home from './pages/Home';
import Settings from './pages/Settings';
import AddSource from './pages/AddSource';
import TaskMonitor from './components/TaskMonitor/TaskMonitor';
import TaskManager from './pages/TaskManager';
import TaskManagerIndicator from './components/TaskManagerIndicator/TaskManagerIndicator';

const { Header, Content } = Layout;

/**
 * App
 *
 * Root layout of the React application.
 * Includes global navigation (Header) and page routing.
 */
export default function App() {
	const location = useLocation();
	const [collapsed, setCollapsed] = useState(2); // State for managing TaskMonitor collapse

	// Toggle the collapse state of TaskMonitor
	const toggleCollapse = () => {
		setCollapsed(2 == collapsed ? 3 : 2); // emulate signal(void)
	};

	// Determine which icon to show depending on the collapsed state
	// const icon = collapsed ? <AppstoreOutlined /> : <AppstoreAddOutlined />;
	return (
		<Layout style={{ minHeight: '100vh' }}>
			{/* Global header with navigation menu */}
			<Header style={{ display: 'flex', alignItems: 'center' }}>
				{/* <Menu
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
							key: '/tasks',
							icon: <TaskManagerIndicator />,
							label: <Link to="/tasks">Task Manager</Link>,
						},
						{
							key: '/settings',
							icon: <SettingOutlined />,
							label: <Link to="/settings">Settings</Link>,
							style: { marginLeft: 'auto' }, // Push to right side
						},
						{
							key: 'task-monitor-toggle',
							icon: (
								<Badge dot>
									<Button
										type="primary"
										shape="circle"
										icon={collapsed ? <AppstoreFilled /> : <AppstoreOutlined />} // Use standard icons
										onClick={toggleCollapse}
										title="Monitoring" // Tooltip hint for the button
									/>
								</Badge>
							),
							// style: { marginLeft: '10px' }, // Add some spacing
						},
					]}
				/> */}
				<Space>
					<Link to="/">
						<Button key="/" icon={<HomeOutlined />}>
							Home
						</Button>
					</Link>
					<Link to="/add-source">
						<Button key="/add-source" icon={<PlusOutlined />}>
							Add Source
						</Button>
					</Link>
					<Link to="/tasks">
						<Button key="/tasks" >
							<Flex justify={'center'} align={'center'}>
								<TaskManagerIndicator />
								Task Manager
							</Flex>
						</Button>
					</Link>
					<Link to="/settings">
						<Button key="/settings" icon={<SettingOutlined />}>
							Settings
						</Button>
					</Link>
					<Link to="">
						<Tooltip title="Monitoring">
							<Button
								key="task-monitor-toggle"
								type="primary"
								shape="circle"
								icon={collapsed ? <AppstoreFilled /> : <AppstoreOutlined />}
								onClick={toggleCollapse}
							/>
						</Tooltip>
					</Link>
				</Space>

			</Header>

			{/* Task Monitor Component */}
			<TaskMonitor toggleCollapsed={collapsed} />

			{/* Main content area with routing */}
			<Content style={{ padding: '24px' }}>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/add-source" element={<AddSource />} />
					<Route path="/tasks" element={<TaskManager />} />
					<Route path="/settings" element={<Settings />} />
				</Routes>
			</Content>
		</Layout>
	);
}
