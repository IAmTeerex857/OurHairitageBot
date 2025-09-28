import { VercelRequest, VercelResponse } from '@vercel/node';
import { AzureOpenAI } from 'openai';

const envs = process.env.OPENAI_API_ENVS

function getEnvs () {
  try {
    return JSON.parse(envs ?? '{}')
  } catch {
    return {}
  }
}

// Initialize OpenAI client with server-side API key
const openai = new AzureOpenAI(getEnvs());

// System prompt for hair care expertise
const HAIR_CARE_SYSTEM_PROMPT = `You are "OUR HAIRITAGE", an expert hair care consultant and stylist with deep knowledge in:

- Hair care routines and product recommendations
- Hair styling techniques and trends
- Hair health, damage repair, and treatments
- Hair color and chemical processes
- Different hair types, textures, and porosity
- Scalp health and hair growth
- Natural and professional hair treatments

Your personality:
- Warm, friendly, and encouraging
- Professional yet approachable
- Passionate about helping people achieve their best hair
- Knowledgeable about diverse hair needs and cultural practices
- Always ask follow-up questions to give personalized advice

Guidelines:
- Keep responses conversational and helpful
- Ask for specifics about hair type, concerns, or goals when relevant
- Provide practical, actionable advice
- Mention when professional consultation might be needed
- Be inclusive of all hair types and textures
- Focus on hair health and realistic expectations

Remember: You're helping people discover their hair's true potential!`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  message: string;
  conversationHistory: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [] }: RequestBody = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!envs) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Build conversation context
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: HAIR_CARE_SYSTEM_PROMPT
      }
    ];

    // Add conversation history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using cost-effective model
      messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response generated');
    }

    return res.status(200).json({
      response,
      usage: completion.usage
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);

    // Return fallback response for errors
    const fallbackResponses = [
      "I'm having trouble connecting right now, but I'd love to help with your hair care question! Could you try asking again in a moment?",
      "My connection seems to be having issues. In the meantime, remember that healthy hair starts with a good routine and the right products for your hair type!",
      "I'm experiencing some technical difficulties, but I'm here to help! Please try your question again, and I'll do my best to give you great hair advice."
    ];

    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    return res.status(200).json({
      response: fallbackResponse,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
