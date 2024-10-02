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

app.post('/api/new', async (req, res) => { // define POST endpoint for /api/new
    try {
        const emptyThread = await openai.beta.threads.create(); // create a new thread

        // Optional: You can add a message to the thread as needed
        await openai.beta.threads.messages.create({ // create a message in the thread
            threadId: emptyThread.id,
            content: "Greet the user and tell it about yourself and ask it what it is looking for.",
            role: 'user',
            metadata: {
                type: 'hidden'
            }
        });

        // Create a run for the thread
        const run = await openai.beta.threads.runs.create({
            threadId: emptyThread.id,
            assistantId,
        });

        res.json({ // send JSON response
            runId: run.id,
            threadId: emptyThread.id,
            status: run.status,
            requiredAction: run.requiredAction,
            lastError: run.lastError,
        });
    } catch (error) {
        console.error('Error occurred:', error); // log the error for debugging
        res.status(500).json({ error: 'Internal Server Error', details: error.message }); // send error details
    }
});

app.get('/api/threads/:threadId/runs/:runId', async (req, res) => { // define GET endpoint for retrieving thread runs
    const { threadId, runId } = req.params; // extract threadId and runId from request parameters
    const run = await openai.beta.threads.runs.retrieve({ threadId, runId }); // retrieve the run details
    res.json({ // send JSON response
        runId: run.id,
        threadId,
        status: run.status,
        requiredAction: run.requiredAction,
        lastError: run.lastError,
    });
});

const PORT = process.env.PORT || 3000; // set the port to the value from environment variables or default to 3000
app.listen(PORT, () => { // start the server
    console.log(`Server is running on http://localhost:${PORT}`); // log the server status
});
