import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
    const location = useLocation();

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f5f4f0' }}>
            {location.pathname !== '/' && (
                <div className="px-8 pt-6 pb-4">
                    <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-800">
                        Back to Home
                    </Link>
                </div>
            )}
            <main className="px-8 pb-8">
                <Outlet />
            </main>
        </div>
    );
}