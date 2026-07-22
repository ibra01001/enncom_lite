import Logo from './Logo'
const Navbar = () => {
    return (
        <div className='bg-[#1E1E1E]'>
            <div className='flex gap-5'>
                <Logo />

                <a href="#">Home</a>
                <a href="#">About</a>
                <a href="#">Contact</a>
            </div>

        </div>
    )
}

export default Navbar