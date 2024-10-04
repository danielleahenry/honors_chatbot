const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');
let typingMessage = null; // store the typing indicator message

// function to append messages to the chat
function appendMessage(content, role) {
    const messageElement = document.createElement('div');
    messageElement.className = role; // assign class based on role (user or assistant)

    // wrap the content in a message bubble
    const bubbleElement = document.createElement('div');
    bubbleElement.className = 'message-bubble'; // add bubble class
    bubbleElement.textContent = content; // set the text content

    messageElement.appendChild(bubbleElement); // append bubble to message element
    messagesDiv.appendChild(messageElement); // append message element to messages div
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // auto scroll to the bottom
}

// function to show "Hooticus is typing..." message
function showTypingIndicator() {
    typingMessage = document.createElement('div');
    typingMessage.className = 'assistant typing'; // use 'typing' class for styling
    typingMessage.textContent = 'Hooticus is typing...';
    messagesDiv.appendChild(typingMessage);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// function to remove the typing indicator
function removeTypingIndicator() {
    if (typingMessage) {
        messagesDiv.removeChild(typingMessage);
        typingMessage = null;
    }
}

// handle form submission
chatForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // prevent page refresh
    const userMessage = messageInput.value;

    if (!userMessage.trim()) {
        appendMessage('Please enter a message.', 'assistant');
        return; // exit the function early
    }

    appendMessage(userMessage, 'user'); // display user's message
    messageInput.value = ''; // clear input field

    // show typing indicator
    showTypingIndicator();

    // send the user's message to the server
    try {
        const response = await fetch('https://honors-chatbot.onrender.com/api/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                content: userMessage,  // the user's message
                role: 'user'           // include role as user
            }),
        });

        if (!response.ok) {
            const errorData = await response.json(); // parse error details
            throw new Error(errorData.details || 'Network response was not ok');
        }

        const data = await response.json();
        console.log('Response data:', data); // log the response data for debugging

        // remove typing indicator before appending assistant's response
        removeTypingIndicator();

        // handle assistant's response
        if (data.response) {
            appendMessage(data.response, 'assistant'); // display assistant's response
        } else {
            appendMessage('No response from assistant.', 'assistant');
        }
    } catch (error) {
        console.error('Error occurred:', error); // log the error
        removeTypingIndicator(); // remove typing indicator in case of error
        appendMessage('Sorry, there was an error. Please try again.', 'assistant');
        console.error('Error message:', error.message); // log the error message
    }
});
