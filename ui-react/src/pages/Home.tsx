import React, { useEffect, useState, useMemo } from 'react';
import {
	Button,
	Checkbox,
	Col,
	Collapse,
	List,
	Row,
	Space,
	Tag,
	Tooltip,
	Typography,
	message,
} from 'antd';
import {
	CopyOutlined,
	LoadingOutlined,
} from '@ant-design/icons';
import { MediaFile, TaskProc } from 'a22-shared';
import MediaFileDetails from './MediaFileDetails';
import { useBridgeService } from '../contexts/BridgeServiceContext';
import './Home.css';
import { stopPropagation } from '../utils/events';

const { Paragraph } = Typography;

const Home: React.FC = () => {
	const [mediaFiles, setMediaFiles] = useState<MediaFile.Data[]>([]); // Initialize as empty array
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [selectAll, setSelectAll] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const [inProgressTasks, setInProgressTasks] = useState<Set<string>>(new Set());

	const bridge = useBridgeService(); // Access the BridgeService context

	// Effect to request the file list when component mounts
	useEffect(() => {
		const loadList = async () => {
			try {
				const task: TaskProc.Input = {
					type: 'TID_GET_MEDIAFILES_REQ',
					payload: {},
				};
				await bridge.runTask(task);
			} catch (e) {
				console.error('Error loading file list', e);
			}
		};

		// const handleEvent = (event: TaskProc.EventBroadcast) => {
		// 	console.log('[UI][Home][Income Event]', event);
		// 	if (event?.type === 'MEDIAFILES_LIST') {
		// 		setMediaFiles(event.payload || []); // Safely update state
		// 	}
		// };

		const isBroadcast = (event: TaskProc.Event): event is TaskProc.EventBroadcast => {
			return event?.taskId === 'BROADCAST';
		};

		const handleEvent = (event: TaskProc.Event) => {
			console.log('[UI][Home][Events]', event);

			// Check if the event is a Broadcast message (taskId === 'BROADCAST')
			if (isBroadcast(event)) {
				// Handle MEDIAFILES_LIST broadcast - update media files list
				if (event?.type === 'MEDIAFILES_LIST') {
					setMediaFiles(event.payload || []);  // Update the list of media files
				}
				// Handle other broadcast types if needed in the future
				else {
					console.log('[UI][Home][Events] Received unknown broadcast type in event', event);
				}
			}
			// Handle task-specific events (not a Broadcast)
			else {
				const taskId = event.taskId;

				if (taskId) {
					switch (event.type) {
						// REWORK - delegate to TaskMonitor
						// Case for progress event
						// case 'progress':
						// 	// Add taskId to inProgressTasks
						// 	setInProgressTasks((prevTasks) => {
						// 		const newTasks = new Set(prevTasks);
						// 		newTasks.add(taskId);
						// 		return newTasks;
						// 	});
						// 	// Optionally show progress in message
						// 	message.info(`Task ${taskId} progress: ${event.payload}`, 3);
						// 	break;

						// Case for result event (task completed successfully)
						case 'result':
							// Remove taskId from inProgressTasks as it's completed
							setInProgressTasks((prevTasks) => {
								const newTasks = new Set(prevTasks);
								newTasks.delete(taskId);
								return newTasks;
							});
							// Show success message
							message.success(`Task ${taskId} completed successfully!`);
							break;

						// Case for error event (task failed)
						case 'error':
							// Remove taskId from inProgressTasks as it's failed
							setInProgressTasks((prevTasks) => {
								const newTasks = new Set(prevTasks);
								newTasks.delete(taskId);
								return newTasks;
							});
							// Show error message
							message.error(`Task ${taskId} failed: ${event.payload?.errorMessage || 'Unknown error'}`);
							break;

						// Case for cancelled event (task was cancelled)
						case 'cancelled':
							// Remove taskId from inProgressTasks as it's cancelled
							setInProgressTasks((prevTasks) => {
								const newTasks = new Set(prevTasks);
								newTasks.delete(taskId);
								return newTasks;
							});
							// Show cancellation message
							message.warning(`Task ${taskId} was cancelled.`);
							break;

						default:
							console.log('Unknown task event type', event);
					}
				}
			}
		};

		bridge.subscribe(handleEvent); // Subscribe to the event
		loadList(); // Fetch list initially

		// Cleanup function: unsubscribe from events on unmount
		return () => {
			bridge.unsubscribe(handleEvent); // Unsubscribe from the event
		};
	}, [bridge]);

	// Toggle 'Select All' checkbox
	const toggleSelectAll = (checked: boolean) => {
		setSelectAll(checked);
		setSelectedIds(checked ? new Set(mediaFiles.map((f) => f.id)) : new Set());
	};

	// Toggle individual file selection
	const toggleSelectFile = (id: string) => {
		const updated = new Set(selectedIds);
		if (updated.has(id)) {
			updated.delete(id);
		} else {
			updated.add(id);
		}
		setSelectedIds(updated);
		setSelectAll(updated.size === mediaFiles.length);
	};

	// Check if a file is selected
	const isSelected = (id: string) => selectedIds.has(id);

	// Get selected files
	const selectedFiles = useMemo(
		() => mediaFiles.filter((f) => selectedIds.has(f.id)),
		[mediaFiles, selectedIds]
	);

	// Download selected files
	const downloadSelectedFiles = async () => {
		if (selectedFiles.length === 0) return;
		setIsDownloading(true);
		try {
			const task: TaskProc.Input = {
				type: 'TID_DOWNLOAD_MEDIAFILES_REQ',
				payload: { downloadFiles: selectedFiles },
			};
			await bridge.runTask(task);
			message.success('Download tasks started.');
		} catch (error) {
			message.error('Failed to start download tasks.');
		} finally {
			setIsDownloading(false);
			setSelectedIds(new Set()); // Reset the selected files after download
		}
	};

	// Delete selected files
	const deleteSelectedFiles = async () => {
		if (selectedFiles.length === 0) return;
		setIsDeleting(true);
		try {
			// Delete selected files using the bridge
			const deleteFileIds = selectedFiles.map((file) => file.id);
			const payload: TaskProc.DeleteMediafilesPayload = { deleteFileIds };
			const task: TaskProc.Input = {
				type: 'TID_DELETE_MEDIAFILES',
				payload,
			};
			await bridge.runTask(task); // Call the bridge to execute the delete task
			message.success('Files deleted successfully.');
		} catch (error) {
			message.error('Failed to delete files.');
		} finally {
			setIsDeleting(false);
			setSelectedIds(new Set()); // Reset the selected files after delete
		}
	};

	// Configure file (e.g., navigate to settings)
	const configureFile = (file: MediaFile.Data) => {
		console.log(`Navigating to task-settings for file ID: ${file.id}`);
	};

	// Get track type based on track properties
	const getTrackType = (track: MediaFile.Track): 'success' | 'warning' | 'error' | undefined => {
		if (track.hasVideo && track.hasAudio) return 'error';
		if (track.hasVideo) return 'success';
		if (track.hasAudio) return 'warning';
		return undefined;
	};

	// Copy URL to clipboard
	const copyUrl = (url: string) => {
		navigator.clipboard
			.writeText(url)
			.then(() => message.success('Link copied'))
			.catch(() => message.error('Copy error'));
	};

	// Open URL in new tab
	const openUrl = async (url: string) => {
		try {
			window.open(url, '_blank');
		} catch {
			message.error('Failed to open link');
		}
	};

	return (
		<div className="home-container">
			<div className="toolbar">
				<Row justify="space-between" align="middle">
					<Col>
						<Checkbox checked={selectAll} onChange={(e) => toggleSelectAll(e.target.checked)}>
							Select All
						</Checkbox>
					</Col>
					<Col>
						<Space>
							<Button
								size="small"
								onClick={downloadSelectedFiles}
								disabled={!selectedFiles.length || isDownloading}
								icon={isDownloading ? <LoadingOutlined /> : null}
							>
								Download
							</Button>
							<Button
								size="small"
								danger
								onClick={deleteSelectedFiles}
								disabled={!selectedFiles.length || isDeleting}
								icon={isDeleting ? <LoadingOutlined /> : null}
							>
								Delete
							</Button>
						</Space>
					</Col>
				</Row>
			</div>

			<List
				bordered
				dataSource={mediaFiles}
				renderItem={(file) => (
					<List.Item>
						<Collapse
							items={[
								{
									key: file.id,
									label: (
										<div className="list-item-header">
											<div className="header-left">
												<Checkbox
													checked={isSelected(file.id)}
													onClick={stopPropagation}
													onChange={() => toggleSelectFile(file.id)}
												/>
											</div>

											<div className="header-center">
												<div className="file-name">
													<Paragraph ellipsis={{ rows: 2 }}>{file.source.title}</Paragraph>
												</div>
												<Space size="small" align="center" wrap>
													<Tag color="blue">
														{file.source.extractor} : {file.source.id}
													</Tag>
													<Tooltip title="Copy URL to clipboard">
														<Button
															type="text"
															size="small"
															icon={<CopyOutlined />}
															onClick={(e) => {
																copyUrl(file.source.webpageUrl);
																stopPropagation(e);
															}}
														/>
													</Tooltip>
												</Space>
												<Space size="small" wrap>
													{file.trackIds.map((track) => (
														<Tooltip
															key={track.formatId}
															title={`${track.format} / ${track.ext}`}
															placement="bottom"
														>
															<Tag color={getTrackType(track)} icon={<CheckmarkCircle />}>
																{track.formatId}
															</Tag>
														</Tooltip>
													))}
												</Space>
											</div>

											<div className="header-right">
												{file.source.thumbnail ? (
													<img src={file.source.thumbnail} alt="Preview" />
												) : (
													<div className="no-preview">No preview</div>
												)}
											</div>
										</div>
									),
									children: (
										<div className="collapse-body">
											<MediaFileDetails file={file} />
										</div>
									),
								},
							]}
						/>
					</List.Item>
				)}
			/>
		</div>
	);
};

const CheckmarkCircle: React.FC = () => <span>✓</span>;

export default Home;
