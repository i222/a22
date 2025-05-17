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
	EyeOutlined,
	LoadingOutlined,
} from '@ant-design/icons';
import { MediaFile, TaskProc } from 'a22-shared';
import MediaFileDetails from './MediaFileDetails';
import { useElectronBridge } from '../contexts/electronBridgeContext';
import './Home.css';
import { stopPropagation } from '../utils/events';

const { Paragraph } = Typography;

const Home: React.FC = () => {
	const [mediaFiles, setMediaFiles] = useState<MediaFile.Data[]>([]); // Always initialize as empty array
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [selectAll, setSelectAll] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const bridge = useElectronBridge();

	// useEffect(() => {
	// 	console.log('[UI][Home] Media files updated:', mediaFiles); // Логирование состояния mediaFiles
	// }, [mediaFiles]);


	// Effect to request the file list when component mounts
	useEffect(() => {
		const loadList = async () => {
			try {
				// Request the media files using the runTask method
				const task: TaskProc.Input = {
					type: 'TID_GET_MEDIAFILES_REQ',
					payload: {},
				};
				await bridge.runTask(task);
			} catch (e) {
				console.error('Error loading file list', e);
			}
		};

		// Subscribe to events that will update the file list
		const handleEvent = (event: TaskProc.EventBroadcast) => {
			console.log('[UI][Home][Income Event]', event)
			if (event?.type === 'MEDIAFILES_LIST') {
				setMediaFiles(event.payload || []); // Safely update state
			}
		};

		bridge.onEvent(handleEvent); // Subscribe to the event
		loadList(); // Fetch list initially

		// Cleanup function: unsubscribe from events on unmount
		return () => {
			// This assumes you have an offEvent method to unsubscribe from the event
			// bridge.offEvent(handleEvent); // Unsubscribe from the event when component unmounts
		};
	}, [bridge]);

	const toggleSelectAll = (checked: boolean) => {
		setSelectAll(checked);
		setSelectedIds(checked ? new Set(mediaFiles.map((f) => f.id)) : new Set());
	};

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

	const isSelected = (id: string) => selectedIds.has(id);

	const selectedFiles = useMemo(
		() => mediaFiles.filter((f) => selectedIds.has(f.id)),
		[mediaFiles, selectedIds]
	);

	const downloadSelectedFiles = async () => {
		setIsDownloading(true);
		try {
			for (const file of selectedFiles) {
				message.info(`Downloading ${file.fileName}`);
			}
		} finally {
			setIsDownloading(false);
		}
	};

	const deleteSelectedFiles = async () => {
		setIsDeleting(true);
		try {
			// await bridge.deleteFile(...) if implemented
			const list = await bridge.getList();
			setMediaFiles(list);
		} finally {
			setIsDeleting(false);
		}
	};

	const configureFile = (file: MediaFile.Data) => {
		console.log(`Navigating to task-settings for file ID: ${file.id}`);
	};

	const getTrackType = (track: MediaFile.Track): 'success' | 'warning' | 'error' | undefined => {
		if (track.hasVideo && track.hasAudio) return 'error';
		if (track.hasVideo) return 'success';
		if (track.hasAudio) return 'warning';
		return undefined;
	};

	const copyUrl = (url: string) => {
		navigator.clipboard
			.writeText(url)
			.then(() => message.success('Link copied'))
			.catch(() => message.error('Copy error'));
	};

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
