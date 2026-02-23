import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import ArtikelEinstellenPage from '@/pages/ArtikelEinstellenPage';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="artikel-einstellen" element={<ArtikelEinstellenPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}