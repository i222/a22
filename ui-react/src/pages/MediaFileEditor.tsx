import React, { useMemo, useState } from 'react';
import { Card, Input, Button, Space, Tag, Tooltip, Typography, message } from 'antd';
import { MediaFile, Formatters } from 'a22-shared';
import TrackSelector from './TrackSelector';

const { Paragraph, Text } = Typography;

interface Props {
	data: MediaFile.Data;
	isNew?: boolean;
	onSave: (data: MediaFile.Data) => void;
}

const MediaFileEditor: React.FC<Props> = ({ data, isNew = false, onSave }) => {
	const [fileName, setFileName] = useState(data.fileName);
	const [selectedTracks, setSelectedTracks] = useState<MediaFile.Track[]>(
		data.trackIds || []
	);

	const fileNameInvalid = useMemo(() => {
		const regex = /^[a-zA-Z0-9 ._\-\[\]()#&@]+$/;
		return !regex.test(fileName);
	}, [fileName]);

	const isButtonDisabled = fileNameInvalid || selectedTracks.length === 0;

	const presets = [
		{
			label: 'default',
			generate: () => `${Formatters.sanitizeFileName(data.source.title)} [${data.source.extractor}][${data.source.id}]`,
		},
		{
			label: 'date only',
			generate: () => `${Formatters.formatShortDate(data.source.uploadDate, '', '-')} [${data.source.id}]`,
		},
		{
			label: 'short',
			generate: () =>
				`${data.source.uploader || 'unknown'}_${Formatters.formatShortDate(data.source.uploadDate, '', '-')} [${data.source.id}]`,
		},
		{
			label: 'long+',
			generate: () =>
				`${data.source.uploader} - ${Formatters.formatShortDate(data.source.uploadDate, '', '-')} ${Formatters.sanitizeFileName(
					data.source.title
				)} [${data.source.id}]`,
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

	const getDuration = (sec: number | undefined) => {
		const d = Formatters.toDuration(sec);
		return d ? `${d} (${sec}s)` : '-';
	};

	return (
		<Card
			size="small"
			title={isNew ? 'New Media File' : 'Edit Media File'}
			extra={
				<Button type={isNew ? 'primary' : 'default'} onClick={save} disabled={isButtonDisabled}>
					{isNew ? 'Add file' : 'Apply changes'}
				</Button>
			}
		>
			<Space direction="vertical" size="middle" style={{ width: '100%' }}>
				<Paragraph ellipsis={{ rows: 2 }} strong>
					{data.source.title}
				</Paragraph>

				<div>
					<Text type="secondary">ID: </Text>{data.source.extractor}:{data.source.id}<br />
					<Text type="secondary">Uploader: </Text>{data.source.uploader || 'Unknown'} @ {Formatters.formatShortDate(data.source.uploadDate)}<br />
					<Text type="secondary">Duration: </Text>{getDuration(data.source.duration)}<br />
					<Text type="secondary">Status: </Text>{isNew ? 'New' : data.status}
				</div>

				<div>
					<Text strong>File name</Text>
					<Input
						value={fileName}
						onChange={(e) => setFileName(e.target.value)}
						status={fileNameInvalid ? 'error' : undefined}
						placeholder="Enter file name"
					/>
				</div>

				<Space wrap size="small">
					{presets.map((p) => (
						<Tag key={p.label} color="blue" onClick={() => setFileName(p.generate())} style={{ cursor: 'pointer' }}>
							{p.label}
						</Tag>
					))}
				</Space>

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

				<div style={{ textAlign: 'right' }}>
					<Button type="primary" onClick={save} disabled={isButtonDisabled}>
						Save
					</Button>
				</div>
			</Space>
		</Card>
	);
};

export default MediaFileEditor;
