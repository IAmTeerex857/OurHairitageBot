import { Message } from '../types/chat';

// API client for serverless functions
export async function generateHairCareResponse(
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: conversationHistory.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp.toISOString()
        }))
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.response;

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Fallback responses for when API fails
    const fallbackResponses = [
      "I'm having trouble connecting right now, but I'd love to help with your hair care question! Could you try asking again in a moment?",
      "My connection seems to be having issues. In the meantime, remember that healthy hair starts with a good routine and the right products for your hair type!",
      "I'm experiencing some technical difficulties, but I'm here to help! Please try your question again, and I'll do my best to give you great hair advice."
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

// Function to check if the chat API is available
export function isOpenAIConfigured(): boolean {
  // Always return true since we're using serverless functions
  // The API will handle the key validation
  return true;
}