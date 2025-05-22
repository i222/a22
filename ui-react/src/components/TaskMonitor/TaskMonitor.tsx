import React, { useState, useEffect, useRef } from 'react';
import { Alert, Button, Space, Tooltip } from 'antd';
import './TaskMonitor.css';
import { useBridgeService } from '../../contexts/BridgeServiceContext';

/**
 * TaskMonitor
 * A component that displays the progress, result, and error of ongoing tasks.
 * It can be collapsed and expanded.
 */
const TaskMonitor: React.FC<{ toggleCollapsed: unknown }> = ({ toggleCollapsed }) => {
	const [message, setMessage] = useState<string>(''); // Stores the last message to show in the monitor
	const [status, setStatus] = useState<'progress' | 'result' | 'error' | ''>(''); // Tracks the current task status
	const [isCollapsed, setIsCollapsed] = useState<boolean>(false); // Tracks the collapse state of the monitor
	const [openOnMessage, setOpenOnMessage] = useState<boolean>(true); // Flag to auto-open monitor on message arrival
	const bridge = useBridgeService(); // Access the BridgeService context
	const isFirstRender = useRef<boolean>(true);

	// Function to handle task events
	const handleEvent = (event: any) => {
		const { type, taskId, payload } = event;

		switch (type) {
			case 'progress':
			case 'result':
			case 'error':
				setStatus(type);
				setMessage(event.message);
				// Open the monitor only if it's collapsed and no message is shown yet
				if (openOnMessage && isCollapsed && !message) {
					setIsCollapsed(false);
				}
				break;

			default:
				console.log('Unknown task event type', event);
		}
	};

	// 	switch (type) {
	// 		case 'progress':
	// 			setStatus('progress');
	// 			setMessage(`Task ${taskId} is in progress: ${payload}`);
	// 			// Open the monitor only if it's collapsed and no message is shown yet
	// 			if (openOnMessage && isCollapsed && !message) {
	// 				setIsCollapsed(false);
	// 			}
	// 			break;

	// 		case 'result':
	// 			setStatus('result');
	// 			setMessage(`Task ${taskId} completed successfully!`);
	// 			// Open the monitor only if it's collapsed and no message is shown yet
	// 			if (openOnMessage && isCollapsed && !message) {
	// 				setIsCollapsed(false);
	// 			}
	// 			break;

	// 		case 'error':
	// 			setStatus('error');
	// 			setMessage(`Task ${taskId} failed: ${payload?.errorMessage || 'Unknown error'}`);
	// 			// Open the monitor only if it's collapsed and no message is shown yet
	// 			if (openOnMessage && isCollapsed && !message) {
	// 				setIsCollapsed(false);
	// 			}
	// 			break;

	// 		default:
	// 			console.log('Unknown task event type', event);
	// 	}
	// };

	// Subscribe to events
	useEffect(() => {
		bridge.subscribe(handleEvent); // Subscribe to task events

		// Clean up the subscription when the component is unmounted
		return () => {
			bridge.unsubscribe(handleEvent); // Unsubscribe when the component is removed
		};
	}, [bridge, isCollapsed, message]); // Include dependencies to ensure updates

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false; // Skip first toggle
			return;
		}
		setIsCollapsed(!isCollapsed);
		setOpenOnMessage(false);
	}, [toggleCollapsed]);

	useEffect(() => {
		if (openOnMessage && isCollapsed && message) {
			setIsCollapsed(false); // Open the monitor one time
			setOpenOnMessage(false); // Prevent future auto-opening
		}
	}, [message, isCollapsed, openOnMessage]);

	return (
		<div className={`task-monitor ${isCollapsed ? 'collapsed' : ''}`}>
			{/* Default message when no events are received */}
			{!message && !isCollapsed && (
				<Alert
					message="Monitoring in progress. No updates received yet"
					description={
						<Tooltip title="The task monitor is waiting for updates.">
							<div className="alert-description">The task monitor is waiting for updates.</div>
						</Tooltip>
					}
					type="info"
					showIcon
					style={{ width: '100%' }}
				/>
			)}

			{/* Display progress, result, or error as a full width alert */}
			{status === 'progress' && message && !isCollapsed && (
				<Alert
					message="Request is being processed..."
					description={
						<Space direction="vertical" style={{ width: '100%' }}>
							<Tooltip title={message}>
								<div className="alert-description">{message}</div>
							</Tooltip>
						</Space>
					}
					type="success"
					showIcon
					style={{ width: '100%' }}
				/>
			)}

			{status === 'error' && message && !isCollapsed && (
				<Alert
					message="Error"
					description={
						<Tooltip title={message}>
							<div className="alert-description">{message}</div>
						</Tooltip>
					}
					type="error"
					showIcon
					style={{ width: '100%' }}
				/>
			)}

			{status === 'result' && message && !isCollapsed && (
				<Alert
					message="Success"
					description={
						<Tooltip title={message}>
							<div className="alert-description">{message}</div>
						</Tooltip>
					}
					type="success"
					showIcon
					style={{ width: '100%' }}
				/>
			)}
		</div>
	);
};

export default TaskMonitor;
