// ui-react/src/pages/TaskManager.tsx
import React, { useEffect, useState } from 'react';
import { Table, Tag, Empty, Input } from 'antd';

import { TaskProc } from 'a22-shared';
import { useBridgeService } from '../contexts/BridgeServiceContext';

const { TextArea } = Input;

export const TaskManager: React.FC = () => {
	const bridge = useBridgeService(); // Using the BridgeService for task management
	const [tasks, setTasks] = useState<any[]>([]); // State to store the current tasks

	useEffect(() => {
		// Event handler for task progress or result
		const handleEvent = (event: TaskProc.Event) => {
			// Check for event type 'SEQ-PROCESSOR-TASKS-LIST' and taskId 'BROADCAST'
			if (
				event.type === 'SEQ-PROCESSOR-TASKS-LIST' &&
				event.taskId === 'BROADCAST'
			) {
				const tasks = Array.isArray(event.payload?.tasks) ? event.payload.tasks : [];
				console.log('[TaskMonitor]', { tasks })
				setTasks(tasks); // Update state with the tasks
			}
		};

		bridge.subscribe(handleEvent); // Subscribe to events from BridgeService

		const payload: TaskProc.TasksStatePushReqPayload = {
			pushInterval: 0, // Set the pushInterval as per your requirement
		};

		const task: TaskProc.Input = {
			type: 'BTID_BATCH_TASKS_STATE_PUSH_ON',
			payload
		}

		// Send the task once when the component is mounted
		bridge.runTask(task);

		return () => {
			bridge.unsubscribe(handleEvent); // Unsubscribe on component unmount
		};
	}, [bridge]);

	// Columns for the Ant Design Table
	const columns = [
		{
			title: 'Task ID',
			dataIndex: 'taskId',
			key: 'taskId',
		},
		{
			title: 'Task Type',
			dataIndex: 'type',
			key: 'type',
		},
		{
			title: 'Status',
			dataIndex: 'status',
			key: 'status',
			render: (status: string) => {
				let color = 'geekblue';
				if (status === 'in progress') {
					color = 'green';
				} else if (status === 'pending') {
					color = 'volcano';
				}
				return <Tag color={color}>{status}</Tag>;
			},
		},
	];

	return (
		<div>
			<h2>Task Manager</h2>

			{/* If no tasks, display the Empty component */}
			{tasks.length === 0 ? (
				<Empty description="Queue is empty - all tasks have been processed" />
			) : (
				<Table
					dataSource={tasks}
					columns={columns}
					rowKey="taskId"
					pagination={false} // Optionally, disable pagination if you want to show all tasks at once
				/>
			)}
		</div>
	);
};

export default TaskManager;
