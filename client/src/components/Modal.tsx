interface ModalProps {
    show: boolean;
    success: boolean;
    message: string;
    onClose: () => void;
}

export default function Modal({ show, success, message, onClose }: ModalProps) {
    if (!show) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl"
                style={{ minWidth: '300px' }}
                onClick={e => e.stopPropagation()}
            >
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                        success ? 'bg-green-500' : 'bg-red-500'
                    }`}
                >
                    {success ? '✓' : '✗'}
                </div>
                <p className="text-lg font-semibold text-gray-800 text-center">{message}</p>
                <button
                    onClick={onClose}
                    className="mt-2 px-6 py-2 border-2 border-gray-700 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
}