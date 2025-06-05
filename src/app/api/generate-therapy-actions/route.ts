import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { conversation } = await request.json();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation is required' },
        { status: 400 }
      );
    }

    const prompt = `Based on this therapy session transcript, generate 2-3 actionable items. Format the response as a JSON object with an array of "actions". Each action should have a "title" and "description".

Therapy Session Transcript:
${conversation}

Generate action items that:
1. Are specific and achievable
2. Build on the session's work
3. Support continued progress
4. Include practical next steps

Format the response as a JSON object like this:
{
  "actions": [
    {
      "title": "Action Item Title",
      "description": "Detailed action item description"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful therapy assistant that analyzes therapy sessions and provides actionable next steps. Speak in first person, as if you are the therapist talking to the user directly."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const parsedContent = JSON.parse(content);

    return NextResponse.json(parsedContent);
  } catch (error) {
    console.error('Error generating therapy actions:', error);
    return NextResponse.json(
      { error: 'Failed to generate therapy actions' },
      { status: 500 }
    );
  }
} 