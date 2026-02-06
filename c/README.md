# Customer Support Agent - Mastra MVP

A minimal customer support agent built with Mastra framework. This is a skeletal implementation demonstrating the core functionality needed for a customer support chatbot.

## Features

- **Order Status Checking**: Check the status of customer orders
- **Inventory Checking**: Verify product availability
- **Support Ticket Creation**: Escalate complex issues to human agents
- **Conversational Interface**: Natural language interaction with customers

## Project Structure

```
support-agent/
├── src/
│   ├── agents/
│   │   └── support.js        # Main agent definition
│   ├── tools/
│   │   └── index.js          # Mock tools (order, inventory, tickets)
│   └── index.js              # Entry point with examples
├── .env.example              # Environment variables template
├── package.json              # Dependencies
└── README.md                 # This file
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...
   ```

3. **Run the agent**:
   ```bash
   npm run dev
   ```

## Usage

### Basic Usage

```javascript
import { supportAgent } from './src/agents/support.js';

const response = await supportAgent.generate({
  messages: [{
    role: 'user',
    content: 'Can you check the status of order #12345?'
  }]
});

console.log(response.text);
```

### Multi-turn Conversation

```javascript
const conversation = [
  { role: 'user', content: 'Hi, I need help' },
  { role: 'assistant', content: 'Hello! How can I assist you today?' },
  { role: 'user', content: 'Check order #12345' }
];

const response = await supportAgent.generate({
  messages: conversation
});
```

### With Streaming

```javascript
const stream = await supportAgent.generate({
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

## Available Tools

### 1. Check Order Status
Retrieves the current status of an order.

**Parameters:**
- `orderId` (string): The order ID to check

**Example:**
```
"Can you check the status of order #12345?"
```

### 2. Check Inventory
Checks if a product is currently in stock.

**Parameters:**
- `productId` (string): The product ID to check

**Example:**
```
"Is product ABC123 available?"
```

### 3. Create Support Ticket
Creates a ticket for issues requiring human intervention.

**Parameters:**
- `issue` (string): Description of the problem
- `priority` (string): One of 'low', 'medium', 'high'

**Example:**
```
"I received a damaged item and need a refund"
```

## Extending the Agent

### Adding New Tools

1. Define the tool in `src/tools/index.js`:

```javascript
export const newTool = {
  name: 'tool_name',
  description: 'What the tool does',
  parameters: {
    type: 'object',
    properties: {
      param: { type: 'string', description: 'Parameter description' }
    },
    required: ['param']
  },
  execute: async ({ param }) => {
    // Tool implementation
    return { result: 'data' };
  }
};
```

2. Add it to the agent in `src/agents/support.js`:

```javascript
import { newTool } from '../tools/index.js';

export const supportAgent = new Agent({
  // ...
  tools: [
    checkOrderStatus,
    checkInventory,
    createSupportTicket,
    newTool  // Add here
  ]
});
```

### Modifying Agent Behavior

Edit the `instructions` in `src/agents/support.js` to change how the agent behaves:

```javascript
export const supportAgent = new Agent({
  name: 'Customer Support Agent',
  instructions: `Your custom instructions here...`,
  // ...
});
```

### Connecting Real APIs

Replace the mock implementations in `src/tools/index.js` with actual API calls:

```javascript
export const checkOrderStatus = {
  // ...
  execute: async ({ orderId }) => {
    const response = await fetch(`https://api.example.com/orders/${orderId}`);
    return await response.json();
  }
};
```

## Integration Examples

### Express API Endpoint

```javascript
import express from 'express';
import { supportAgent } from './src/agents/support.js';

const app = express();
app.use(express.json());

app.post('/chat', async (req, res) => {
  const { messages } = req.body;
  
  const response = await supportAgent.generate({ messages });
  
  res.json({ reply: response.text });
});

app.listen(3000);
```

### WebSocket Server

```javascript
import { WebSocketServer } from 'ws';
import { supportAgent } from './src/agents/support.js';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const { message } = JSON.parse(data);
    
    const response = await supportAgent.generate({
      messages: [{ role: 'user', content: message }]
    });
    
    ws.send(JSON.stringify({ reply: response.text }));
  });
});
```

## Notes

- **Mock Tools**: All tools currently use mock data. Replace with real implementations for production.
- **Model**: Default model is GPT-4. Adjust in `src/agents/support.js` based on your needs.
- **Error Handling**: Add proper error handling for production use.
- **Authentication**: Implement user authentication before deploying.
- **Rate Limiting**: Add rate limiting to prevent abuse.

## Next Steps

1. Replace mock tools with real API integrations
2. Add conversation history/memory
3. Implement user authentication
4. Add logging and monitoring
5. Create a frontend interface
6. Add multi-language support
7. Implement sentiment analysis
8. Add analytics and reporting

## License

MIT
