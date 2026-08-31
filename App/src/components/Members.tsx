import { type FC } from 'react';
import { useSocket } from '../context/SocketContext';

interface MembersProps {
    currentRoom: string;
}

const Members: FC<MembersProps> = ({ currentRoom }) => {
    return (
        <div style={{ gridArea: 'members' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#1e1e1e' }}>
                <h4>{currentRoom}</h4>
                <h4>#Members list:</h4>
                <div>
                    {useSocket().myId ? <h5>{useSocket().myId}</h5> : null}

                </div>
            </div>

        </div>
    );
};

export default Members;