/**
 * Google Gemini service for generating content insights
 */

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export async function generateInsights(content: string): Promise<string> {
  // Check if Gemini API key is configured
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key is not configured. Please add your actual API key to the .env file.');
  }

  if (!content || content.trim().length < 50) {
    throw new Error('Content is too short to analyze. Please provide more substantial content (at least 50 characters).');
  }

  // Limit content length to avoid token limits
  const maxContentLength = 4000;
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...' 
    : content;

  try {
    console.log('Sending request to Gemini API...');
    
    const prompt = `You are an expert content analyst. Analyze the provided content and generate comprehensive insights. Structure your response clearly with these sections:

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

Keep your analysis concise but thorough, focusing on actionable insights.

Content to analyze:
${truncatedContent}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      let errorMessage = `Gemini API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
        }
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      
      if (response.status === 401) {
        throw new Error('Invalid Gemini API key. Please check that your API key is correct and has sufficient permissions.');
      } else if (response.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 400) {
        throw new Error('Invalid request to Gemini API. The content might be too long or contain unsupported characters.');
      } else if (response.status === 403) {
        throw new Error('Access denied to Gemini API. Please check your API key permissions and billing status.');
      } else {
        throw new Error(errorMessage);
      }
    }

    const data: GeminiResponse = await response.json();
    
    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No insights generated from Gemini API');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const insights = candidate.content.parts[0].text;
    
    if (!insights || insights.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }

    console.log('Successfully generated insights with Gemini');
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