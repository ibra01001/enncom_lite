import './App.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HeroSection } from './components/features/HeroSection';
import Chatbox from './components/Chatbox';
import About from './components/About';
import Features from './components/Features';


export default function App() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roomFromUrl = params.get('room');

  // Only redirect if they are on the root path to prevent infinite loops
  if (roomFromUrl && location.pathname === '/') {
    return <Navigate to={`/chatbox?room=${roomFromUrl}`} replace />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="relative flex-1 min-h-0 font-sans antialiased transition-colors duration-300 bg-[#272727] text-[#9ca3af] flex flex-col">
            <HeroSection />

          </div>
        }
      />

      <Route path="/chatbox" element={<Chatbox />} />
      <Route path="/about" element={<About />} />
      <Route path="/features" element={<Features />} />
    </Routes>
  );
}
