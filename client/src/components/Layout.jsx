import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CurrencyModal from './CurrencyModal';

export default function Layout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <CurrencyModal />
    </div>
  );
}
