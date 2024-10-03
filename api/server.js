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

        // fetch the updated thread to get all messages, including the assistant's response
        const updatedThread = await openai.beta.threads.retrieve(threadId);

        // log the structure of the thread to see what messages we are getting
        console.log('updated thread:', updatedThread);

        // check if 'messages' is present and is an array
        if (updatedThread.messages && Array.isArray(updatedThread.messages)) {
            // filter out the messages where the role is 'assistant'
            const assistantMessages = updatedThread.messages.filter(message => message.role === 'assistant');

            if (assistantMessages.length > 0) {
                // get the last assistant message
                const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];

                // retrieve the last assistant's message content by its id
                const assistantMessage = await openai.beta.threads.messages.retrieve(threadId, lastAssistantMessage.id);

                // access the actual message content (array structure)
                const assistantMessageContent = assistantMessage.content[0].text.value;

                // return the assistant's message content
                res.json({
                    runId: run.id,
                    threadId: threadId,
                    status: run.status,
                    requiredAction: run.requiredAction,
                    lastError: run.lastError,
                    response: assistantMessageContent ? assistantMessageContent : "no response from assistant."
                });
            } else {
                // no assistant message found in the thread
                res.json({
                    runId: run.id,
                    threadId: threadId,
                    status: run.status,
                    requiredAction: run.requiredAction,
                    lastError: run.lastError,
                    response: "no assistant messages found in the thread."
                });
            }
        } else {
            // handle the case where 'messages' is not present or not an array
            res.json({
                runId: run.id,
                threadId: threadId,
                status: run.status,
                requiredAction: run.requiredAction,
                lastError: run.lastError,
                response: "no messages found in the thread."
            });
        }
    } catch (error) {
        console.error('error occurred:', error);
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
