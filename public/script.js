let node;
let roomTopic = "p2p-chat-room";

async function startLibp2p() {
    node = await window.libp2p.createLibp2p({
        transports: [new window.libp2p.WebSockets()],
        connectionEncryption: [new window.libp2p.Noise()],
        streamMuxers: [new window.libp2p.Mplex()],
        pubsub: new window.libp2p.GossipSub(),
		/*relay: {
            enabled: true,
            hop: {
                enabled: true,
            },
        },
        addresses: {
            listen: ["/dns4/your-cloudflare-worker.workers.dev/wss"], // Relay server
        },*/
    });

    await node.start();
    console.log(`[libp2p] Node started with ID: ${node.peerId.toString()}`);

    node.addEventListener('peer:connect', (evt) => {
        console.log(`[libp2p] Connected to peer: ${evt.detail}`);
    });

    node.pubsub.addEventListener('message', (evt) => {
        const msg = new TextDecoder().decode(evt.detail.data);
        displayMessage(msg, false);
    });

    await node.pubsub.subscribe(roomTopic);
}

function joinRoom() {
    roomTopic = document.getElementById("roomInput").value;
    if (!roomTopic) return alert("Enter a room name!");

    console.log(`[libp2p] Joining room: ${roomTopic}`);
    node.pubsub.subscribe(roomTopic);
}

function sendMessage() {
    if (!roomTopic) return alert("Join a room first!");

    const messageInput = document.getElementById("messageInput").value;
    node.pubsub.publish(roomTopic, new TextEncoder().encode(messageInput));
    displayMessage(messageInput, true);
}

function displayMessage(text, isLocal) {
    const div = document.createElement("div");
    div.className = "message " + (isLocal ? "local" : "remote");
    div.textContent = text;
    document.getElementById("messages").appendChild(div);
}

document.addEventListener("DOMContentLoaded", async () => {
    await startLibp2p();
});
