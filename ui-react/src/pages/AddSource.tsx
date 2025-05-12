// AddSource.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input, Alert, Space, Spin, Typography, Empty } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useElectronBridge } from '../contexts/electronBridgeContext';
import { MediaFile, TaskProc } from 'a22-shared';
import MediaFileEditor from './MediaFileEditor';
import { v4 as uuidv4 } from 'uuid';

const { TextArea } = Input;

export const AddSource: React.FC = () => {
	const bridge = useElectronBridge();

	const [url, setUrl] = useState('');
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState<string | null>(null);
	const [error, setError] = useState<string | string[] | null>(null);
	const [mediaData, setMediaData] = useState<MediaFile.Data | null>(null);

	const taskIdRef = useRef<string | null>(null);

	useEffect(() => {
		const handleEvent = (payload: any) => {
			if (taskIdRef.current && payload?.taskId !== taskIdRef.current) return;

			switch (payload.type) {
				case 'progress':
					if (typeof payload.payload === 'string') setProgress(payload.payload);
					break;
				case 'result':
					const source = payload.payload as MediaFile.SourceFile;
					setMediaData({
						id: uuidv4(),
						fileName: `${source.title} [${source.extractor}][${source.id}]`,
						source,
						trackIds: [],
						version: '1',
						status: 'Added',
					});
					resetState();
					break;
				case 'error':
					setError(['Failed to fetch media info:', payload.payload?.error || String(payload.payload)]);
					resetState();
					break;
				case 'cancelled':
					resetState();
					break;
				default:
					break;
			}
		};

		bridge.onEvent(handleEvent);

		return () => {
			bridge.onEvent(() => { });
		};
	}, [bridge]);

	const resetState = () => {
		setLoading(false);
		setProgress(null);
		taskIdRef.current = null;
	};

	const handleCheckSource = async () => {
		setError(null);
		setMediaData(null);
		setLoading(true);

		try {
			await handleCancel(); // Cancel previous task if any

			const params: TaskProc.Input = {
				type: 'analyze-media-info',
				payload: { url: url.trim() },
			};

			const taskId = await bridge.runTask(params);
			taskIdRef.current = taskId;
			setProgress('Step 1/2. Detecting media type...');
		} catch (err: any) {
			setError('Failed to start task: ' + err.message);
			resetState();
		}
	};

	const handleCancel = async () => {
		if (taskIdRef.current) {
			await bridge.abortTask(taskIdRef.current);
		}
	};

	const handleSave = async () => {
		if (!mediaData) return;

		try {
			const success = await bridge.addSource(mediaData);
			if (!success) {
				setError('Failed to save source data.');
			}
		} catch (err: any) {
			setError('Error saving source: ' + err.message);
		}
	};

	const renderError = () => {
		if (!error) return null;
		const content = Array.isArray(error) ? error.map((e, i) => <div key={i}>{e}</div>) : error;
		return (
			<Alert
				type="error"
				message="Error"
				description={<div>{content}</div>}
				closable
				onClose={() => setError(null)}
			/>
		);
	};

	return (
		<Space direction="vertical" size="large" style={{ width: '100%' }}>
			<Space.Compact style={{ width: '100%' }}>
				<Input
					placeholder="Enter video URL"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					onPressEnter={handleCheckSource}
					allowClear
				/>
				<Button
					type="primary"
					icon={loading ? <Spin size="small" /> : <InfoCircleOutlined />}
					onClick={handleCheckSource}
					disabled={!url.trim() || loading}
				>
					Get Url Info
				</Button>
			</Space.Compact>

			{progress && (
				<Alert
					message="Request is being processed..."
					description={
						<Space direction="vertical">
							<TextArea value={progress} readOnly />
							<Button danger onClick={handleCancel}>
								Cancel request
							</Button>
						</Space>
					}
					type="success"
					showIcon
					closable
					onClose={() => setProgress(null)}
				/>
			)}

			{renderError()}

			{mediaData ? (
				<div>
					<MediaFileEditor
						data={mediaData}
						isNew={true}
						onSave={(updatedData) => {
							// ADD LOGIC !
							console.log('Updated data:', updatedData);
						}}
					/>
				</div>
			) : (
				<Empty description="Video info will appear here once checked" />
			)}

		</Space>
	);
};

export default AddSource;
