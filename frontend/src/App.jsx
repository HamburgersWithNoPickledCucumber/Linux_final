import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { SystemStatus, BasicInfo, Network, Accounts, Apps } from './pages';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/system-status" replace />} />
        <Route path="/system-status" element={<SystemStatus />} />
        <Route path="/basic-info" element={<BasicInfo />} />
        <Route path="/network" element={<Network />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/apps" element={<Apps />} />
        <Route path="*" element={<Navigate to="/system-status" replace />} />
      </Routes>
    </>
  );
}
