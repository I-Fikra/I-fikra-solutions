import { UserPreferencesDto } from './user-preferences.dto';

export interface UserPreferencesPayload {
  userId: number | string;
  preferences: UserPreferencesDto;
  updatedAt: string; // ISO 8601
}

export interface UserPreferencesApiResponse {
  success: boolean;
  data: UserPreferencesPayload;
  message?: string;
}

