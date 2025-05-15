import React, { useMemo, useState } from 'react';
import { Table, Checkbox, Tag, Space, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MediaFile } from 'a22-shared';
import { filesize } from 'filesize';
import './TrackSelector.css';

interface Props {
	tracks: MediaFile.Track[];
	selectedTracks: MediaFile.Track[]; // Must be passed from parent, even if empty
	onChange: (selected: MediaFile.Track[]) => void;
}

// Presets map common selections to formatIds
const presets: Record<string, string[]> = {
	'720p': ['136', '140'],
	'1080p': ['137', '140'],
	'audio': ['140'],
};

// Filter groups for tag filtering
const filterGroups = {
	trackType: [
		{ title: 'audio', bingo: (t: MediaFile.Track) => t.hasAudio && !t.hasVideo },
		{ title: 'video', bingo: (t: MediaFile.Track) => !t.hasAudio && t.hasVideo },
		{ title: 'mixed', bingo: (t: MediaFile.Track) => t.hasAudio && t.hasVideo },
		{ title: 'other', bingo: (t: MediaFile.Track) => !t.hasAudio && !t.hasVideo },
	],
	br: [{ title: 'cbr', bingo: (t: MediaFile.Track) => t.vbr === 0 }],
	container: [
		{ title: 'mp4', bingo: (t: MediaFile.Track) => t.ext === 'mp4' },
		{ title: 'm4a', bingo: (t: MediaFile.Track) => t.ext === 'm4a' },
		{ title: 'webm', bingo: (t: MediaFile.Track) => t.ext === 'webm' },
	],
};

// Determine track type string
const getTrackType = (track: MediaFile.Track): string => {
	if (track.hasAudio && track.hasVideo) return 'mixed';
	if (track.hasAudio) return 'audio';
	if (track.hasVideo) return 'video';
	return 'other';
};

/**
 * TrackSelector
 *
 * Allows selecting media tracks with filters and preset options.
 */
const TrackSelector: React.FC<Props> = ({ tracks, selectedTracks = [], onChange }) => {
	const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});

	const selectedIds = useMemo(() => selectedTracks.map((t) => t.formatId), [selectedTracks]);

	const toggleTrack = (track: MediaFile.Track, checked: boolean) => {
		const updated = checked
			? [...selectedTracks, track]
			: selectedTracks.filter((t) => t.formatId !== track.formatId);
		onChange(updated);
	};

	const handlePresetClick = (preset: string) => {
		const ids = presets[preset];
		const newSelected: MediaFile.Track[] = [];

		for (const id of ids) {
			const found = tracks.find((t) => t.formatId === id);
			if (found) {
				newSelected.push(found);
				if (preset === 'audio') break;
			}
		}

		onChange(newSelected);
	};

	const toggleFilter = (group: string, filterTitle: string) => {
		const current = new Set(activeFilters[group] ?? []);
		current.has(filterTitle) ? current.delete(filterTitle) : current.add(filterTitle);

		setActiveFilters((prev) => ({
			...prev,
			[group]: current,
		}));
	};

	const resetFilters = () => setActiveFilters({});

	const filteredTracks = useMemo(() => {
		return tracks.filter((track) =>
			Object.entries(activeFilters).every(([group, activeSet]) => {
				if (activeSet.size === 0) return true;
				const groupFilters = filterGroups[group];
				return groupFilters
					.filter((f) => activeSet.has(f.title))
					.some((f) => f.bingo(track));
			})
		);
	}, [tracks, activeFilters]);

	const trackOptions = tracks.map((track) => ({
		value: track.formatId,
		label: `${track.format} | ${track.ext} | ${track.formatId}`,
	}));

	const columns: ColumnsType<MediaFile.Track> = [
		{
			title: '',
			dataIndex: 'select',
			width: 40,
			render: (_: any, record: MediaFile.Track) => (
				<Checkbox
					checked={selectedIds.includes(record.formatId)}
					onChange={(e) => toggleTrack(record, e.target.checked)}
				/>
			),
		},
		{
			title: 'ID',
			dataIndex: 'formatId',
			width: 80,
			sorter: (a, b) => a.formatId.localeCompare(b.formatId),
		},
		{
			title: 'Format',
			dataIndex: 'format',
			sorter: (a, b) => a.format.localeCompare(b.format),
		},
		{
			title: 'Size',
			dataIndex: 'filesize',
			width: 100,
			defaultSortOrder: 'descend',
			sorter: (a, b) => (a.filesize ?? 0) - (b.filesize ?? 0),
			render: (size?: number) => filesize(size ?? 0).toString(),
		},
		{
			title: 'Ext',
			dataIndex: 'ext',
			sorter: (a, b) => a.ext.localeCompare(b.ext),
		},
	];

	return (
		<>
			{/* Selected track tags */}
			<div style={{ marginBottom: 12 }}>
				<Select
					mode="tags"
					style={{ width: '100%' }}
					value={selectedIds}
					onChange={(ids) => {
						const selected = tracks.filter((t) => ids.includes(t.formatId));
						onChange(selected);
					}}
					options={trackOptions}
					tagRender={({ value, closable, onClose }) => (
						<Tag color="blue" closable={closable} onClose={onClose}>
							{value}
						</Tag>
					)}
				/>
			</div>

			{/* Filters */}
			<div style={{ marginBottom: 12 }}>
				<Space wrap>
					{Object.entries(filterGroups).flatMap(([groupKey, groupFilters]) =>
						groupFilters.map((filter) => (
							<Tag.CheckableTag
								key={`${groupKey}-${filter.title}`}
								checked={activeFilters[groupKey]?.has(filter.title)}
								onChange={() => toggleFilter(groupKey, filter.title)}
							>
								{filter.title}
							</Tag.CheckableTag>
						))
					)}
					<Tag color="red" style={{ cursor: 'pointer' }} onClick={resetFilters}>
						reset
					</Tag>
				</Space>
			</div>

			{/* Preset buttons */}
			<div style={{ marginBottom: 12 }}>
				<Space>
					{Object.keys(presets).map((preset) => (
						<Tag
							key={preset}
							color="blue"
							onClick={() => handlePresetClick(preset)}
							style={{ cursor: 'pointer' }}
						>
							{preset}
						</Tag>
					))}
				</Space>
			</div>

			{/* Track table */}
			<Table
				size="small"
				rowKey="formatId"
				columns={columns}
				dataSource={filteredTracks}
				pagination={false}
				rowClassName={(record) => `track-row-${getTrackType(record)}`}
			/>
		</>
	);
};

export default TrackSelector;
