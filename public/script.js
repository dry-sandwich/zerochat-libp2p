// Ensure libp2p is properly initialized and PubSub works
let node;
let roomTopic = "p2p-chat-room";

// Function to initialize libp2p
async function startLibp2p() {
    try {
        node = await window.libp2p.createLibp2p({
            transports: [
                new window.libp2p.WebSockets()
            ],
            connectionEncryption: [
                new window.libp2p.Noise()
            ],
            streamMuxers: [
                new window.libp2p.Mplex()
            ],
            pubsub: new window.libp2p.GossipSub() // Ensure PubSub is enabled
        });

        // Start the node
        await node.start();
        console.log(`[libp2p] Node started with ID: ${node.peerId.toString()}`);

        // Subscribe to the default chat room
        await node.pubsub.subscribe(roomTopic);
        console.log(`[libp2p] Subscribed to ${roomTopic}`);

        // Listen for messages
        node.pubsub.addEventListener("message", (evt) => {
            const msg = new TextDecoder().decode(evt.detail.data);
            displayMessage(msg, false);
        });

    } catch (error) {
        console.error("[libp2p] Error initializing libp2p:", error);
    }
}

// Function to join a room
async function joinRoom(roomName) {
    if (!node || !node.pubsub) {
        console.error("[libp2p] PubSub is not available. Make sure libp2p is running.");
        return;
    }

    console.log(`[libp2p] Joining room: ${roomName}`);
    await node.pubsub.subscribe(roomName);
}

// Function to send a message
async function sendMessage(message) {
    if (!node || !node.pubsub) {
        console.error("[libp2p] Cannot send message. PubSub is not available.");
        return;
    }

    const encodedMessage = new TextEncoder().encode(message);
    await node.pubsub.publish(roomTopic, encodedMessage);
    displayMessage(message, true);
}

// Function to display messages in the chat UI
function displayMessage(message, isOwnMessage) {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");

    messageElement.textContent = message;
    messageElement.classList.add(isOwnMessage ? "my-message" : "their-message");
    chatBox.appendChild(messageElement);
}

// Ensure the script only runs after the page loads
document.addEventListener("DOMContentLoaded", startLibp2p);
