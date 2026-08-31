import React from 'react';

const About: React.FC = () => {
  return (
    <div className="bg-[#272727] flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto overflow-y-auto">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
        About Enccom Lite
      </h1>
      <p className="text-zinc-300 text-lg leading-relaxed mb-8">
        Enccom Lite is a <span className="text-[#FF3535] font-bold">free real-time chat</span> application powered by OpenMLS cryptographic protocols. It allows users to communicate with each other in real-time with mathematically guaranteed forward secrecy.
      </p>

      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 mt-6">Our Vision</h2>
      <p className="text-zinc-300 text-lg leading-relaxed">
        We believe in <span className="text-[#FF3535] font-bold">freedom of speech</span> and the fundamental right to privacy.
      </p>
      <p className="text-zinc-300 text-lg leading-relaxed mt-2">
        Our goal is to let people be comfortable, <span className="text-[#FF3535] font-bold">safe</span>, and free to communicate and share ideas in a private, non-custodial environment.
      </p>
    </div>
  );
};

export default About;
