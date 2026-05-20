import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Schedule from './pages/Schedule';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route element={<Layout />}>
                    <Route path="/history" element={<History />} />
                    <Route path="/schedule" element={<Schedule />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}