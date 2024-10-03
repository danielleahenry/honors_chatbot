// api/server.js

require('dotenv').config(); // load environment variables from .env file
const express = require('express'); // import express framework
const cors = require('cors'); // import cors middleware
const { OpenAI } = require('openai'); // import openai library

const app = express(); // create an express application
app.use(cors()); // enable cors
app.use(express.json()); // parse incoming json requests

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // set openai api key from environment variables
});

const assistantId = process.env.ASSISTANT_ID; // get assistant id from environment variables

let currentThreadId; // Variable to store the current thread ID

// Endpoint to start a new chat session and create a new thread
app.post('/api/start', async (req, res) => {
    try {
        // create a new thread
        const createdThread = await openai.beta.threads.create();
        currentThreadId = createdThread.id; // save the thread ID for future use

        res.json({ threadId: currentThreadId });
    } catch (error) {
        console.error('Error creating thread:', error);
        res.status(500).json({ error: 'Failed to create a new thread' });
    }
});

// Endpoint to send a new message in the existing thread
app.post('/api/new', async (req, res) => {
    try {
        if (!currentThreadId) {
            return res.status(400).json({ error: 'No active thread. Start a new thread first.' });
        }

        // create a message in the existing thread with the user's input
        await openai.beta.threads.messages.create(currentThreadId, {
            role: 'user',
            content: req.body.content,
        });

        // create a run in the existing thread to trigger the assistant's response
        const run = await openai.beta.threads.runs.create(currentThreadId, {
            assistant_id: assistantId,
        });

        // log the run status to check if it's executing properly
        console.log('Run Status:', run.status);

        // fetch the updated thread to get all messages, including the assistant's response
        const updatedThread = await openai.beta.threads.retrieve(currentThreadId);
        
        // Debug: log updated thread structure
        console.log('Updated Thread:', updatedThread);

        // Check for messages and get the last assistant message
        const assistantMessages = updatedThread.messages?.filter(msg => msg.role === 'assistant') || [];
        if (assistantMessages.length > 0) {
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
            res.json({
                response: lastAssistantMessage.content,
            });
        } else {
            res.json({ response: "no assistant messages found in the thread." });
        }
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'internal server error', details: error.message });
    }
});

app.get('/api/threads/:threadId/runs/:runId', async (req, res) => { 
    const { threadId, runId } = req.params; 
    try {
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);
        res.json({ 
            runId: run.id,
            threadId,
            status: run.status,
            requiredAction: run.requiredAction,
            lastError: run.lastError,
        });
    } catch (error) {
        console.error("error retrieving run:", error);
        res.status(500).json({ error: 'failed to retrieve run' }); // respond with an error
    }
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => { 
    console.log(`server is running on http://localhost:${PORT}`); 
});
