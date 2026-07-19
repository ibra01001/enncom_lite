import { useState } from 'react'
import heroImg from './assets/hero.png'
import './App.css'
import AnimatedArrows from './components/Arrows'
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  return (
    <div className={`relative min-h-screen font-sans antialiased transition-colors duration-300 ${isDarkMode ? 'bg-[#0b0c10] text-[#9ca3af]' : 'bg-zinc-50 text-zinc-600'}`}>

      {/* Background ambient glows (Dark Theme Specific - clean micro-details) */}
      {isDarkMode && (
        <div className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-250px] left-[15%] w-[600px] h-[600px] rounded-full bg-purple-700/5 blur-[130px]" />
          <div className="absolute top-[-150px] right-[15%] w-[650px] h-[650px] rounded-full bg-indigo-700/5 blur-[150px]" />
        </div>
      )}

      {/* Floating Theme Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-6 right-6 p-2 rounded-lg border transition-all z-50 ${isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white bg-[#0b0c10]/40' : 'border-zinc-200 text-zinc-600 hover:text-zinc-950 bg-white/40'}`}
        aria-label="Toggle Theme"
      >
        {isDarkMode ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828-9.9a5 5 0 117.07 7.07l-2.828-2.828z" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>

      {/* Arrows — fixed to right half, full viewport height, behind content */}
      <div className="fixed top-0 right-0 w-1/2 h-screen z-0 pointer-events-none flex items-center justify-center">
        <AnimatedArrows />
      </div>

      {/* Hero Welcome Section */}
      <main className="relative z-10 min-h-screen flex items-center py-12 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="lg:w-1/2 flex flex-col items-start text-left space-y-6">

            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
              Message your friends, keep conversations <br />
              <span className="bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                private and safe.
              </span>
            </h1>

            <p className={`text-lg max-w-xl leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Enncom is a free, end-to-end encrypted messaging app that lets you send messages, photos, videos, and files to your friends and family. It's simple, fast, and secure.
            </p>

          </div>
        </div>
      </main>

    </div>
  )
}
