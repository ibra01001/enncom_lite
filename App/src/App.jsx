import heroImg from './assets/hero.png'
import './App.css'
import AnimatedArrows from './components/Arrows'
export default function App() {


  return (
    <div className={`relative min-h-screen font-sans antialiased transition-colors duration-300 bg-[#1E1E1E] text-[#9ca3af]`}>



      {/* Arrows — absolute to right half, full container height, behind content */}
      <div className="absolute top-0 right-0 w-1/2 h-full z-0 pointer-events-none flex items-center justify-center">
        <AnimatedArrows />
      </div>

      {/* Hero Welcome Section */}
      <main className="relative z-10 min-h-screen flex items-center py-12 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="lg:w-1/2 flex flex-col items-start text-left space-y-6">

            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-white`}>
              MESSAGE YOUR FRIENDS <br />
              KEEP YOUR CONVERSATIONS <br />
              <span className="text-red-500 font-bold">
                PRIVATE & SAFE
              </span>
            </h1>

            <p className={`text-lg max-w-xl leading-relaxed text-zinc-400`}>
              Enncom is a free, end-to-end encrypted messaging app that lets you send messages, photos, videos, and files to your friends and family. It's simple, fast, and secure.
            </p>

          </div>
        </div>
      </main>

    </div>
  )
}
