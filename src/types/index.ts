export type CallType = 'Audio' | 'Video' | 'Group';
export type CallStatus = 'Initiated' | 'Ringing' | 'InProgress' | 'Ended' | 'Missed' | 'Rejected';
export type ParticipantRole = 'Host' | 'Participant';
export type ParticipantStatus = 'Invited' | 'Joined' | 'Rejected' | 'Left';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CallParticipant {
  userId: string;
  displayName: string;
  avatarUrl: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt?: string;
  leftAt?: string;
}

export interface Call {
  id: string;
  channelId: string;
  title: string;
  callType: CallType;
  status: CallStatus;
  initiatorUserId: string;
  initiatorName: string;
  initiatorAvatar: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  participants: CallParticipant[];
}

export interface LiveSwitchConfig {
  applicationId: string;
  gatewayUrl: string;
}

export interface TokenResponse {
  token: string;
  applicationId: string;
  gatewayUrl: string;
  userId: string;
  deviceId: string;
  clientId: string;
  channelId?: string;
  expiresInSeconds: number;
}

export type ConnectionState = 'idle' | 'registering' | 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface RemoteParticipantMedia {
  id: string;
  userId: string;
  connectionId: string;
  viewElement: HTMLElement | null;
  hasAudio: boolean;
  hasVideo: boolean;
}

export function normalizeCall(call: any): Call {
  if (!call) return call;
  let callType: CallType = 'Video';
  if (call.callType === 0 || call.callType === '0' || call.callType === 'Audio') {
    callType = 'Audio';
  } else if (call.callType === 1 || call.callType === '1' || call.callType === 'Video') {
    callType = 'Video';
  } else if (call.callType === 2 || call.callType === '2' || call.callType === 'Group') {
    callType = 'Group';
  }

  let status: CallStatus = call.status;
  const statusMap: Record<number, CallStatus> = {
    0: 'Initiated',
    1: 'Ringing',
    2: 'InProgress',
    3: 'Ended',
    4: 'Missed',
    5: 'Rejected',
  };
  if (typeof call.status === 'number' && statusMap[call.status]) {
    status = statusMap[call.status];
  }

  return {
    ...call,
    callType,
    status,
  };
}
