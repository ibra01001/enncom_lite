import { Link } from "react-router-dom";

const About = () => {
    return (
        <div className="bg-[#1E1E1E] min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                About Enncom Lite
            </h1>
            <p className="text-gray-300 text-lg text-center max-w-2xl leading-relaxed">
                Enncom lite is a real-time chat application 
                It allows users to communicate with each other in real-time.

            </p>
           <h1>Our Vision</h1>
           <p className="text-gray-300 text-lg text-center max-w-2xl leading-relaxed">
            Our goal is to let pepole be confortable safe and free to speak chat and share ideas in a privacy friendly environment.
            


           </p>
        </div>
    );
};

export default About;