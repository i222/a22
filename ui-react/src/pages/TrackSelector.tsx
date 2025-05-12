import React from 'react';
import { List, Checkbox } from 'antd';
import { MediaFile } from 'a22-shared';

interface Props {
  tracks: MediaFile.Track[];
  selectedTracks: MediaFile.Track[];
  onChange: (selected: MediaFile.Track[]) => void;
}

const TrackSelector: React.FC<Props> = ({ tracks, selectedTracks, onChange }) => {
  const selectedIds = selectedTracks.map((t) => t.formatId);

  const toggle = (track: MediaFile.Track, checked: boolean) => {
    const newSelected = checked
      ? [...selectedTracks, track]
      : selectedTracks.filter((t) => t.formatId !== track.formatId);
    onChange(newSelected);
  };

  return (
    <List
      bordered
      dataSource={tracks}
      renderItem={(track) => (
        <List.Item key={track.formatId}>
          <Checkbox
            checked={selectedIds.includes(track.formatId)}
            onChange={(e) => toggle(track, e.target.checked)}
          >
            {track.format}
          </Checkbox>
        </List.Item>
      )}
    />
  );
};

export default TrackSelector;
