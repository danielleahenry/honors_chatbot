// api/server.js
import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import fs from "fs";
import morgan from "morgan";// load environment variables from env

dotenv.config();

const cors = require('cors'); // import cors middleware
const app = express(); //creates express application
app.use(bodyParser.json());
app.use(cors()); // enable cors
app.use(morgan("combined"));
app.use(express.static('static'));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // get openai api key from environment variables
});
const assistantId = process.env.ASSISTANT_ID; // get assistant id from environment variables

// endpoint to handle chatbot
app.post('/api/new', async (req, res) => {
    try {
        // ensures code does not process with a blank message
        if (!req.body.message) {
            return res.status(400).json({ error: "Message cannot be blank" });
        }
        
        const userMessage = req.body.message; //setting variable to user input

        // create a thread
        const threadResponse = await openai.beta.threads.create();
        const threadId = threadResponse.id;
        
        // create a message in the existing thread with the user's input
        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: userMessage,
        });

        // runs the assistant
        const runResponse = await openai.beta.threads.runs.create(threadId, {
          assistant_id: assistant_id,
        });

        // checks the run status
        let run = await openai.beta.threads.runs.retrieve(threadId, runResponse.id);
        while (run.status !== "completed") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          run = await openai.beta.threads.runs.retrieve(threadId, runResponse.id);
        }

        // display the assistant's response
        const messagesResponse = await openai.beta.threads.messages.list(threadId);
        const assistantResponses = messagesResponse.data.filter(msg => msg.role === 'assistant');
        const response = assistantResponses.map(msg => 
          msg.content
            .filter(contentItem => contentItem.type === 'text')
            .map(textContent => textContent.text.value)
            .join('\n')
        ).join('\n');

        res.json({ response });

        } catch (error) {
            console.error('error occurred:', error);
            res.status(500).json({ error: 'internal server error', details: error.message });
        }
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => { 
    console.log(`server is running on http://localhost:${PORT}`); 
});
