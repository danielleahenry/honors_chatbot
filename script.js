// script.js

const form = document.getElementById('chat-form'); // get the chat form element
const messagesContainer = document.getElementById('messages'); // get the messages container

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // prevent form from submitting

  const input = document.getElementById('message-input'); // get the message input
  const message = input.value; // get the input value
  input.value = ''; // clear the input

  // display the user's message
  addMessage('You', message);

  // send the message to the server
  const response = await fetch('/api/new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: message }), // send the message content
  });

  const data = await response.json(); // parse the response

  // display the assistant's response
  addMessage('Assistant', data.content);
});

// function to add a message to the chat
function addMessage(sender, content) {
  const messageElement = document.createElement('div'); // create a new message element
  messageElement.textContent = `${sender}: ${content}`; // set the message content
  messagesContainer.appendChild(messageElement); // append the message to the container
}

