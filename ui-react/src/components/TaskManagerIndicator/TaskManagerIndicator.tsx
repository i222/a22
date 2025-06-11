// src/components/TaskManagerIndicator.tsx

import { useState, useEffect } from 'react';
import { Badge } from 'antd';
import { DashboardOutlined, LoadingOutlined, RobotOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useBridgeService } from '../../contexts/BridgeServiceContext';
import { TaskProc } from 'a22-shared';

/**
 * TaskManagerIndicator
 *
 * This component represents the "Task Manager" menu item. It calculates
 * the number of tasks and displays the corresponding badge.
 */
const TaskManagerIndicator = () => {
	const [taskCount, setTaskCount] = useState(0); // The number of tasks (this is just a mockup)
	const bridge = useBridgeService(); // Using the BridgeService for task management

	useEffect(() => {
		// Simulate fetching the task count (can be replaced with actual API call)
		// const fetchTaskCount = () => {
		// 	setTaskCount(10); // For example, set the task count to 10 (replace with actual logic)
		// };
		const handleEvent = (event: TaskProc.Event) => {
			// Check for event type 'SEQ-PROCESSOR-TASKS-LIST' and taskId 'BROADCAST'
			if (
				event.type === 'SEQ-PROCESSOR-TASKS-LIST' &&
				event.taskId === 'BROADCAST'
			) {
				const tasks = Array.isArray(event.payload?.tasks) ? event.payload.tasks : [];
				console.log('[TaskIndicator]', { tasks })
				setTaskCount(tasks?.length || 0); // Update state with the tasks
			}
		};

		bridge.subscribe(handleEvent); // Subscribe to events from BridgeService

	}, []);

	return (
		<span style={{ 'margin': '0 8px 0 0' }}>
			<Link to="/tasks" className="task-manager-indicator">
				<DashboardOutlined className="task-manager-indicator-icon" style={{ fontSize: '16px', }} />
			</Link>
			<Badge count={taskCount} overflowCount={99} showZero size="small" className="task-manager-indicator-badge">
				<div style={{ height: '12px', }} />
			</Badge>
			{/* <Badge count={'*'} size="small">
				<Badge dot>
				<div style={{ height: '12px', }} />
			</Badge> */}
		</span>
	);
};

export default TaskManagerIndicator;
