import type { Socket } from 'socket.io-client';

export interface Message {
  id: string | number;
  clientMsgId?: number;
  senderId?: string | null;
  text: string;
  room?: string;
  pending?: boolean;
}

export interface Room {
  id: string;
  name: string;
}

export interface SocketContextType {
  socket: Socket | null;
  myId: string | null;
}

export interface SessionInfoPayload {
  myId: string;
}

export interface RoomsListPayload {
  rooms: Room[];
}

export interface RoomCreatedPayload {
  room: string;
  name?: string;
}

export interface RoomUpdatedPayload {
  room: string;
  name: string;
}

export interface RoomDeletedPayload {
  room: string;
}

export interface JoinErrorPayload {
  message?: string;
  [key: string]: unknown;
}

export interface HistoryObjectPayload {
  room?: string;
  history?: Message[];
}

export type HistoryPayload = Message[] | HistoryObjectPayload;
