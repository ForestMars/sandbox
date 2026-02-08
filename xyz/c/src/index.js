import 'dotenv/config';
import { supportAgent } from './agents/support.js';

/**
 * Main entry point for the customer support agent
 * This demonstrates how to interact with the agent
 */

async function main() {
  console.log('🤖 Customer Support Agent initialized\n');
  
  // Example interactions
  const examples = [
    'Hi, I need to check the status of my order #12345',
    'Is product ABC123 in stock?',
    'I received a damaged item and need a refund'
  ];

  console.log('Example queries you can ask:');
  examples.forEach((ex, i) => console.log(`${i + 1}. ${ex}`));
  console.log('\n---\n');

  // Example usage: Check order status
  try {
    console.log('Example: Checking order status...\n');
    
    const response = await supportAgent.generate({
      messages: [{
        role: 'user',
        content: 'Can you check the status of order #ORD12345?'
      }]
    });

    console.log('Agent Response:', response.text);
    
    if (response.toolCalls && response.toolCalls.length > 0) {
      console.log('\nTools Used:');
      response.toolCalls.forEach(call => {
        console.log(`- ${call.toolName}:`, JSON.stringify(call.result, null, 2));
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n⚠️  Please set your OPENAI_API_KEY in a .env file');
    }
  }
}

// Run the example
main().catch(console.error);

// Export agent for use in other modules
export { supportAgent };
