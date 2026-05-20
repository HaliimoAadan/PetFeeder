import { useEffect, useState } from 'react';
import {
    getSchedules,
    createSchedule,
    toggleSchedule,
    deleteSchedule,
} from '../api/petFeederApi';
import type { ScheduledFeed } from '../types';

function formatLastTriggered(utc: string): string {
    const date = new Date(utc);
    const now = new Date();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (date.toDateString() === now.toDateString()) return `Today at ${time}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`;
}

export default function Schedule() {
    const [schedules, setSchedules] = useState<ScheduledFeed[]>([]);
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSchedules = () => {
        getSchedules()
            .then(setSchedules)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleAdd = async () => {
        if (!time) return;
        setError('');
        try {
            await createSchedule(time);
            setTime('');
            fetchSchedules();
        } catch {
            setError('Failed to add schedule.');
        }
    };

    const handleToggle = async (id: number) => {
        await toggleSchedule(id);
        fetchSchedules();
    };

    const handleDelete = async (id: number) => {
        await deleteSchedule(id);
        fetchSchedules();
    };

    const formatTime = (feedTime: string) => {
        const [hours, minutes] = feedTime.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold tracking-widest uppercase text-gray-800">
                Schedule
            </h1>

            <div
                className="border-4 border-gray-700 rounded-2xl p-6 flex flex-col gap-4"
                style={{ backgroundColor: '#ffffff' }}
            >
                <p className="font-semibold text-gray-700">Add Feeding Time</p>
                <div className="flex gap-4 items-center">
                    <input
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="border-2 border-gray-700 rounded-xl px-4 py-2 text-gray-800 bg-transparent focus:outline-none"
                    />
                    <button
                        onClick={handleAdd}
                        className="px-6 py-2 border-2 border-gray-700 rounded-xl font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                        Add
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            {loading && <p className="text-gray-500 text-sm">Loading...</p>}

            {!loading && schedules.length === 0 && (
                <div
                    className="border-4 border-gray-700 rounded-2xl p-8 text-center"
                    style={{ backgroundColor: '#f5f4f0' }}
                >
                    <p className="text-gray-500">No scheduled feeds yet.</p>
                </div>
            )}

            {schedules.map(schedule => (
                <div
                    key={schedule.id}
                    className={`border-4 rounded-2xl p-6 flex items-center justify-between ${
                        schedule.isEnabled ? 'border-gray-700' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: '#ffffff' }}
                >
                    <div className="flex flex-col gap-1">
                        <span className={`text-xl font-bold ${schedule.isEnabled ? 'text-gray-800' : 'text-gray-400'}`}>
                            {formatTime(schedule.feedTime)}
                        </span>
                        {schedule.lastTriggeredAt && (
                            <span className={`text-xs ${schedule.lastTriggerSucceeded ? 'text-gray-400' : 'text-red-400'}`}>
                                {schedule.lastTriggerSucceeded
                                    ? `Last fed: ${formatLastTriggered(schedule.lastTriggeredAt)}`
                                    : `Failed: ${formatLastTriggered(schedule.lastTriggeredAt)}`}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleToggle(schedule.id)}
                            className={`px-4 py-2 border-2 rounded-xl text-sm font-semibold transition-colors ${
                                schedule.isEnabled
                                    ? 'border-gray-700 text-gray-700 hover:bg-gray-100'
                                    : 'border-gray-300 text-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            {schedule.isEnabled ? 'Enabled' : 'Disabled'}
                        </button>

                        <button
                            onClick={() => handleDelete(schedule.id)}
                            className="px-4 py-2 border-2 border-red-400 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}