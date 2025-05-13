import { MockTaskProcessor } from './MockTaskProcessor';
import { ElectronBridge } from 'a22-shared';
import { mockList } from './mockList';
import { mockedSource } from './ mockSource';

const mockProcessor = new MockTaskProcessor();

export const mockElectronBridge: ElectronBridge = {
  getList: async () => {
    console.log('[Mock] getList called');
    return mockList;
  },
  getSourceByUrl: async (url: string) => {
    console.log('[Mock] getSourceByUrl called with:', url);
    return mockedSource;
  },
  addSource: async (data) => {
    console.log('[Mock] addSource called with:', data);
    return true;
  },
  runTask: mockProcessor.runTask,
  abortTask: mockProcessor.abortTask,
  onEvent: mockProcessor.onEvent,
};
