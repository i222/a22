import React from 'react';
import { Button, Descriptions, Space, Tag, Tooltip, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { MediaFile } from 'a22-shared';
import { filesize } from 'filesize';
import { message } from 'antd';
import { Formatters } from 'a22-shared'; // Assuming this utility is available
import './MediaFileDetails.css'; // Assuming styles are in a separate CSS file

const { Paragraph } = Typography;

interface MediaFileDetailsProps {
	file: MediaFile.Data;
}

const MediaFileDetails: React.FC<MediaFileDetailsProps> = ({ file }) => {
	// Check if a track is selected
	const isSelectedTrack = (formatId: string): boolean => {
		return file.trackIds.map((track) => track.formatId).includes(formatId);
	};

	// Determine track type for tag color
	const getTrackType = (track: MediaFile.Track): 'success' | 'warning' | 'danger' | '' => {
		if (track.hasVideo && track.hasAudio) return 'danger';
		if (track.hasVideo) return 'success';
		if (track.hasAudio) return 'warning';
		return '';
	};

	// Format file size
	const formatFileSize = (size?: number, defaultValue = '-'): string => {
		return size ? filesize(size) : defaultValue;
	};

	// Copy text to clipboard
	const copyUrl = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				message.success('Link copied');
			})
			.catch(() => {
				message.error('Copy error');
			});
	};

	// Format duration
	const getDuration = (seconds: number | undefined) => {
		const d = Formatters.toDuration(seconds);
		return d ? `${d} (${seconds}s)` : '-';
	};

	return (
		<div className="media-file-details-container">
			<Space direction="vertical" style={{ width: '100%' }}>
				{/* Media File Information */}
				<Descriptions
					title="Media File Information"
					size="small"
					bordered
					styles={{ label: { width: '120px' }, }}
					column={3}
				>
					<Descriptions.Item label="Info">{'-'}</Descriptions.Item>
					<Descriptions.Item label="Size">{formatFileSize(file.size)}</Descriptions.Item>
					<Descriptions.Item label="Status">{file.status || 'Added'}</Descriptions.Item>
					<Descriptions.Item label="File name" span={3}>
						{file.fileName || 'not set'}
					</Descriptions.Item>
				</Descriptions>

				{/* Source Information */}
				<Descriptions
					title="Source Information"
					size="small"
					bordered
					styles={{ label: { width: '120px' }, }}
					column={3}
				>
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
							{file.source.tracks.map((track) => (
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
							))}
						</Space>
					</Descriptions.Item>
					<Descriptions.Item label="Description">
						<Paragraph ellipsis={{ rows: 12 }}>{file.source.description || '-'}</Paragraph>
					</Descriptions.Item>
				</Descriptions>
			</Space>
		</div>
	);
};

// Placeholder icon component for track tags
const CheckmarkCircle: React.FC = () => <span>✓</span>;

export default MediaFileDetails;