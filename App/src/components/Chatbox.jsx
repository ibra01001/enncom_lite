import { useState, useRef, useEffect } from 'react';

const COLORS = {
    bg: '#1e1e1e',
    secondary: '#656565',
    accent: '#FF3535',
};

const seedMessages = [
    { id: 1, username: 'devuser', text: 'anyone got the link to the api docs?' },
    { id: 2, username: 'sam_k', text: 'checking, one sec' },
    { id: 3, username: 'sam_k', text: 'https://docs.example.com/api — looks like the latest version' },
    { id: 4, username: 'devuser', text: 'perfect, thanks' },
    { id: 5, username: 'jlin', text: 'anyone else seeing timeouts on staging today?' },
    { id: 6, username: 'devuser', text: 'not on my end, might just be your region' },
];

function Chatbox() {
    const [messages, setMessages] = useState(seedMessages);
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);
    const nextId = useRef(seedMessages.length + 1);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setMessages((prev) => [...prev, { id: nextId.current++, username: 'you', text: trimmed }]);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    const isEmpty = !input.trim();

    return (
        <div
            style={{
                backgroundColor: COLORS.bg,
                fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
            }}
            className="min-h-screen flex items-center justify-center px-4 py-6"
        >
            <style>{`
        .pc-input::placeholder { color: rgba(255,255,255,0.3); }
        .pc-input:focus { border-color: rgba(255,255,255,0.6); }
        .pc-btn:focus-visible { outline: 1px solid #FF3535; outline-offset: 2px; }
        .pc-scroll::-webkit-scrollbar { width: 8px; }
        .pc-scroll::-webkit-scrollbar-track { background: transparent; }
        .pc-scroll::-webkit-scrollbar-thumb { background: #656565; }
      `}</style>

            <div
                style={{ border: `1px solid ${COLORS.accent}`, height: '88vh', borderRadius: 0 }}
                className="w-full sm:w-4/5 lg:w-1/2 flex flex-col"
            >
                {/* Header */}
                <div
                    style={{
                        height: '10vh',
                        backgroundColor: COLORS.secondary,
                        borderBottom: `1px solid ${COLORS.accent}`,
                    }}
                    className="shrink-0 flex items-center px-5"
                >
                    <h4 className="text-white font-bold text-base m-0">#Public Chat</h4>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="pc-scrol text-left flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className="flex flex-col gap-0.5">
                            <span style={{ color: 'rgba(255,255,255,0.5)' }} className="text-xs font-semibold">
                                {msg.username}
                            </span>
                            <p className="text-white text-sm leading-relaxed break-words m-0">{msg.text}</p>
                        </div>
                    ))}
                </div>

                {/* Input bar */}
                <div
                    style={{ borderTop: `1px solid ${COLORS.accent}` }}
                    className="shrink-0 flex items-center gap-3 px-5 py-4"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message"
                        aria-label="Message"
                        style={{
                            backgroundColor: COLORS.bg,
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#ffffff',
                            borderRadius: 0,
                        }}
                        className="pc-input flex-1 text-sm px-3 py-2 outline-none min-w-0"
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={isEmpty}
                        style={{
                            backgroundColor: COLORS.secondary,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: 0,
                            opacity: isEmpty ? 0.5 : undefined,
                            cursor: isEmpty ? 'not-allowed' : 'pointer',
                        }}
                        className="pc-btn text-white text-sm font-bold px-4 py-2 shrink-0 hover:opacity-80 active:opacity-70"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Chatbox;