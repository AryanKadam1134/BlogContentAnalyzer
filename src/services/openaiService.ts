/**
 * OpenAI service for generating content insights
 */

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

export async function generateInsights(content: string): Promise<string> {
  // Check if OpenAI API key is configured
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key is not configured. Please add your actual API key to the .env file.');
  }

  if (!content || content.trim().length < 50) {
    throw new Error('Content is too short to analyze. Please provide more substantial content (at least 50 characters).');
  }

  // Limit content length to avoid token limits
  const maxContentLength = 3000;
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...' 
    : content;

  try {
    console.log('Sending request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert content analyst. Analyze the provided content and generate comprehensive insights. Structure your response clearly with these sections:

## Executive Summary
Brief 2-3 sentence overview of the content

## Key Themes
Main topics and concepts covered

## Content Analysis  
Quality, structure, and effectiveness assessment

## Target Audience
Who this content serves

## Key Takeaways
Most important insights and learnings

## Strengths
What works well in this content

## Recommendations
Specific suggestions for improvement

Keep your analysis concise but thorough, focusing on actionable insights.`
          },
          {
            role: 'user',
            content: `Analyze this content:\n\n${truncatedContent}`
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
        }
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check that your API key is correct and has sufficient permissions.');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again. If you\'re on a free plan, you may need to upgrade or wait longer between requests.');
      } else if (response.status === 400) {
        throw new Error('Invalid request to OpenAI API. The content might be too long or contain unsupported characters.');
      } else if (response.status === 403) {
        throw new Error('Access denied to OpenAI API. Please check your API key permissions and billing status.');
      } else {
        throw new Error(errorMessage);
      }
    }

    const data: OpenAIResponse = await response.json();
    
    if (data.error) {
      throw new Error(`OpenAI API error: ${data.error.message}`);
    }
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No insights generated from OpenAI API');
    }

    const insights = data.choices[0].message.content;
    
    if (!insights || insights.trim().length === 0) {
      throw new Error('Empty response from OpenAI API');
    }

    console.log('Successfully generated insights');
    return insights;
    
  } catch (error) {
    console.error('Error generating insights:', error);
    
    if (error instanceof Error) {
      // Re-throw known errors
      throw error;
    }
    
    // Handle network or other unknown errors
    throw new Error('Failed to generate insights. Please check your internet connection and try again.');
  }
}