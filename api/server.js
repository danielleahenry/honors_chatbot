// api/server.js

require('dotenv').config(); // load environment variables from .env file
const express = require('express'); // import express framework
const cors = require('cors'); // import cors middleware
const { OpenAI } = require('openai'); // import OpenAI library

const app = express(); // create an express application
app.use(cors()); // enable cors
app.use(express.json()); // parse incoming JSON requests

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // set OpenAI API key from environment variables
});

// handle OpenAI API requests
const assistantId = process.env.ASSISTANT_ID; // get assistant ID from environment variables

app.post('/api/new', async (req, res) => {
    try {
        // create a new thread
        const emptyThread = await openai.beta.threads.create();
        if (!emptyThread || !emptyThread.id) throw new Error('Failed to create a new thread');

        // create a message in the thread with the user's input
        const threadMessages = await openai.beta.threads.messages.create(emptyThread.id, {
            role: 'user',
            content: req.body.content, // use the user's input content here
        });

        if (!threadMessages) throw new Error('Failed to create a message in the thread');

        // create a run in the new thread
        const run = await openai.beta.threads.runs.create(emptyThread.id, {
            assistant_id: assistantId, // use the correct parameter name
        });

        // fetch the updated thread to get the assistant's response
        const updatedThread = await openai.beta.threads.retrieve(emptyThread.id);
        const assistantMessage = updatedThread.messages.find(msg => msg.role === 'assistant');

        // return the assistant's message
        res.json({
            runId: run.id,
            threadId: emptyThread.id,
            status: run.status,
            requiredAction: run.requiredAction,
            lastError: run.lastError,
            response: assistantMessage ? assistantMessage.content : "No response from assistant."
        });

    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
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
        console.error("Error retrieving run:", error);
        res.status(500).json({ error: 'Failed to retrieve run' }); // Respond with an error
    }
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => { 
    console.log(`Server is running on http://localhost:${PORT}`); 
});
