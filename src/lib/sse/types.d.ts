import type { AchievementData } from '$lib/types';

export interface MessageEvent {
  id?: string;
  event?: string;
  data?: string | object;
  retry?: number;
}

export interface InitMessageEvent extends MessageEvent {
  event: 'init';
  data:
    | {
        id: string;
        streaming: true;
      }
    | {
        streaming: false;
        data: AchievementData;
      };
}

export interface PingMessageEvent extends MessageEvent {
  event: 'ping';
  data: {
    t: number;
  };
}

export interface UpdateMessageEvent extends MessageEvent {
  event: 'update';
  data: {
    text?: string;
    progress?: number;
  };
}

export interface EndMessageEvent extends MessageEvent {
  event: 'end';
  data: {
    data?: AchievementData;
    error?: string;
  };
}

export type AnyMessageEvent = InitMessageEvent | PingMessageEvent | UpdateMessageEvent | EndMessageEvent;
