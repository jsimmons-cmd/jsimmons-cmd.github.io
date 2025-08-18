document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatBox = document.getElementById('chat-box');
    const signOutButton = document.getElementById('signout-button');
    const loginOverlay = document.createElement('div');
    let currentUser = null;

    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0onGSUcaOq04TOQKt6k4EHrmNDXpR2pY",
  authDomain: "arasaka-34814.firebaseapp.com",
  databaseURL: "https://arasaka-34814-default-rtdb.firebaseio.com",
  projectId: "arasaka-34814",
  storageBucket: "arasaka-34814.firebasestorage.app",
  messagingSenderId: "921180123654",
  appId: "1:921180123654:web:108d02c8efdb34df818987",
  measurementId: "G-WVFCENL7HW"
};

    // --- Initialize Firebase ---
    const app = firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const auth = firebase.auth();
    const messagesRef = database.ref('messages');

    // --- Authentication State Observer ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            currentUser = user;
            // Hide login UI and show main chat
            if (document.body.contains(loginOverlay)) {
                document.body.removeChild(loginOverlay);
            }
            signOutButton.style.display = 'block'; // Show signout button
            listenForMessages();
        } else {
            // User is signed out.
            currentUser = null;
            signOutButton.style.display = 'none'; // Hide signout button
            showLoginUI();
        }
    });
    
    // --- Login / Registration UI ---
    const showLoginUI = () => {
        loginOverlay.innerHTML = `
            <div id="auth-container">
                <h2 class="glitch" data-text="ARASAKA LOGIN">ARASAKA LOGIN</h2>
                <input type="email" id="email-input" placeholder="Corporate Email" />
                <input type="password" id="password-input" placeholder="Password" />
                <div id="auth-buttons">
                    <button id="login-button">LOGIN</button>
                    <button id="register-button">REGISTER</button>
                </div>
                <p id="auth-error"></p>
            </div>
        `;
        // Apply styling for the overlay
        loginOverlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(10,10,10,0.95); display: flex; justify-content: center; align-items: center; z-index: 1000; text-align: center; color: #00ffcc;`;
        document.body.appendChild(loginOverlay);

        // --- Auth Event Listeners ---
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');
        const loginButton = document.getElementById('login-button');
        const registerButton = document.getElementById('register-button');
        const authError = document.getElementById('auth-error');

        loginButton.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            auth.signInWithEmailAndPassword(email, password)
                .catch(error => { authError.textContent = error.message; });
        });

        registerButton.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            auth.createUserWithEmailAndPassword(email, password)
                .catch(error => { authError.textContent = error.message; });
        });
    };

    // --- Sign Out ---
    signOutButton.addEventListener('click', () => {
        auth.signOut();
    });

    // --- Function to send a message ---
    const sendMessage = () => {
        const messageText = messageInput.value.trim();
        if (messageText && currentUser) {
            const newMessage = {
                text: messageText,
                senderId: currentUser.uid,
                senderEmail: currentUser.email, // Store the email
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
        // Use the user's email prefix for the name
        const displayName = type === 'sent' ? 'You' : messageData.senderEmail.split('@')[0];
        usernameElement.textContent = displayName;

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
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // --- Real-time message listener ---
    const listenForMessages = () => {
        chatBox.innerHTML = ''; // Clear chatbox on login
        messagesRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message) {
              displayMessage(message);
            }
        });
    };

    // --- Core Event Listeners ---
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
});
