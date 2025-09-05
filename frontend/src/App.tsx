// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PricingPlansPage from './pages/PricingPlansPage';

function App() {
  return (
    <BrowserRouter> {/* ← Must wrap everything using Link */}
      <div>
        <Navbar /> {/* ← Now safe to use <Link> inside Navbar */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPlansPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;