import React, { useState } from 'react';
import {
	Button,
	Descriptions,
	Space,
	Tag,
	Tooltip,
	Typography,
	message,
	Drawer,
} from 'antd';
import { CopyOutlined, EditOutlined } from '@ant-design/icons';
import { MediaFile, Formatters } from 'a22-shared';
import { filesize } from 'filesize';
import MediaFileEditor from './MediaFileEditor';
import './MediaFileDetails.css';

const { Paragraph, Title } = Typography;

interface MediaFileDetailsProps {
	file: MediaFile.Data;
}

const MediaFileDetails: React.FC<MediaFileDetailsProps> = ({ file }) => {
	const [editorOpen, setEditorOpen] = useState(false);

	// Ensure that tracks exist and is an array
	const tracks = file?.source?.tracks ?? [];

	/**
	 * Checks whether a formatId is selected
	 */
	const isSelectedTrack = (formatId: string): boolean => {
		return file.trackIds.map((track) => track.formatId).includes(formatId);
	};

	/**
	 * Returns color category for a track tag
	 */
	const getTrackType = (track: MediaFile.Track): 'success' | 'warning' | 'danger' | '' => {
		if (track.hasVideo && track.hasAudio) return 'danger';
		if (track.hasVideo) return 'success';
		if (track.hasAudio) return 'warning';
		return '';
	};

	/**
	 * Formats file size using `filesize`
	 */
	// src/pages/MediaFileDetails.tsx
	const formatFileSize = (size?: number, defaultValue = '-'): string => {
		const sizeFormatted = filesize(size);
		return typeof sizeFormatted === 'string' ? sizeFormatted : defaultValue;
	};


	/**
	 * Copies a string to clipboard with user feedback
	 */
	const copyUrl = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => message.success('Link copied'))
			.catch(() => message.error('Copy error'));
	};

	/**
	 * Formats duration in seconds to a human-readable string
	 */
	const getDuration = (seconds: number | undefined) => {
		const d = Formatters.toDuration(seconds);
		return d ? `${d} (${seconds}s)` : '-';
	};

	/**
	 * Handles saving from editor
	 */
	const handleSave = (updated: MediaFile.Data) => {
		console.log('Saved data:', updated);
		setEditorOpen(false);
	};

	return (
		<div className="media-file-details-container">
			<Space direction="vertical" style={{ width: '100%' }}>
				{/* Header with Edit button */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Title level={5} style={{ margin: 0 }}>
						Media File Information
					</Title>
					<Button
						type="primary"
						size="small"
						icon={<EditOutlined />}
						onClick={() => setEditorOpen(true)}
					>
						Edit
					</Button>
				</div>

				{/* Basic metadata */}
				<Descriptions size="small" bordered column={3} styles={{ label: { width: '120px' } }}>
					<Descriptions.Item label="Info">{'-'}</Descriptions.Item>
					<Descriptions.Item label="Size">{formatFileSize(file.size)}</Descriptions.Item>
					<Descriptions.Item label="Status">{file.status || 'Added'}</Descriptions.Item>
					<Descriptions.Item label="File name" span={3}>
						{file.fileName || 'not set'}
					</Descriptions.Item>
				</Descriptions>

				{/* Source metadata */}
				<Descriptions title="Source Information" size="small" bordered column={3} styles={{ label: { width: '120px' } }}>
					<Descriptions.Item label="Source Url" span={3}>
						<Paragraph ellipsis={{ rows: 2 }}>{file.source.webpageUrl}</Paragraph>
					</Descriptions.Item>
					<Descriptions.Item label="Orig. title" span={3}>
						<Paragraph ellipsis={{ rows: 2 }}>{file.source.title}</Paragraph>
					</Descriptions.Item>
					<Descriptions.Item label="Extractor:ID" span={2}>
						<Space>
							{`${file.source.extractor}:${file.source.id}`}
							<Button
								type="text"
								size="small"
								icon={<CopyOutlined />}
								onClick={() => copyUrl(`${file.source.extractor}:${file.source.id}`)}
							/>
						</Space>
					</Descriptions.Item>
					<Descriptions.Item label="Duration">{getDuration(file.source.duration)}</Descriptions.Item>
					<Descriptions.Item label="Uploader" span={2}>
						{file.source.uploader || '-'}
					</Descriptions.Item>
					<Descriptions.Item label="on">
						{Formatters.formatShortDate(file.source.uploadDate) || '-'}
					</Descriptions.Item>
					<Descriptions.Item label="Tracks" span={3}>
						<Space size="small" wrap>
							{tracks.length > 0 ? (
								tracks.map((track) => (
									<Tooltip
										key={track.formatId}
										title={`${track.format} / ${track.ext} / ${formatFileSize(track.filesize, 'stream')}`}
										placement="bottom"
									>
										<Tag
											color={getTrackType(track)}
											bordered={isSelectedTrack(track.formatId)}
											icon={isSelectedTrack(track.formatId) ? <CheckmarkCircle /> : null}
										>
											{track.format}
										</Tag>
									</Tooltip>
								))
							) : (
								<Tag color="gray">No tracks available</Tag>
							)}
						</Space>
					</Descriptions.Item>
					<Descriptions.Item label="Description">
						<Paragraph ellipsis={{ rows: 12 }}>{file.source.description || '-'}</Paragraph>
					</Descriptions.Item>
				</Descriptions>
			</Space>

			{/* Standard Drawer with editor inside */}
			<Drawer
				title="Edit Media File"
				placement="right"
				open={editorOpen}
				onClose={() => setEditorOpen(false)}
				width="90%" // Use percentage-based width
				destroyOnHidden // Clean up on close
				maskClosable
			>
				<MediaFileEditor data={file} isNew={false} onSave={handleSave} onClose={() => setEditorOpen(false)} />
			</Drawer>
		</div>
	);
};

const CheckmarkCircle: React.FC = () => <span>✓</span>;

export default MediaFileDetails;
