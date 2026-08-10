import { Link } from 'react-router-dom'
import Logo from './Logo'
const Navbar = () => {
    return (
        <div className='flex gap-5 bg-[#1E1E1E] h-10' >
            <Link to="/"><Logo /></Link>


            <div className='flex justify-between gap-5 align-center absolute right-10 top-2  text-white'>
                <Link to="/about">What is Enncom?</Link>
                <a href="#">Features</a>
                <a href="#">Guide</a>
                <Link to="/chatbox">Public Chat</Link>
            </div>

        </div>
    )
}

export default Navbar