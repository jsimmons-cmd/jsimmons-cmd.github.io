document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatBox = document.getElementById('chat-box');
    const signOutButton = document.getElementById('signout-button');
    const clearChatButton = document.getElementById('clear-chat-button');
    const appContainer = document.getElementById('container');
    let currentUser = null;
    let currentUsername = null;

    // --- PASTE YOUR FIREBASE CONFIGURATION HERE ---
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
    const app = firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const auth = firebase.auth();
    const messagesRef = database.ref('messages');
    const usersRef = database.ref('users');

    // --- Authentication State Observer ---
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            usersRef.child(user.uid).once('value', snapshot => {
                if (snapshot.exists() && snapshot.val().username) {
                    currentUsername = snapshot.val().username;
                    showChatApp();
                } else {
                    showUsernamePrompt();
                }
            });
        } else {
            currentUser = null;
            currentUsername = null;
            showLoginUI();
        }
    });

    // --- UI to Prompt for Username ---
    const showUsernamePrompt = () => {
        appContainer.style.display = 'none';
        signOutButton.style.display = 'none';
        clearChatButton.style.display = 'none';

        // Remove old prompts if they exist
        const oldPrompt = document.getElementById('username-prompt-container');
        if(oldPrompt) oldPrompt.remove();

        const promptOverlay = document.createElement('div');
        promptOverlay.id = 'username-prompt-container';
        promptOverlay.className = 'auth-overlay';
        promptOverlay.innerHTML = `
            <div id="auth-container">
                <h2 class="glitch" data-text="CHOOSE USERNAME">CHOOSE USERNAME</h2>
                <input type="text" id="username-input" placeholder="Enter your callsign" />
                <button id="set-username-button">CONFIRM</button>
                <p id="auth-error"></p>
            </div>
        `;
        document.body.appendChild(promptOverlay);

        const setUsernameButton = document.getElementById('set-username-button');
        setUsernameButton.addEventListener('click', () => {
            const username = document.getElementById('username-input').value.trim();
            if (username.length >= 3) {
                usersRef.child(currentUser.uid).set({
                    username: username,
                    email: currentUser.email
                });
                // The onAuthStateChanged listener will automatically pick up the change
                // but we can speed it up by calling the show chat function directly.
                currentUsername = username;
                document.body.removeChild(promptOverlay);
                showChatApp();
            } else {
                document.getElementById('auth-error').textContent = "Username must be at least 3 characters.";
            }
        });
    };
    
    // --- Login / Registration UI ---
    const showLoginUI = () => {
        appContainer.style.display = 'none';
        signOutButton.style.display = 'none';
        clearChatButton.style.display = 'none';

        // Remove old prompts if they exist
        const oldPrompt = document.getElementById('username-prompt-container');
        if(oldPrompt) oldPrompt.remove();

        let loginOverlay = document.getElementById('login-overlay');
        if (!loginOverlay) {
            loginOverlay = document.createElement('div');
            loginOverlay.id = 'login-overlay';
            loginOverlay.className = 'auth-overlay';
            document.body.appendChild(loginOverlay);
        }
        
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
        loginOverlay.style.display = 'flex';

        document.getElementById('login-button').addEventListener('click', () => {
            auth.signInWithEmailAndPassword(document.getElementById('email-input').value, document.getElementById('password-input').value)
                .catch(error => { document.getElementById('auth-error').textContent = error.message; });
        });
        document.getElementById('register-button').addEventListener('click', () => {
            auth.createUserWithEmailAndPassword(document.getElementById('email-input').value, document.getElementById('password-input').value)
                .catch(error => { document.getElementById('auth-error').textContent = error.message; });
        });
    };
    
    // --- Function to Show the Main Chat Application ---
    const showChatApp = () => {
        const loginOverlay = document.getElementById('login-overlay');
        if (loginOverlay) loginOverlay.style.display = 'none';

        appContainer.style.display = 'flex';
        signOutButton.style.display = 'block';
        clearChatButton.style.display = 'block';
        listenForMessages();
    };

    // --- Sign Out ---
    signOutButton.addEventListener('click', () => { auth.signOut(); });

    // --- Clear Chat History ---
    clearChatButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete all message logs? This action cannot be undone.")) {
            messagesRef.remove()
                .then(() => { chatBox.innerHTML = ''; })
                .catch((error) => { console.error("Error clearing logs: ", error); });
        }
    });

    // --- Send Message ---
    const sendMessage = () => {
        const messageText = messageInput.value.trim();
        if (messageText && currentUser && currentUsername) {
            messagesRef.push({
                text: messageText,
                senderId: currentUser.uid,
                senderUsername: currentUsername,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            messageInput.value = '';
        }
    };

    // --- Display Message ---
    const displayMessage = (messageData) => {
        const type = messageData.senderId === currentUser.uid ? 'sent' : 'received';
        const displayName = type === 'sent' ? 'You' : messageData.senderUsername || `User-${messageData.senderId.substring(0,6)}`;
        const messageTime = new Date(messageData.timestamp);
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.innerHTML = `
            <span class="username">${displayName}</span>
            <p>${messageData.text}</p>
            <span class="timestamp">${messageTime.getHours()}:${String(messageTime.getMinutes()).padStart(2, '0')}</span>
        `;
        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // --- Real-time message listener ---
    const listenForMessages = () => {
        chatBox.innerHTML = '';
        messagesRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message) { displayMessage(message); }
        });
    };

    // --- Core Event Listeners ---
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') { sendMessage(); }
    });
});
