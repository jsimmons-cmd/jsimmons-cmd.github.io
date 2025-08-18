document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatBox = document.getElementById('chat-box');

    // --- Firebase Configuration (Replace with your actual config) ---
    // const firebaseConfig = {
    //     apiKey: "YOUR_API_KEY",
    //     authDomain: "YOUR_AUTH_DOMAIN",
    //     databaseURL: "YOUR_DATABASE_URL",
    //     projectId: "YOUR_PROJECT_ID",
    //     storageBucket: "YOUR_STORAGE_BUCKET",
    //     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    //     appId: "YOUR_APP_ID"
    // };

    // --- Initialize Firebase (Uncomment when you have your config) ---
    // firebase.initializeApp(firebaseConfig);
    // const database = firebase.database();
    // const messagesRef = database.ref('messages');

    // --- Function to send a message ---
    const sendMessage = () => {
        const messageText = messageInput.value.trim();

        if (messageText) {
            // This is a placeholder for sending a message to the backend
            // In a real application, you would send this to Firebase
            displayMessage(messageText, 'sent', 'You');

            // --- Send message to Firebase (Uncomment and customize) ---
            // const newMessage = {
            //     text: messageText,
            //     sender: "User123", // Replace with actual user info
            //     timestamp: new Date().toISOString()
            // };
            // messagesRef.push(newMessage);

            messageInput.value = '';
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    };

    // --- Function to display a message ---
    const displayMessage = (text, type, username) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);

        const usernameElement = document.createElement('span');
        usernameElement.classList.add('username');
        usernameElement.textContent = username;

        const textElement = document.createElement('p');
        textElement.textContent = text;

        const timestampElement = document.createElement('span');
        timestampElement.classList.add('timestamp');
        const now = new Date();
        timestampElement.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

        messageElement.appendChild(usernameElement);
        messageElement.appendChild(textElement);
        messageElement.appendChild(timestampElement);

        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // --- Event Listeners ---
    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // --- Listen for new messages from Firebase (Uncomment and implement) ---
    // messagesRef.on('child_added', (snapshot) => {
    //     const message = snapshot.val();
    //     // You'll need to determine if the message is 'sent' or 'received'
    //     // based on the current user's identity.
    //     // For this example, we'll assume all messages from the DB are 'received'.
    //     displayMessage(message.text, 'received', message.sender);
    // });
});
