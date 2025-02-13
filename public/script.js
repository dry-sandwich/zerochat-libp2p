let node;
let roomTopic;
let username = `User${Math.floor(Math.random() * 1000)}`;

// Initialize libp2p with proper component imports
async function startLibp2p() {
    try {
        const { createLibp2p } = window.libp2p;
        const { noise } = window.Noise;
        const { mplex } = window.Mplex;
        const { websockets } = window.WebSockets;
        const { bootstrap } = window.Bootstrap;

        node = await createLibp2p({
            addresses: {
                listen: ['/ip4/0.0.0.0/tcp/0/ws']
            },
            transports: [websockets()],
            connectionEncryption: [noise()],
            streamMuxers: [mplex()],
            pubsub: window.libp2p.gossipsub(),
            peerDiscovery: [
                bootstrap({
                    list: [
                        '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                        '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
                    ]
                })
            ],
            relay: {
                enabled: true,
                hop: {
                    enabled: true,
                    active: true
                }
            }
        });

        await node.start();
        console.log('Libp2p node started:', node.peerId.toString());
        
        // Enable UI elements after initialization
		document.getElementById('joinBtn').disabled = false;
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('status').innerHTML = 
            `🟢 Connected as ${username}`;
        
        // Initialize default room
        const roomInput = document.getElementById('roomInput');
        roomInput.value = roomInput.value || `room-${Math.random().toString(36).slice(2, 8)}`;
        joinRoom();

    } catch (error) {
        console.error('Libp2p initialization failed:', error);
        document.getElementById('status').innerHTML = '🔴 Connection Failed';
    }
}

function joinRoom() {
    if (!node) {
        alert('Libp2p node not initialized yet!');
        return;
    }

    const newRoom = document.getElementById('roomInput').value;
    if (!newRoom) return alert('Please enter a room name!');

    try {
        if (roomTopic) {
            node.pubsub.unsubscribe(roomTopic);
        }
        
        roomTopic = newRoom;
        node.pubsub.subscribe(roomTopic);
        
        document.getElementById('messages').innerHTML = '';
        document.getElementById('status').innerHTML = 
            `🟢 Connected to ${roomTopic} as ${username}`;
            
    } catch (error) {
        console.error('Room join error:', error);
        alert('Failed to join room!');
    }
}

// Update event listener initialization
node.pubsub.addEventListener('message', (evt) => {
    if (evt.detail.topic !== roomTopic) return;
    const msgData = new TextDecoder().decode(evt.detail.data);
    try {
        const msg = JSON.parse(msgData);
        displayMessage(`${msg.sender}: ${msg.text}`, false);
    } catch (error) {
        console.error('Failed to parse message:', error);
    }
});