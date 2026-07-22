import Logo from './Logo'
const Navbar = () => {
    return (
        <div className='flex gap-5 bg-[#1E1E1E] h-10' >
            <Logo />


            <div className='flex justify-between gap-5 align-center absolute right-10 top-2  text-white'>
                <a href="#">What is Enncom?</a>
                <a href="#">Features</a>
                <a href="#">Guide</a>
                <a href="/public-chat">public chat</a>
            </div>

        </div>
    )
}

export default Navbar