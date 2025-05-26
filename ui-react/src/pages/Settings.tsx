import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Alert, Space, Spin, Typography, Tooltip } from 'antd';
import { InfoCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useBridgeService } from '../contexts/BridgeServiceContext';
import { TaskProc } from 'a22-shared'; // adjust import path as needed

const { Title, Text } = Typography;

type SettingsConfig = TaskProc.AppSettings;

/**
 * Settings component for managing application settings.
 * 
 * This component fetches application settings from the backend,
 * displays the base directory for downloads, and allows editing
 * this directory by opening a directory picker.
 * 
 * It uses a task-based communication bridge (`bridge`) to send requests
 * and listen for responses or errors.
 * 
 * Features:
 * - Fetch and display app settings on mount
 * - Show loading state while fetching or saving
 * - Show error alerts on failures
 * - Provide a read-only input displaying the current base download directory
 * - Allow editing the directory by triggering a directory picker request
 * 
 * Uses Ant Design components for UI.
 */
const Settings: React.FC = () => {
	const bridge = useBridgeService();

	// Application settings config fetched from backend
	const [config, setConfig] = useState<SettingsConfig | null>(null);
	// Loading state for fetch or save operations
	const [loading, setLoading] = useState(true);
	// Saving state when an edit request is in progress
	const [saving, setSaving] = useState(false);
	// Error message state to display any errors
	const [error, setError] = useState<string | null>(null);

	// Ref to track current task/request ID for matching responses
	const requestIdRef = useRef<string | null>(null);

	useEffect(() => {
		/**
		 * Fetches current application settings by sending a task request.
		 * Updates loading and error states accordingly.
		 */
		const fetchSettings = async () => {
			setLoading(true);
			setError(null);
			try {
				// Send a request to get app settings
				const taskId = await bridge.runTask({
					type: 'TID_APP_SETTINGS_GET_REQ',
					payload: null as TaskProc.AppSettingsGetReqPayload,
				});
				requestIdRef.current = taskId;
			} catch (err: any) {
				// Handle fetch failure
				setError('Failed to fetch settings: ' + err.message);
				setLoading(false);
			}
		};

		fetchSettings();

		/**
		 * Handles incoming task events from the bridge.
		 * Processes results, errors, or cancellations.
		 * Filters events by taskId or broadcast.
		 */
		const handleEvent = (event: TaskProc.EventResp) => {
			if (event.taskId !== requestIdRef.current && event.taskId !== 'BROADCAST') return;

			switch (event.type) {
				case 'result':
					// On success, update config and reset loading/saving states
					setConfig(event.payload as SettingsConfig);
					break;
				case 'error':
					// On error, show message and reset loading/saving states
					setError(event.message || 'Error occurred');
					break;
				case 'cancelled':
					// On cancellation, just reset loading/saving states
					break;
			}
		};

		setLoading(false);
		setSaving(false);

		// Subscribe to bridge events
		bridge.subscribe(handleEvent);
		// Cleanup subscription on unmount
		return () => {
			bridge.unsubscribe(handleEvent);
		};
	}, [bridge]);

	/**
	 * Handles click on the "Edit" button.
	 * Initiates a task to open the directory picker to change the base download directory.
	 */
	const onEditClick = async () => {
		if (!config) return;
		setSaving(true);
		setError(null);

		try {
			// Send task request to open directory change dialog
			const taskId = await bridge.runTask({
				type: 'TID_APP_SETTINGS_CHANGE_DIR_REQ',
				payload: { changeField: 'baseDownloadDir' } as TaskProc.AppSettingsChangeDirReqPayload,
			});
			requestIdRef.current = taskId;
		} catch (err: any) {
			// Handle failure to initiate edit
			setError('Failed to initiate edit: ' + err.message);
			setSaving(false);
		}
	};

	return (
		<Space direction="vertical" style={{ width: '100%', maxWidth: 600, margin: 'auto' }}>
			{/* Page title */}
			<Title level={3}>
				Application Settings
			</Title>

			{loading ? (
				// Show spinner while loading settings
				<Spin tip="Loading settings..." />
			) : (
				<>
					{/* Display error alert if any */}
					{error && (
						<Alert
							type="error"
							message="Error"
							description={error}
							closable
							onClose={() => setError(null)}
							style={{ marginBottom: 16 }}
						/>
					)}

					{/* Label for base download directory */}
					<Text strong>
						Base directory for downloaded files:
					</Text>

					{/* Input field and edit button in one line */}
					<Space style={{ width: '100%', justifyContent: 'flex-start', flexGrow: 1 }}>
						<Input
							value={config?.baseDownloadDir ?? ''}
							readOnly
							placeholder="Select directory"
							style={{
								minWidth: 360,
								cursor: 'default',
								userSelect: 'text',
								flexGrow: 1,
								marginRight: 8,
							}}
						/>
						<Button
							onClick={onEditClick}
							disabled={saving}
							icon={<EditOutlined />}
							type="primary"
							style={{ flexShrink: 0 }}
						>
							Edit
						</Button>
					</Space>

					{/* Info tooltip and warning text */}
					<Space style={{ marginTop: 12 }}>
						<Tooltip title="The application works only with files in this directory or its subfolders.">
							<InfoCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />
						</Tooltip>
						<Text type="warning" style={{ margin: 0 }}>
							The application works only with files in this directory or its subfolders.
						</Text>
					</Space>

					{/* Show spinner while saving */}
					{saving && <Spin tip="Opening folder selection..." style={{ marginTop: 16 }} />}
				</>
			)}
		</Space>
	);
};

export default Settings;
