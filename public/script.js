let node;
let roomTopic = "p2p-chat-room";

async function startLibp2p() {
    console.log("[libp2p] Initializing (Without WebRTC)...");

    node = await libp2p.createLibp2p({
        addresses: {
            listen: ["/dns4/shady-bizz-11.marvelmoonknight.workers.dev/tcp/443/wss"]
        },
        transports: [
            libp2p.WebSockets()
        ],
        connectionEncryption: [
            libp2p.Noise()
        ],
        streamMuxers: [
            libp2p.Mplex()
        ],
        pubsub: libp2p.GossipSub()
    });

    await node.start();
    console.log(`[libp2p] Node started with ID: ${node.peerId.toString()}`);

    node.pubsub.subscribe(roomTopic, (message) => {
        const msg = new TextDecoder().decode(message.data);
        displayMessage(msg, false);
    });

    node.addEventListener('peer:connect', (evt) => {
        console.log(`[libp2p] Connected to peer: ${evt.detail}`);
    });

    document.getElementById("sendBtn").disabled = false;
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
