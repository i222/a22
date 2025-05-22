import React, { useMemo, useState } from 'react';
import { Card, Input, Button, Space, Tag, Tooltip, Typography, message } from 'antd';
import { MediaFile, Formatters } from 'a22-shared';
import TrackSelector from '../TrackSelector/TrackSelector';
import './MediaFileEditor.css';
import { CloseOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface Props {
	data: MediaFile.Data;
	isNew?: boolean;
	onSave: (data: MediaFile.Data) => void;
	onClose?: () => void;
}

/**
 * MediaFileEditor component allows editing filename and track selection for a media file.
 * Includes presets for filename formatting and preview of the file thumbnail.
 */
const MediaFileEditor: React.FC<Props> = ({ data, isNew = false, onSave, onClose }) => {
	const [fileName, setFileName] = useState(data.fileName);
	const [selectedTracks, setSelectedTracks] = useState<MediaFile.Track[]>(
		data.trackIds || []
	);

	// Checks for invalid characters in filename
	const fileNameInvalid = useMemo(() => {
		const regex = /^[a-zA-Z0-9 ._\-\[\]()#&@]+$/;
		return !regex.test(fileName);
	}, [fileName]);

	// Whether any data was changed compared to original
	const hasChanges =
		fileName !== data.fileName ||
		JSON.stringify(selectedTracks) !== JSON.stringify(data.trackIds || []);

	const isButtonDisabled = fileNameInvalid || selectedTracks.length === 0 || !hasChanges;

	const presets = [
		{
			label: 'default',
			generate: () =>
				`${Formatters.sanitizeFileName(data.source.title)} [${data.source.extractor}][${data.source.id}]`,
		},
		{
			label: 'date only',
			generate: () =>
				`${Formatters.formatShortDate(data.source.uploadDate, '', '-')} [${data.source.id}]`,
		},
		{
			label: 'short',
			generate: () =>
				`${data.source.uploader || 'unknown'}_${Formatters.formatShortDate(
					data.source.uploadDate,
					'',
					'-'
				)} [${data.source.id}]`,
		},
		{
			label: 'long+',
			generate: () =>
				`${data.source.uploader} - ${Formatters.formatShortDate(
					data.source.uploadDate,
					'',
					'-'
				)} ${Formatters.sanitizeFileName(data.source.title)} [${data.source.id}]`,
		},
		{
			label: 'clean',
			generate: () => `${Formatters.sanitizeFileName(data.source.title)} [${data.source.id}]`,
		},
	];

	const save = () => {
		if (isButtonDisabled) {
			message.warning('Invalid filename or no tracks selected');
			return;
		}

		const final: MediaFile.Data = {
			...data,
			fileName,
			trackIds: selectedTracks,
		};

		onSave(final);
	};

	const discardChanges = () => {
		setFileName(data.fileName);
		setSelectedTracks(data.trackIds || []);
	};

	const getDuration = (sec: number | undefined) => {
		const d = Formatters.toDuration(sec);
		return d ? `${d} (${sec}s)` : '-';
	};

	return (
		<Card
			size="small"
			title={isNew ? 'New Media File' : 'Media File'}
			extra={
				<Space>
					<Button type="primary" onClick={save} disabled={isButtonDisabled}>
						{isNew ? 'Add file' : 'Apply changes'}
					</Button>
						<Tooltip title="Discard changes and close">
							<Button
								type="default"
								icon={<CloseOutlined />}
								onClick={() => {
									discardChanges();
									onClose();
								}}
							/>
						</Tooltip>
				</Space>
			}
		>
			<Space direction="vertical" size="middle" style={{ width: '100%' }}>
				{/* Title */}
				<Paragraph ellipsis={{ rows: 2 }} strong>
					{data.source.title}
				</Paragraph>

				{/* Info section with thumbnail on the right */}
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
					{/* Meta data */}
					<div>
						<Text type="secondary">ID: </Text>{data.source.extractor}:{data.source.id}<br />
						<Text type="secondary">Uploader: </Text>{data.source.uploader || 'Unknown'}<br />
						<Text type="secondary">Upload date: </Text>{Formatters.formatShortDate(data.source.uploadDate)}<br />
						<Text type="secondary">Duration: </Text>{getDuration(data.source.duration)}<br />
						<Text type="secondary">Status: </Text>{isNew ? 'New' : data.status}
					</div>

					{/* Thumbnail preview */}
					<div className="header-right">
						{data.source.thumbnail ? (
							<img src={data.source.thumbnail} alt="Preview" className="preview-thumbnail" />
						) : (
							<div className="no-preview">No preview</div>
						)}
					</div>
				</div>

				{/* Filename input */}
				<div>
					<Text strong>File name</Text>
					<Input
						value={fileName}
						onChange={(e) => setFileName(e.target.value)}
						status={fileNameInvalid ? 'error' : undefined}
						placeholder="Enter file name"
					/>
				</div>

				{/* Filename presets */}
				<Space wrap size="small">
					{presets.map((p) => (
						<Tag key={p.label} color="blue" onClick={() => setFileName(p.generate())} style={{ cursor: 'pointer' }}>
							{p.label}
						</Tag>
					))}
				</Space>

				{/* Track selector */}
				<div>
					<Tooltip
						title="Select tracks that will be downloaded. These tracks are used only during download and won’t affect already downloaded files."
						placement="topLeft"
					>
						<Text strong>Select tracks</Text>
					</Tooltip>
					<TrackSelector
						tracks={data.source.tracks}
						selectedTracks={selectedTracks}
						onChange={(selected) => setSelectedTracks(selected)}
					/>
				</div>
			</Space>
		</Card>
	);
};

export default MediaFileEditor;
