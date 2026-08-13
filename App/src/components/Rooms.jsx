
const COLORS = {
    bg: '#1e1e1e',
    secondary: '#656565',
    accent: '#FF3535',
};
const Rooms = () => {
    return (
        <div className="p-10" style={{ backgroundColor: COLORS.bg }}>

            <div className="flex gap-10">
                <h1 className="text-white">Rooms</h1>
                <button className="text-white">Create a Private Room</button>
            </div>
            <div>
                <p className="text-white text-left">current rooms :</p>

            </div>
            <div className="">

            </div>
        </div>
    )
}

export default Rooms