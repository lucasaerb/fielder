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

    const prompt = `Based on this therapy session transcript, generate 3-4 key insights. Format the response as a JSON object with an array of "insights". Each insight should have a "title" and "description".

Therapy Session Transcript:
${conversation}

Generate insights that:
1. Capture key themes and patterns from the session
2. Highlight emotional or behavioral observations
3. Identify progress or areas of growth
4. Note any significant realizations

Format the response as a JSON object like this:
{
  "insights": [
    {
      "title": "Insight Title",
      "description": "Detailed insight description"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful therapy assistant that analyzes therapy sessions and provides meaningful insights. Speak in first person, as if you are the therapist talking to the user directly."
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
    console.error('Error generating therapy insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate therapy insights' },
      { status: 500 }
    );
  }
} 