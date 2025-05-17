// AddSource.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input, Alert, Space, Spin, Empty, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { MediaFile, TaskProc } from 'a22-shared';
import { useBridgeService } from '../contexts/BridgeServiceContext'; // Подключаем новый сервис
import MediaFileEditor from './MediaFileEditor';

const { TextArea } = Input;

export const AddSource: React.FC = () => {
  const bridge = useBridgeService(); // Используем BridgeService
  const navigate = useNavigate();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | string[] | null>(null);
  const [mediaData, setMediaData] = useState<MediaFile.Data | null>(null);

  const taskIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleEvent = (event: TaskProc.Event) => {
      if (taskIdRef.current && event?.taskId !== taskIdRef.current) return;

      switch (event?.type) {
        case 'progress':
          if (typeof event.payload === 'string') setProgress(event.payload);
          break;
        case 'result':
          const source = event.payload as MediaFile.SourceFile;
          const fileName = `${source.title} [${source.extractor}][${source.id}]`; // initial
          const data = MediaFile.create(fileName, [], source);
          console.log('[UI][AddSource][loaded] create media file: ', data);
          setMediaData(data);
          resetState();
          break;
        case 'error':
          setError(['Failed to fetch media info:', event.payload?.error || String(event.payload)]);
          resetState();
          break;
        case 'cancelled':
          resetState();
          break;
        default: // other ignored
          break;
      }
    };

    bridge.subscribe(handleEvent); // Подписываемся на события

    return () => {
      bridge.unsubscribe(handleEvent); // Отписываемся при размонтировании
    };
  }, [bridge]);

  // Сброс состояния
  const resetState = () => {
    setLoading(false);
    setProgress(null);
    taskIdRef.current = null;
  };

  // Обработка проверки источника
  const handleCheckSource = async () => {
    setError(null);
    setMediaData(null);
    setLoading(true);

    try {
      await handleCancel(); // Отменить предыдущую задачу, если есть

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

  // Обработка отмены задачи
  const handleCancel = async () => {
    if (taskIdRef.current) {
      await bridge.abortTask(taskIdRef.current);
    }
  };

  // Обработка сохранения данных
  const handleSave = async (updatedData: MediaFile.Data) => {
    console.log('[UI][AddSource] Save', updatedData);
    if (!updatedData) return;

    try {
      const success = await bridge.addSource(updatedData);
      if (!success) {
        setError('Failed to save source data.');
      }
      message.success('Media file has been added');
      navigate('/');
    } catch (err: any) {
      setError('Error saving source: ' + err.message);
    }
  };

  // Рендеринг ошибок
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
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="truncated-text">
                {progress}
              </div>
              <div className="cancel-button-container">
                <Button danger onClick={handleCancel}>
                  Cancel request
                </Button>
              </div>
            </Space>
          }
          type="success"
          showIcon
          closable
        />
      )}

      {renderError()}

      {mediaData ? (
        <div>
          <MediaFileEditor
            data={mediaData}
            isNew={true}
            onSave={handleSave}
          />
        </div>
      ) : (
        <Empty description="Media file info will appear here once checked" />
      )}

    </Space>
  );
};

export default AddSource;
