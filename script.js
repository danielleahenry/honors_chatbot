// script.js

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');

// function to append messages to the chat
function appendMessage(content, role) {
    const messageElement = document.createElement('div');
    messageElement.className = role; // assign class based on role (user or assistant)
    messageElement.textContent = content;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // auto scroll to the bottom
}

// handle form submission
chatForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // prevent page refresh
    const userMessage = messageInput.value;
    appendMessage(userMessage, 'user'); // display user's message
    messageInput.value = ''; // clear input field

    // send the user's message to the server
    try {
        const response = await fetch('/api/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: userMessage }), // include user message in the request body
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        // handle assistant's response
        if (data.content) {
            appendMessage(data.content, 'assistant'); // display assistant's response
        } else {
            appendMessage('No response from assistant.', 'assistant'); // handle case where no response is returned
        }
    } catch (error) {
        console.error('Error:', error);
        appendMessage('Sorry, there was an error. Please try again.', 'assistant');
    }
});
