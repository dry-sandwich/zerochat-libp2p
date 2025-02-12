async function startLibp2p() {
    console.log("[libp2p] Initializing...");

    const { createLibp2p } = window.libp2p;
    const { WebSockets } = window.libp2pWebsockets;
    const { Noise } = window.libp2pNoise;
    const { Mplex } = window.libp2pMplex;
    const { GossipSub } = window.libp2pGossipsub;

    window.node = await createLibp2p({
        addresses: {
            listen: ["/dns4/your-cloudflare-relay.workers.dev/tcp/443/wss"]
        },
        transports: [WebSockets()],
        connectionEncryption: [Noise()],
        streamMuxers: [Mplex()],
        pubsub: GossipSub()
    });

    await window.node.start();
    console.log(`[libp2p] Node started with ID: ${window.node.peerId.toString()}`);

    window.node.pubsub.subscribe("p2p-chat-room", (message) => {
        const msg = new TextDecoder().decode(message.data);
        displayMessage(msg, false);
    });

    window.node.addEventListener('peer:connect', (evt) => {
        console.log(`[libp2p] Connected to peer: ${evt.detail}`);
    });

    document.getElementById("sendBtn").disabled = false;
}

function joinRoom() {
    console.log(`[libp2p] Joining room: p2p-chat-room`);
    window.node.pubsub.subscribe("p2p-chat-room");
}

function sendMessage() {
    const messageInput = document.getElementById("messageInput").value;
    window.node.pubsub.publish("p2p-chat-room", new TextEncoder().encode(messageInput));
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
