import './App.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AnimatedArrows from './components/Arrows';
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
            <div className="relative flex-1 flex flex-col min-h-0">
              <div className="absolute top-0 right-0 w-1/2 h-full z-0 pointer-events-none flex items-center justify-center">
                <AnimatedArrows />
              </div>

              <main className="relative z-10 flex-1 flex items-center py-12 px-6">
                <div className="max-w-6xl mx-auto w-full">
                  <div className="lg:w-1/2 flex flex-col items-start text-left space-y-6">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-white">
                      MESSAGE YOUR FRIENDS <br />
                      KEEP YOUR CONVERSATIONS <br />
                      <span className="text-[#FF3535] font-bold">
                        PRIVATE & SAFE
                      </span>
                    </h1>

                    <p className="text-lg max-w-xl leading-relaxed text-zinc-300">
                      Enccom is a free, end-to-end encrypted messaging app that lets you send messages, photos, videos, and files to your friends and family. It's simple, fast, and secure.
                    </p>
                  </div>
                </div>
              </main>
            </div>
          </div>
        }
      />
      <Route path="/chatbox" element={<Chatbox />} />
      <Route path="/about" element={<About />} />
      <Route path="/features" element={<Features />} />
    </Routes>
  );
}
