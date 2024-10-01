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

// handle OpenAI API requests
const assistantId = process.env.ASSISTANT_ID; //get from ev

app.post('/api/new', async (req, res) => {
  try {
    const thread = await client.threads.create(); // creates a new thread
    await client.threads.messages.create({
      threadId: thread.id,
      content: "Greet the user and tell it about yourself and ask it what it is looking for.",
      role: 'user',
      metadata: {
        type: 'hidden'
      }
    });

    const run = await client.threads.runs.create({
      threadId: thread.id,
      assistantId,
    });

    res.json({
      runId: run.id,
      threadId: thread.id,
      status: run.status,
      requiredAction: run.requiredAction,
      lastError: run.lastError,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/threads/:threadId/runs/:runId', async (req, res) => {
  const { threadId, runId } = req.params;
  const run = await client.threads.runs.retrieve({ threadId, runId });
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
