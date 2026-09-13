import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/features.css';
import alxanderBg from '../../assets/alxander.svg';


interface HeroSectionProps {
  onScrollDown?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollDown }) => {
  const navigate = useNavigate();

  const handleExplore = () => {
    if (onScrollDown) {
      onScrollDown();
    } else {
      navigate('/features');
    }
  };

  return (
    <section className="relative  flex-1 flex items-center px-6 md:px-16 border-b border-[#333333] bg-[#272727] ob-grid-bg overflow-hidden">
      {/* Full-page SVG Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${alxanderBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3,
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          height: '110vh',


        }}
      ></div>

      {/* Animated Arrows on Right Side */}
      <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full z-0 pointer-events-none flex items-center justify-center opacity-60 lg:opacity-100">

      </div>

      {/* Content: Left aligned container */}
      <div className="relative z-10 w-full py-16 pl-0 pr-6 top-40">
        <div className="lg:w-1/2 flex flex-col items-start text-left space-y-6">
          {/* Statement Headline */}
          <h1 className="text-9xl sm:text-10xl lg:text-10xl font-extrabold tracking-tight leading-[1.12] text-white ">
            PRIVET <br /> CONVERSATIONS
          </h1>

          {/* Substatement */}
          <p className="text-lg max-w-xl leading-relaxed text-zinc-300 font-normal">
            Enccom is a free, end-to-end encrypted messaging app that lets you send messages, photos, videos, and files to your friends and family. It's simple, fast, and secure.
          </p>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link to="/chatbox" className=" shadow-lg">
              <button
                className="group relative flex h-14 w-64 items-center justify-between bg-[#ff3535] pl-6 pr-0 overflow-hidden rounded"
              >
                <span
                  className="absolute inset-y-0 right-0 w-0 bg-[#1e1e1e] transition-all duration-300 ease-in-out group-hover:w-full"
                ></span>

                <span
                  className="relative z-10 font-sans  font-bold font-[#ff3535] tracking-wider text-white transition-colors duration-300 group-hover:text-[#ff3535]"
                >
                  START CHATTING
                </span>

                <span
                  className="relative z-10 flex h-full w-14 items-center justify-center bg-[#1e1e1e] text-[#ff3535]"
                >
                  <svg
                    className="h-5 w-5 -rotate-45 transition-transform duration-300 ease-in-out group-hover:rotate-0"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="square"
                      stroke-linejoin="miter"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    ></path>
                  </svg>
                </span>
              </button>

            </Link>
            <button onClick={handleExplore} className="ob-btn-ghost">
              Explore Architecture
            </button>
          </div>
        </div>
      </div>




    </section>
  );
};
