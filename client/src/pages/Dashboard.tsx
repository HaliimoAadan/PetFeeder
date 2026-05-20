import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Clock, ScrollText, Wifi, WifiOff, Package } from 'lucide-react';
import {
    sendFeedCommand,
    getFoodStatus,
    getEspStatus,
    getFeedingHistory,
    reconnect,
    getSchedules,
    getFailureNotifications,
    acknowledgeNotification,
} from '../api/petFeederApi';
import Modal from '../components/Modal';

interface ModalState {
    show: boolean;
    success: boolean;
    message: string;
}

interface Schedule {
    id: number;
    feedTime: string;
    isEnabled: boolean;
}

function formatLastFed(fedAt: string): string {
    const date = new Date(fedAt);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (date.toDateString() === now.toDateString()) return `Today at ${time}`;
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`;
}

function getNextScheduleTime(schedules: Schedule[]): string | null {
    const enabled = schedules.filter(s => s.isEnabled);
    if (enabled.length === 0) return null;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const parsed = enabled.map(s => {
        const [h, m] = s.feedTime.split(':').map(Number);
        const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        return { minutes: h * 60 + m, label };
    });

    const upcoming = parsed
        .filter(s => s.minutes > nowMinutes)
        .sort((a, b) => a.minutes - b.minutes);

    if (upcoming.length > 0) return `Today at ${upcoming[0].label}`;

    const earliest = [...parsed].sort((a, b) => a.minutes - b.minutes)[0];
    return `Tomorrow at ${earliest.label}`;
}

function foodLevelLabel(level: string): string {
    if (level === 'low') return 'Low';
    if (level === 'ok') return 'Sufficient';
    return 'Unknown';
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [foodLevel, setFoodLevel] = useState('unknown');
    const [espStatus, setEspStatus] = useState('offline');
    const [feeding, setFeeding] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [modal, setModal] = useState<ModalState>({ show: false, success: false, message: '' });
    const [lastFed, setLastFed] = useState<string | null>(null);
    const [nextSchedule, setNextSchedule] = useState<string | null>(null);
    const [failureNotification, setFailureNotification] = useState<{ id: number; reason: string } | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            getFoodStatus().then(res => setFoodLevel(res.level));
            getEspStatus().then(res => setEspStatus(res.esp));
            getFeedingHistory().then(history => {
                if (history && history.length > 0) {
                    setLastFed(formatLastFed(history[0].fedAt));
                }
            });
            getSchedules().then((schedules: Schedule[]) => {
                setNextSchedule(getNextScheduleTime(schedules));
            });
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const checkFailures = async () => {
            const failures = await getFailureNotifications();
            if (failures.length > 0 && !failureNotification) {
                setFailureNotification({ id: failures[0].id, reason: failures[0].reason });
            }
        };

        checkFailures();
        const interval = setInterval(checkFailures, 5000);
        return () => clearInterval(interval);
    }, [failureNotification]);

    const handleFeed = async () => {
        setFeeding(true);
        const sentAt = new Date();

        try {
            await sendFeedCommand();

            let attempts = 0;
            const poll = setInterval(async () => {
                attempts++;
                const history = await getFeedingHistory();
                const latest = history[0];

                if (latest && new Date(latest.fedAt) > sentAt) {
                    clearInterval(poll);
                    setFeeding(false);
                    setLastFed(formatLastFed(latest.fedAt));
                    setModal({ show: true, success: true, message: 'Food dispensed successfully' });
                    return;
                }

                if (attempts >= 30) {
                    clearInterval(poll);
                    setFeeding(false);
                    setModal({ show: true, success: false, message: 'Feeder did not respond in time' });
                }
            }, 1000);

        } catch {
            setFeeding(false);
            setModal({ show: true, success: false, message: 'Failed to send feed command' });
        }
    };

    const handleReconnect = async () => {
        if (espStatus === 'online' || reconnecting) return;
        setReconnecting(true);

        try {
            await reconnect();

            let attempts = 0;
            const poll = setInterval(async () => {
                attempts++;
                const status = await getEspStatus();

                if (status.esp === 'online') {
                    clearInterval(poll);
                    setEspStatus('online');
                    setReconnecting(false);
                    setModal({ show: true, success: true, message: 'Connected successfully' });
                    return;
                }

                if (attempts >= 10) {
                    clearInterval(poll);
                    setReconnecting(false);
                    setModal({ show: true, success: false, message: 'Failed to connect to device' });
                }
            }, 1000);

        } catch {
            setReconnecting(false);
            setModal({ show: true, success: false, message: 'Failed to connect to device' });
        }
    };

    const clickable = 'flex flex-col items-center justify-center gap-2 border-4 border-gray-700 rounded-2xl h-40 w-full cursor-pointer transition-colors hover:bg-gray-100 backgroundColor: #f5f4f0';
    const display = 'flex flex-col items-center justify-center gap-2 border-4 rounded-2xl h-40 w-full backgroundColor: #f5f4f0';

    return (
        <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: '#f5f4f0' }}>

            {/* Scattered paw prints */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                {[
                    { top: '5%',  left: '5%',  rotate: -20, opacity: 0.12, size: '1.8rem' },
                    { top: '8%',  left: '25%', rotate: 15,  opacity: 0.08, size: '1.4rem' },
                    { top: '5%',  left: '50%', rotate: -10, opacity: 0.10, size: '1.6rem' },
                    { top: '8%',  left: '75%', rotate: 30,  opacity: 0.09, size: '1.3rem' },
                    { top: '5%',  left: '90%', rotate: -35, opacity: 0.12, size: '2rem'   },
                    { top: '18%', left: '12%', rotate: 10,  opacity: 0.08, size: '2rem'   },
                    { top: '20%', left: '35%', rotate: -25, opacity: 0.07, size: '1.3rem' },
                    { top: '15%', left: '60%', rotate: 20,  opacity: 0.10, size: '1.7rem' },
                    { top: '22%', left: '82%', rotate: -15, opacity: 0.11, size: '1.5rem' },
                    { top: '32%', left: '3%',  rotate: 25,  opacity: 0.09, size: '1.6rem' },
                    { top: '35%', left: '20%', rotate: -40, opacity: 0.08, size: '1.4rem' },
                    { top: '30%', left: '45%', rotate: 15,  opacity: 0.07, size: '2rem'   },
                    { top: '38%', left: '68%', rotate: -20, opacity: 0.10, size: '1.3rem' },
                    { top: '33%', left: '90%', rotate: 35,  opacity: 0.12, size: '1.8rem' },
                    { top: '48%', left: '8%',  rotate: -10, opacity: 0.09, size: '1.5rem' },
                    { top: '50%', left: '30%', rotate: 20,  opacity: 0.08, size: '1.7rem' },
                    { top: '45%', left: '55%', rotate: -30, opacity: 0.07, size: '1.4rem' },
                    { top: '52%', left: '78%', rotate: 10,  opacity: 0.11, size: '2rem'   },
                    { top: '48%', left: '95%', rotate: -25, opacity: 0.09, size: '1.3rem' },
                    { top: '62%', left: '2%',  rotate: 30,  opacity: 0.10, size: '1.6rem' },
                    { top: '65%', left: '22%', rotate: -15, opacity: 0.08, size: '1.8rem' },
                    { top: '60%', left: '48%', rotate: 25,  opacity: 0.07, size: '1.4rem' },
                    { top: '68%', left: '70%', rotate: -35, opacity: 0.12, size: '2rem'   },
                    { top: '63%', left: '88%', rotate: 15,  opacity: 0.09, size: '1.5rem' },
                    { top: '78%', left: '10%', rotate: -20, opacity: 0.11, size: '1.7rem' },
                    { top: '75%', left: '32%', rotate: 40,  opacity: 0.08, size: '1.3rem' },
                    { top: '80%', left: '58%', rotate: -10, opacity: 0.10, size: '2rem'   },
                    { top: '77%', left: '80%', rotate: 20,  opacity: 0.07, size: '1.6rem' },
                    { top: '90%', left: '15%', rotate: -30, opacity: 0.09, size: '1.4rem' },
                    { top: '92%', left: '45%', rotate: 15,  opacity: 0.12, size: '1.8rem' },
                    { top: '88%', left: '72%', rotate: -25, opacity: 0.08, size: '1.5rem' },
                    { top: '93%', left: '92%', rotate: 35,  opacity: 0.10, size: '2rem'   },
                    { top: '11%', left: '40%', rotate: -18, opacity: 0.09, size: '1.5rem' },
                    { top: '25%', left: '55%', rotate: 22,  opacity: 0.08, size: '1.6rem' },
                    { top: '40%', left: '15%', rotate: -12, opacity: 0.10, size: '1.3rem' },
                    { top: '55%', left: '42%', rotate: 18,  opacity: 0.07, size: '1.8rem' },
                    { top: '70%', left: '60%', rotate: -28, opacity: 0.09, size: '1.4rem' },
                    { top: '83%', left: '28%', rotate: 32,  opacity: 0.11, size: '1.6rem' },
                    { top: '14%', left: '92%', rotate: -8,  opacity: 0.08, size: '1.7rem' },
                    { top: '44%', left: '38%', rotate: 14,  opacity: 0.07, size: '1.3rem' },
                    { top: '96%', left: '62%', rotate: -22, opacity: 0.10, size: '1.5rem' },
                    { top: '58%', left: '15%', rotate: 28,  opacity: 0.08, size: '1.9rem' },
                    { top: '3%',  left: '38%', rotate: -32, opacity: 0.09, size: '1.4rem' },
                    { top: '27%', left: '8%',  rotate: 16,  opacity: 0.10, size: '1.6rem' },
                    { top: '72%', left: '45%', rotate: -18, opacity: 0.08, size: '1.3rem' },
                    { top: '85%', left: '88%', rotate: 24,  opacity: 0.11, size: '1.7rem' },
                    { top: '97%', left: '8%',  rotate: -14, opacity: 0.09, size: '1.5rem' },
                ].map((paw, i) => (
                    <span
                        key={i}
                        style={{
                            position: 'absolute',
                            top: paw.top,
                            left: paw.left,
                            fontSize: paw.size,
                            opacity: paw.opacity,
                            transform: `rotate(${paw.rotate}deg)`,
                            userSelect: 'none',
                        }}
                    >
                        🐾
                    </span>
                ))}
            </div>

            <Modal
                show={modal.show}
                success={modal.success}
                message={modal.message}
                onClose={() => setModal({ ...modal, show: false })}
            />

            <Modal
                show={failureNotification !== null}
                success={false}
                message={`Scheduled feed missed — ${failureNotification?.reason}`}
                onClose={async () => {
                    if (failureNotification) {
                        await acknowledgeNotification(failureNotification.id);
                        setFailureNotification(null);
                    }
                }}
            />

            <div className="py-10" style={{ position: 'relative', zIndex: 1 }}>
                <span className="text-2xl font-bold tracking-widest uppercase text-gray-800">
                    Pet Feeder
                </span>
            </div>

            <div className="flex flex-col gap-4 w-full px-16" style={{ maxWidth: '900px', position: 'relative', zIndex: 1 }}>

                {/* Row 1 */}
                <div className="grid grid-cols-3 gap-4">
                    <button onClick={handleFeed} disabled={feeding} className={clickable}>
                        <Utensils size={24} className="text-gray-700" />
                        <span className="text-lg font-semibold text-gray-800">
                            {feeding ? 'Dispensing...' : 'Feed'}
                        </span>
                        {lastFed && (
                            <span className="text-xs text-gray-400">{lastFed}</span>
                        )}
                    </button>

                    <button onClick={() => navigate('/schedule')} className={clickable}>
                        <Clock size={24} className="text-gray-700" />
                        <span className="text-lg font-semibold text-gray-800">Schedule</span>
                        {nextSchedule && (
                            <span className="text-xs text-gray-400">{nextSchedule}</span>
                        )}
                    </button>

                    <button onClick={() => navigate('/history')} className={clickable}>
                        <ScrollText size={24} className="text-gray-700" />
                        <span className="text-lg font-semibold text-gray-800">History</span>
                    </button>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className={`${display} ${foodLevel === 'low' ? '!bg-orange-100 border-orange-500' : 'border-gray-700'}`}>
                        <Package size={24} className={foodLevel === 'low' ? 'text-orange-500' : 'text-gray-700'} />
                        <span className="text-lg font-semibold text-gray-800">Food Level</span>
                        <span className="text-sm text-gray-500">{foodLevelLabel(foodLevel)}</span>
                    </div>

                    <div
                        onClick={handleReconnect}
                        className={[
                            display,
                            espStatus === 'online'
                                ? '!bg-green-100 border-green-600'
                                : '!bg-red-100 border-red-600 cursor-pointer hover:!bg-red-200',
                            reconnecting ? 'opacity-60' : '',
                        ].join(' ')}
                    >
                        {espStatus === 'online'
                            ? <Wifi size={24} className="text-green-600" />
                            : <WifiOff size={24} className="text-red-500" />
                        }
                        <span className="text-lg font-semibold text-gray-800">Status</span>
                        <span className="text-sm text-gray-500 capitalize">
                            {reconnecting ? 'Connecting...' : espStatus}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}