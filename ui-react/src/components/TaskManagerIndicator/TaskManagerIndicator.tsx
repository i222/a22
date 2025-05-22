// src/components/TaskManagerIndicator.tsx

import { useState, useEffect } from 'react';
import { Badge } from 'antd';
import { DashboardOutlined, LoadingOutlined, RobotOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

/**
 * TaskManagerIndicator
 *
 * This component represents the "Task Manager" menu item. It calculates
 * the number of tasks and displays the corresponding badge.
 */
const TaskManagerIndicator = () => {
	const [taskCount, setTaskCount] = useState(0); // The number of tasks (this is just a mockup)

	useEffect(() => {
		// Simulate fetching the task count (can be replaced with actual API call)
		const fetchTaskCount = () => {
			setTaskCount(10); // For example, set the task count to 10 (replace with actual logic)
		};

		fetchTaskCount();

		// Optionally, you can add an interval to refresh the task count periodically
		const interval = setInterval(fetchTaskCount, 5000); // Refresh every 5 seconds

		return () => {
			clearInterval(interval); // Clean up the interval on component unmount
		};
	}, []);

	return (
		<span style={{ 'margin': '0 8px 0 0' }}>
			<Link to="/tasks" className="task-manager-indicator">
				<DashboardOutlined className="task-manager-indicator-icon" style={{ fontSize: '16px', }} />
			</Link>
			{/* <Badge count={taskCount} overflowCount={99} showZero size="small" className="task-manager-indicator-badge"> */}
			{/* <Badge count={'*'} size="small"> */}
			<Badge dot>
				<div style={{ height: '12px', }} />
			</Badge>
		</span>
	);
};

export default TaskManagerIndicator;
