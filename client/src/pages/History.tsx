import { useEffect, useState, useCallback } from 'react';
import { getFeedingHistory } from '../api/petFeederApi';
import type { FeedingEvent } from '../types';

function groupByDay(events: FeedingEvent[]): Record<string, FeedingEvent[]> {
    const groups: Record<string, FeedingEvent[]> = {};
    events.forEach(event => {
        const date = new Date(event.fedAt);
        const key = date.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        if (!groups[key]) groups[key] = [];
        groups[key].push(event);
    });
    return groups;
}

export default function History() {
    const [history, setHistory] = useState<FeedingEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(() => {
        getFeedingHistory()
            .then(setHistory)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000);
        window.addEventListener('focus', fetchHistory);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', fetchHistory);
        };
    }, [fetchHistory]);

    const grouped = groupByDay(history);
    const days = Object.keys(grouped);

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold tracking-widest uppercase text-gray-800">
                Feeding History
            </h1>

            {loading && (
                <p className="text-gray-500 text-sm">Loading...</p>
            )}

            {!loading && days.length === 0 && (
                <div
                    className="border-4 border-gray-700 rounded-2xl p-8 text-center"
                    style={{ backgroundColor: '#f5f4f0' }}
                >
                    <p className="text-gray-500">No feeding events yet.</p>
                </div>
            )}

            {days.map(day => (
                <div
                    key={day}
                    className="border-4 border-gray-700 rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#ffffff' }}
                >
                    {/* Day header */}
                    <div
                        className="px-6 py-4 border-b-4 border-gray-700"
                        style={{ backgroundColor: '#f5f4f0' }}
                    >
                        <span className="font-bold text-gray-800">{day}</span>
                    </div>

                    {/* Times */}
                    <div className="divide-y-2 divide-gray-200">
                        {grouped[day].map(event => {
                            const date = new Date(event.fedAt);
                            const time = date.toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                            });
                            return (
                                <div key={event.id} className="px-6 py-4">
                                    <span className="text-gray-700 font-medium">Time: {time}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}