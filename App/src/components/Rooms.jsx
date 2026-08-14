const COLORS = {
    bg: '#1e1e1e',
    secondary: '#656565',
    accent: '#FF3535',
};

const Rooms = ({ currentRoom = 'public', onSelectRoom }) => {
    const availableRooms = [
        { id: 'public', name: 'Public Chat' },
    ];

    return (
        <aside
            style={{ backgroundColor: COLORS.bg }}
            className="w-64 sm:w-72 lg:w-80 h-full shrink-0 border-r border-[#FF3535] flex flex-col p-4 md:p-6 select-none overflow-y-auto"
        >
            <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white tracking-wide m-0">#Rooms</h2>
                <button
                    style={{ backgroundColor: COLORS.accent }}
                    className="text-white text-xs font-semibold px-3 py-1.5 rounded-none hover:opacity-90 active:opacity-80 transition-opacity"
                >
                    + Private Room
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-left mb-1">
                    Current Rooms
                </p>

                {availableRooms.map((room) => {
                    const isActive = currentRoom === room.id;
                    return (
                        <div
                            key={room.id}
                            onClick={() => onSelectRoom && onSelectRoom(room.id)}
                            style={{ borderLeft: isActive ? `3px solid ${COLORS.accent}` : '3px solid transparent' }}
                            className={`${
                                isActive ? 'bg-[#2A2A2A] text-white' : 'bg-transparent text-zinc-400 hover:text-white hover:bg-[#252525]'
                            } px-4 py-3 flex items-center justify-between font-semibold text-sm cursor-pointer transition-colors`}
                        >
                            <span className="flex items-center gap-2">
                                <span style={{ color: COLORS.accent }}>#</span> {room.name}
                            </span>
                            {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};

export default Rooms;