import { Link } from 'react-router-dom';
import Logo from './Logo';

const Navbar = () => {
  return (
    <header className="w-full h-14 bg-[#1E1E1E] border-b border-[#FF3535]/30 px-6 flex items-center justify-between shrink-0 z-50">
      <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg hover:opacity-90 transition-opacity">
        <Logo />
        <h6>Enncom_lite</h6>
      </Link>

      <nav className="flex items-center gap-6 text-sm text-zinc-300">
        <Link to="/about" className="hover:text-[#737373ff] transition-colors">What is Enncom?</Link>
        <Link to="/features" className="hover:text-[#737373ff] transition-colors">Features</Link>
        <a href="#" className="hover:text-[#737373ff] transition-colors">Guide</a>
        <Link to="/chatbox" className="text-red-500 font-semibold hover:text-[#737373ff] transition-colors">Public Chat</Link>
      </nav>
    </header>
  );
};

export default Navbar;
