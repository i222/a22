// src/components/ResizableDrawer/ResizableDrawer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Drawer } from 'antd';
import MediaFileEditor from '../MediaFileEditor/MediaFileEditor';
import { MediaFile } from 'a22-shared';
import './ResizableDrawer.css';

interface Props {
	file: MediaFile.Data;
	open: boolean;
	onClose: () => void;
	onSave: (data: MediaFile.Data) => void;
}

const ResizableDrawer: React.FC<Props> = ({ file, open, onClose, onSave }) => {
	const MIN_WIDTH = 400;
	const MAX_WIDTH = 1000;
	const DEFAULT_PERCENT = 0.9;

	const [width, setWidth] = useState(() => Math.floor(window.innerWidth * DEFAULT_PERCENT));
	const isResizing = useRef(false);

	useEffect(() => {
		const handleResize = () => {
			setWidth(Math.floor(window.innerWidth * DEFAULT_PERCENT));
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const onMouseDown = (e: React.MouseEvent) => {
		e.preventDefault(); // Отключаем выделение текста
		isResizing.current = true;
		document.body.style.userSelect = 'none'; // Запрещаем выделение на body
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	};

	const onMouseMove = (e: MouseEvent) => {
		if (!isResizing.current) return;
		e.preventDefault();
		const newWidth = window.innerWidth - e.clientX;
		if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
			setWidth(newWidth);
		}
	};

	const onMouseUp = () => {
		isResizing.current = false;
		document.body.style.userSelect = ''; // Восстанавливаем
		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);
	};

	return (
		<Drawer
			title="Edit Media File"
			placement="right"
			open={open}
			onClose={onClose}
			width={width}
			destroyOnHidden
			closable
			maskClosable
		>
			<div className="resizable-drawer-body">
				<MediaFileEditor data={file} isNew={false} onSave={onSave} />
				<div className="resizer" onMouseDown={onMouseDown} />
			</div>
		</Drawer>
	);
};

export default ResizableDrawer;
