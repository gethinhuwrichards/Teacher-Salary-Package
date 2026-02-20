import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SubmitPage from './pages/SubmitPage';
import BrowsePage from './pages/BrowsePage';
import SchoolPage from './pages/SchoolPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminReviewPage from './pages/AdminReviewPage';
import AdminArchivedPage from './pages/AdminArchivedPage';
import AdminPastSubmissionsPage from './pages/AdminPastSubmissionsPage';
import AdminMaliciousPage from './pages/AdminMaliciousPage';
import AdminVisitorIpsPage from './pages/AdminVisitorIpsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/school/:id" element={<SchoolPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/review" element={<AdminReviewPage />} />
        <Route path="/admin/archived" element={<AdminArchivedPage />} />
        <Route path="/admin/past" element={<AdminPastSubmissionsPage />} />
        <Route path="/admin/malicious" element={<AdminMaliciousPage />} />
        <Route path="/admin/visitor-ips" element={<AdminVisitorIpsPage />} />
      </Route>
    </Routes>
  );
}
