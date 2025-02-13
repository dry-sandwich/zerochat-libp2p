async function startLibp2p() {
    try {
        // Ensure all dependencies are properly imported
        const { createLibp2p } = window.libp2p;
        const { websockets } = window.WebSockets;
        const { mplex } = window.Mplex;
        const { noise } = window.Noise;
        const { bootstrap } = window.Bootstrap;
        const { gossipsub } = window.GossipSub;

        // Create libp2p node
        node = await createLibp2p({
            addresses: { listen: ['/ip4/0.0.0.0/tcp/0/ws'] },
            transports: [websockets()],
            connectionEncryption: [noise()],
            streamMuxers: [mplex()],
            pubsub: gossipsub(),
            peerDiscovery: [
                bootstrap({
                    list: [
                        '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                        '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
                    ]
                })
            ],
             relay: { enabled: true, hop: { enabled: true, active: true } }
        });

        await node.start();
        console.log('Node started with ID:', node.peerId.toString());

        // Pubsub event listener
        node.pubsub.addEventListener('message', (evt) => {
            if (evt.detail.topic !== roomTopic) return;
            try {
                const msg = JSON.parse(new TextDecoder().decode(evt.detail.data));
                displayMessage(`${msg.sender}: ${msg.text}`, false);
            } catch (error) {
                console.error('Message parse error:', error);
            }
        });

        // Enable UI
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('joinBtn').disabled = false;
        document.getElementById('status').innerHTML = `🟢 Connected as ${username}`;

        // Set default room
        const roomInput = document.getElementById('roomInput');
        roomInput.value = roomInput.value || `room-${Math.random().toString(36).slice(2, 8)}`;
        joinRoom();

    } catch (error) {
        console.error('Libp2p initialization failed:', error);
        document.getElementById('status').innerHTML = '🔴 Initialization Failed';
    }
}

function joinRoom() {
    if (!node?.pubsub) {
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

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = {
        sender: username,
        text: messageInput.value,
        timestamp: Date.now()
    };
    
    node.pubsub.publish(
        roomTopic,
        new TextEncoder().encode(JSON.stringify(message))
    );
    displayMessage(`You: ${message.text}`, true);
    messageInput.value = '';
}

function displayMessage(text, isLocal) {
    const div = document.createElement("div");
    div.className = "message " + (isLocal ? "local" : "remote");
    div.textContent = text;
    document.getElementById("messages").appendChild(div);
}

// Initialize the app
document.addEventListener("DOMContentLoaded", startLibp2p);