import axios from 'axios';
import type {FeedingEvent, FoodLevelEvent, FoodStatus, PingResponse, ScheduledFeed} from '../types';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

export const ping = () =>
    api.get<PingResponse>('/api/ping').then(res => res.data);

export const sendFeedCommand = () =>
    api.post<{ sent: boolean; timestamp: string }>('/api/feed').then(res => res.data);

export const getFoodStatus = () =>
    api.get<FoodStatus>('/api/food').then(res => res.data);

export const getFeedingHistory = () =>
    api.get<FeedingEvent[]>('/api/history').then(res => res.data);

export const getFoodLevelEvents = () =>
    api.get<FoodLevelEvent[]>('/api/food/history').then(res => res.data);

export const getEspStatus = () =>
    api.get<{ esp: string; timestamp: string }>('/api/status').then(res => res.data);

export const reconnect = () =>
    api.post<{ esp: string }>('/api/reconnect').then(res => res.data);

export const getSchedules = () =>
    api.get<ScheduledFeed[]>('/api/schedule').then(res => res.data);

export const createSchedule = (feedTime: string) =>
    api.post<ScheduledFeed>('/api/schedule', { feedTime }).then(res => res.data);

export const toggleSchedule = (id: number) =>
    api.patch<ScheduledFeed>(`/api/schedule/${id}/toggle`).then(res => res.data);

export const deleteSchedule = (id: number) =>
    api.delete(`/api/schedule/${id}`);

export const getFailureNotifications = () =>
    api.get<{ id: number; failedAt: string; reason: string }[]>('/api/notifications').then(res => res.data);

export const acknowledgeNotification = (id: number) =>
    api.patch(`/api/notifications/${id}/acknowledge`).then(res => res.data);