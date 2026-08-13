const COLORS = {
    bg: '#1e1e1e',
    secondary: '#656565',
    accent: '#FF3535',

};

const Rooms = () => {
    return (
        <aside
            style={{ backgroundColor: COLORS.bg }}
            className="w-64 sm:w-72 lg:w-80 h-full shrink-0 border-r border-[#FF3535] flex flex-col p-4 md:p-6 select-none overflow-y-auto"
        >
            <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white tracking-wide m-0">Rooms</h2>
                <button
                    style={{ backgroundColor: COLORS.accent }}
                    className="text-white text-xs font-semibold px-3 py-1.5 rounded-none hover:opacity-90 active:opacity-80 transition-opacity"
                >
                    + Privet Room
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-left mb-1">
                    Current Rooms
                </p>

                <div
                    style={{ borderLeft: `3px solid ${COLORS.accent}` }}
                    className="bg-[#2A2A2A] text-white px-4 py-3 flex items-center justify-between font-semibold text-sm cursor-pointer hover:bg-[#333333] transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <span style={{ color: COLORS.accent }}>#</span> Public Chat
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
            </div>
        </aside>
    )
}

export default Rooms;