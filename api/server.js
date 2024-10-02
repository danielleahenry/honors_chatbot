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

        // ensure the thread was created successfully
        if (!emptyThread || !emptyThread.id) {
            throw new Error('Failed to create a new thread');
        }

        // create a message in the thread using the proper API
        const threadMessages = await openai.beta.threads.messages.create(
            emptyThread.id,  // pass the thread ID
            {
                role: 'user',  // specify the role as 'user'
                content: "Greet the user and tell it about yourself and ask it what it is looking for."
            }
        );

        // ensure the message was created successfully
        if (!threadMessages) {
            throw new Error('Failed to create a message in the thread');
        }

        // create a run for the thread
        const run = await openai.beta.threads.runs.create({
            threadId: emptyThread.id,
            assistantId,
        });

        res.json({
            runId: run.id,
            threadId: emptyThread.id,
            status: run.status,
            requiredAction: run.requiredAction,
            lastError: run.lastError,
        });

    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});


app.get('/api/threads/:threadId/runs/:runId', async (req, res) => { 
    const { threadId, runId } = req.params; 
    const run = await openai.beta.threads.runs.retrieve({ threadId, runId }); 
    res.json({ 
        runId: run.id,
        threadId,
        status: run.status,
        requiredAction: run.requiredAction,
        lastError: run.lastError,
    });
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => { 
    console.log(`Server is running on http://localhost:${PORT}`); 
});
