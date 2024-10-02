// api/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// defines the POST endpoint for handling user messages
app.post('/api/new', async (req, res) => {
    try {
        const userMessage = req.body.content; // get the user's message from the request body
        
        // create a thread for the interaction
        const thread = await client.threads.create();

        // send the user's message to the assistant
        await client.threads.messages.create({
            threadId: thread.id,
            content: userMessage, // use the user's message
            role: 'user',
            metadata: {
                type: 'hidden'
            }
        });

        const run = await client.threads.runs.create({
            threadId: thread.id,
            assistantId: process.env.ASSISTANT_ID,
        });

        // respond with details about the run
        res.json({
            runId: run.id,
            threadId: thread.id,
            status: run.status,
            requiredAction: run.requiredAction,
            lastError: run.lastError,
        });
    } catch (error) {
        console.error('Error occurred:', error); // log the error for debugging
        res.status(500).json({ error: 'Internal Server Error', details: error.message }); // send error details
    }
});

// defines the GET endpoint for retrieving thread run details
app.get('/api/threads/:threadId/runs/:runId', async (req, res) => {
    const { threadId, runId } = req.params;
    try {
        const run = await client.threads.runs.retrieve({ threadId, runId });
        res.json({
            runId: run.id,
            threadId,
            status: run.status,
            requiredAction: run.requiredAction,
            lastError: run.lastError,
        });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// set the server to listen on the defined port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
