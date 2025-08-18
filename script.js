document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatBox = document.getElementById('chat-box');
    const loginContainer = document.createElement('div');
    let currentUser = null;

    // --- PASTE YOUR FIREBASE CONFIGURATION HERE ---
    // IMPORTANT: Make sure to use your NEW, regenerated API Key
    const firebaseConfig = {
      apiKey: "AIzaSyD0onGSUcaOq04TOQKt6k4EHrmNDXpR2pY",
      authDomain: "arasaka-34814.firebaseapp.com",
      databaseURL: "https://arasaka-34814-default-rtdb.firebaseio.com",
      projectId: "arasaka-34814",
      storageBucket: "arasaka-34814.firebasestorage.app",
      messagingSenderId: "921180123654",
      appId: "1:921180123654:web:108d02c8efdb34df818987"
    };

    // --- Initialize Firebase ---
    // Make sure you've included the Firebase SDK scripts in your index.html
    const app = firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const auth = firebase.auth();
    const messagesRef = database.ref('messages');

    // --- Authentication ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            currentUser = user;
            // Hide login UI if it exists and start the chat
            if (document.body.contains(loginContainer)) {
                document.body.removeChild(loginContainer);
            }
            listenForMessages();
        } else {
            // User is signed out.
            currentUser = null;
            // Show login UI
            showLoginUI();
        }
    });

    // --- Anonymous Login Function ---
    const signInAnonymously = () => {
        auth.signInAnonymously().catch(error => {
            console.error("Anonymous sign-in failed:", error);
        });
    };

    // --- UI for Logging In ---
    const showLoginUI = () => {
        loginContainer.innerHTML = `
            <div id="login-container" style="text-align: center; color: #00ffcc;">
                <h2 class="glitch" data-text="AUTHENTICATE">AUTHENTICATE</h2>
                <p class="subtitle">Connect to the ARASAKA secure network.</p>
                <button id="login-button" style="background-color: #00ffcc; color: #0a0a0a; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-weight: 700;">CONNECT</button>
            </div>
        `;
        // Styles for the login overlay
        loginContainer.style.position = 'fixed';
        loginContainer.style.top = '0';
        loginContainer.style.left = '0';
        loginContainer.style.width = '100%';
        loginContainer.style.height = '100%';
        loginContainer.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
        loginContainer.style.display = 'flex';
        loginContainer.style.justifyContent = 'center';
        loginContainer.style.alignItems = 'center';
        loginContainer.style.zIndex = '1000';
        
        document.body.appendChild(loginContainer);

        // Add event listener to the newly created button
        document.getElementById('login-button').addEventListener('click', signInAnonymously);
    };

    // --- Function to send a message ---
    const sendMessage = () => {
        const messageText = messageInput.value.trim();

        if (messageText && currentUser) {
            const newMessage = {
                text: messageText,
                senderId: currentUser.uid,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            messagesRef.push(newMessage);
            messageInput.value = '';
        }
    };

    // --- Function to display a single message ---
    const displayMessage = (messageData) => {
        const messageElement = document.createElement('div');
        const type = messageData.senderId === currentUser.uid ? 'sent' : 'received';
        messageElement.classList.add('message', type);

        const usernameElement = document.createElement('span');
        usernameElement.classList.add('username');
        usernameElement.textContent = type === 'sent' ? 'You' : `User-${messageData.senderId.substring(0, 6)}`;

        const textElement = document.createElement('p');
        textElement.textContent = messageData.text;

        const timestampElement = document.createElement('span');
        timestampElement.classList.add('timestamp');
        const messageTime = new Date(messageData.timestamp);
        timestampElement.textContent = `${messageTime.getHours()}:${String(messageTime.getMinutes()).padStart(2, '0')}`;

        messageElement.appendChild(usernameElement);
        messageElement.appendChild(textElement);
        messageElement.appendChild(timestampElement);

        chatBox.appendChild(messageElement);
        // Scroll to the bottom to see the new message
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // --- Listen for new messages from Firebase ---
    const listenForMessages = () => {
        // Clear old messages before listening
        chatBox.innerHTML = '';
        messagesRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message) {
              displayMessage(message);
            }
        });
    };

    // --- Event Listeners for sending messages ---
    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

});
