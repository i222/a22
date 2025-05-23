// ui-react/src/pages/AddSource.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Alert, Space, Spin, Empty, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { MediaFile, TaskProc } from 'a22-shared';
import { useBridgeService } from '../contexts/BridgeServiceContext'; // Importing the BridgeService
import MediaFileEditor from '../components/MediaFileEditor/MediaFileEditor';
import { isString } from 'antd/es/button';

const { TextArea } = Input;

export const AddSource: React.FC = () => {
	const bridge = useBridgeService(); // Using the BridgeService for task management
	const navigate = useNavigate();

	const [url, setUrl] = useState(''); // State for the URL input
	const [loading, setLoading] = useState(false); // State for loading indicator
	const [progress, setProgress] = useState<string | null>(null); // State for progress tracking
	const [error, setError] = useState<string | string[] | null>(null); // State for errors
	const [mediaData, setMediaData] = useState<MediaFile.Data | null>(null); // State for media file data

	const taskIdRef = useRef<string | null>(null); // Ref to store task ID for cancellation

	useEffect(() => {
		// Event handler for task progress or result
		const handleEvent = (event: TaskProc.Event) => {
			console.log('[UI][AddSource][Event][!] income: ', event, event?.taskId, taskIdRef.current);
			if (!isString(event?.taskId) || event?.taskId !== taskIdRef?.current) {
				return;
			}

			switch (event?.type) {
				case 'progress':
					if (typeof event.message === 'string') setProgress(event.message); // Update progress
					break;
				case 'result':
					const source = event.payload as MediaFile.SourceFile;
					const fileName = `${source.title} [${source.extractor}][${source.id}]`; // Set filename
					const data = MediaFile.create(fileName, [], source); // Create media data
					console.log('[UI][AddSource][loaded] create media file: ', data);
					setMediaData(data); // Set the media data
					resetState(); // Reset loading state
					break;
				case 'error':
					setError(['Failed to fetch media info:', event.message]); // Error handling
					resetState();
					break;
				case 'cancelled':
					resetState(); // Reset state if task is cancelled
					break;
				default:
					break;
			}
		};

		bridge.subscribe(handleEvent); // Subscribe to events from BridgeService

		return () => {
			bridge.unsubscribe(handleEvent); // Unsubscribe on component unmount
		};
	}, [bridge]);

	// Function to reset the state
	const resetState = () => {
		setLoading(false);
		setProgress(null);
		taskIdRef.current = null;
	};

	// Function to handle source check
	const handleCheckSource = async () => {
		setError(null);
		setMediaData(null);
		setLoading(true);

		try {
			await handleCancel(); // Cancel previous task if exists

			const params: TaskProc.Input = {
				type: 'TID_ANALYZE-MEDIA-INFO',
				payload: { url: url.trim() }, // Pass URL to the task
			};

			const taskId = await bridge.runTask(params); // Run the task using BridgeService
			taskIdRef.current = taskId;
			setProgress('Step 1/2. Detecting media type...');
		} catch (err: any) {
			setError('Failed to start task: ' + err.message); // Error handling
			resetState();
		}
	};

	// Function to handle task cancellation
	const handleCancel = async () => {
		if (taskIdRef.current) {
			await bridge.abortTask(taskIdRef.current); // Abort the task if it exists
		}
	};

	// Function to handle saving the media file
	const handleSave = async (updatedData: MediaFile.Data) => {
		console.log('[UI][AddSource] Save', updatedData);
		if (!updatedData) return;

		try {
			const success = await bridge.addSource(updatedData); // Save the media file via BridgeService
			if (!success) {
				setError('Failed to save source data.');
			}
			message.success('Media file has been added');
			navigate('/'); // Navigate back to the main page after success
		} catch (err: any) {
			setError('Error saving source: ' + err.message); // Error handling
		}
	};

	// Function to render errors
	const renderError = () => {
		if (!error) return null;
		const content = Array.isArray(error) ? error.map((e, i) => <div key={i}>{e}</div>) : error;
		return (
			<Alert
				type="error"
				message="Error"
				description={<div>{content}</div>}
				closable
				onClose={() => setError(null)} // Close error message
			/>
		);
	};

	return (
		<Space direction="vertical" size="large" style={{ width: '100%' }}>
			<Space.Compact style={{ width: '100%' }}>
				<Input
					placeholder="Enter video URL"
					value={url}
					onChange={(e) => setUrl(e.target.value)} // Update URL state on change
					onPressEnter={handleCheckSource} // Trigger the check on Enter
					allowClear
				/>
				<Button
					type="primary"
					icon={loading ? <Spin size="small" /> : <InfoCircleOutlined />}
					onClick={handleCheckSource} // Trigger the source check
					disabled={!url.trim() || loading} // Disable if URL is empty or loading
				>
					Get Url Info
				</Button>
			</Space.Compact>

			{progress && (
				<Alert
					message="Request is being processed..."
					description={
						<Space direction="vertical" style={{ width: '100%' }}>
							<div className="truncated-text">
								{progress} {/* Display progress */}
							</div>
							<div className="cancel-button-container">
								<Button danger onClick={handleCancel}>Cancel request</Button> {/* Cancel button */}
							</div>
						</Space>
					}
					type="success"
					showIcon
					closable
				/>
			)}

			{renderError()} {/* Render error messages if any */}

			{mediaData ? (
				<div>
					<MediaFileEditor
						data={mediaData} // Pass media data to the editor
						isNew={true}
						onSave={handleSave} // Handle save on editor submit
					/>
				</div>
			) : (
				<Empty description="Media file info will appear here once checked" /> // Empty state
			)}
		</Space>
	);
};

export default AddSource;
