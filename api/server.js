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

// store the thread id in memory (consider using a database for production)
let threadId = null; // initialize thread id

// handle openai api requests
const assistantId = process.env.ASSISTANT_ID; // get assistant id from environment variables

app.post('/api/new', async (req, res) => {
    try {
        // create a new thread only if it doesn't already exist
        if (!threadId) {
            const createdThread = await openai.beta.threads.create();
            if (!createdThread || !createdThread.id) throw new Error('failed to create a new thread');
            threadId = createdThread.id; // store the thread id for future use
        }

        // create a message in the existing thread with the user's input
        await openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: req.body.content, // use the user's input content here
        });

        // create a run in the existing thread to trigger the assistant's response
        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: assistantId, // use the assistant id from the environment variables
        });

        // log the run status to check if it's executing properly
        console.log('run status:', run.status);

        // Call the new function to check the status and print messages
        await checkStatusAndPrintMessages(threadId, run.id, res);

    } catch (error) {
        console.error('error occurred:', error);
        res.status(500).json({ error: 'internal server error', details: error.message });
    }
});

// Function to check status and print messages
const checkStatusAndPrintMessages = async (threadId, runId, res) => {
    try {
        let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
        if (runStatus.status === "completed") {
            let messages = await openai.beta.threads.messages.list(threadId);
        
            if (messages.data && Array.isArray(messages.data)) {
                const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
                if (assistantMessages.length > 0) {
                    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
                    const assistantMessage = await openai.beta.threads.messages.retrieve(threadId, lastAssistantMessage.id);
                    const assistantMessageContent = assistantMessage.content[0].text.value;

                    res.json({
                        runId: runStatus.id,
                        threadId: threadId,
                        status: runStatus.status,
                        response: assistantMessageContent || "no response from assistant."
                    });
                } else {
                    res.json({
                        runId: runStatus.id,
                        threadId: threadId,
                        status: runStatus.status,
                        response: "no assistant messages found in the thread."
                    });
                }
            } else {
                res.json({
                    runId: runStatus.id,
                    threadId: threadId,
                    status: runStatus.status,
                    response: "no messages found in the thread."
                });
            }
        } else {
            console.log("Run is not completed yet.");
        }
    } catch (error) {
        console.error('error occurred:', error);
        res.status(500).json({ error: 'internal server error', details: error.message });
    }
};

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
