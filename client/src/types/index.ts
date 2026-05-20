export interface FeedingEvent {
    id: number;
    fedAt: string;
    triggeredBy: string;
}

export interface FoodLevelEvent {
    id: number;
    recordedAt: string;
    level: string;
}

export interface FoodStatus {
    level: 'ok' | 'low' | 'unknown';
}

export interface PingResponse {
    status: string;
    timestamp: string;
}

export interface EspStatusResponse {
    esp: string;
    timestamp: string;
}

export interface ScheduledFeed {
    id: number;
    feedTime: string;
    isEnabled: boolean;
    lastTriggeredAt: string | null;
    lastTriggerSucceeded?: boolean | null;
}