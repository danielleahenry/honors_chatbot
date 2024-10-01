// script.js

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

let currentThreadId = '';

// function to add messages to the chat
function addMessage(content, role) {
    const messageElement = document.createElement('div');
    messageElement.className = role; // use role to differentiate between user and assistant
    messageElement.textContent = content;
    messagesContainer.appendChild(messageElement);
}

// function to handle form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // prevent page refresh

    const userMessage = messageInput.value;
    addMessage(userMessage, 'user'); // display user's message

    messageInput.value = ''; // clear the input field

    // if no current thread, create a new one
    if (!currentThreadId) {
        const newResponse = await fetch('/api/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const newData = await newResponse.json();
        currentThreadId = newData.threadId; // store the thread ID
    }

    // send user's message to the server
    await fetch(`/api/threads/${currentThreadId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: userMessage }),
    });

    // get the assistant's response
    const runResponse = await fetch(`/api/threads/${currentThreadId}/runs/latest`); // adjust endpoint as needed
    const runData = await runResponse.json();

    if (runData.lastError) {
        addMessage('Error: ' + runData.lastError.message, 'assistant');
    } else {
        addMessage('Assistant response will be displayed here', 'assistant');
    }
});
