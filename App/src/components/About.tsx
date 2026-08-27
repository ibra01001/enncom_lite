const About = () => {
  return (
    <div className="bg-[#1E1E1E] min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
        About Enncom Lite
      </h1>
      <p className="text-gray-300 text-lg text-center max-w-2xl leading-relaxed">
        Enncom lite is a <span className="text-red-500 font-bold">free real-time chat</span> application.
        It allows users to communicate with each other in real-time.
      </p>

      <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 mt-8">Our Vision</h1>
      <p className="text-gray-300 text-lg text-center max-w-2xl leading-relaxed">
        We belive in the <span className="text-red-500 font-bold">freedom of speech</span>, and the right for privacy
      </p>
      <p className="text-gray-300 text-lg text-center max-w-2xl leading-relaxed mt-2">
        Our goal is to let people be comfortable, <span className="text-red-500 font-bold">safe</span> and free to speak chat and share ideas in a private friendly environment.
      </p>
    </div>
  );
};

export default About;
