import OpenAI from 'openai';
import fs from 'fs-extra';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function transcribeAudio(filePath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Starting transcription... (attempt ${attempt}/${retries})`);
      
      const fileStream = fs.createReadStream(filePath);
      
      const transcription = await openai.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
        response_format: 'text'
      });

      console.log('Transcription completed, length:', transcription?.length || 0);
      return transcription;
    } catch (error) {
      console.error(`Transcription error (attempt ${attempt}/${retries}):`, error);
      console.error('Error code:', error.code);
      console.error('Error type:', error.type);
      console.error('Error message:', error.message);
      console.error('Error cause:', error.cause);
      
      // If it's a connection error and we have retries left, wait and retry
      const isConnectionError = error.code === 'ECONNRESET' || 
                                 error.message?.includes('Connection') || 
                                 error.type === 'system' ||
                                 error.cause?.code === 'ECONNRESET' ||
                                 error.cause?.errno === 'ECONNRESET';
      
      if (isConnectionError && attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Connection error detected. Retrying in ${waitTime/1000} seconds...`);
        await sleep(waitTime);
        continue;
      }
      
      // Check for quota/billing errors
      if (error.status === 429 && error.error?.code === 'insufficient_quota') {
        throw new Error('You have exceeded your OpenAI API quota. Please add credits to your account at https://platform.openai.com/account/billing');
      }
      
      // If no more retries or it's a different error, throw
      const errorMsg = isConnectionError 
        ? 'Connection error. Please check your internet connection and try again.'
        : error.message || 'Failed to transcribe audio.';
      throw new Error(`Failed to transcribe audio: ${errorMsg}`);
    }
  }
}

export async function generateNotes(transcription, mode = 'detailed', retries = 3, customPrompt = null) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Generating notes, mode: ${mode} (attempt ${attempt}/${retries})`);
      
      const prompts = {
        summary: `Create a concise summary of the following transcription. Focus on the main points and key takeaways. Keep it brief and to the point.\n\nTranscription:\n${transcription}`,
        
        detailed: `Create detailed notes from the following transcription. Include context, explanations, and important details. Organize the information logically.\n\nTranscription:\n${transcription}`,
        
        bullet: `Create organized bullet point notes from the following transcription. Structure them clearly with main points and sub-points. Perfect for meeting notes.\n\nTranscription:\n${transcription}`,
        
        'action-items': `Extract and list all action items, tasks, and decisions from the following transcription. Format them clearly with who is responsible (if mentioned) and deadlines (if mentioned).\n\nTranscription:\n${transcription}`,
        
        transcript: transcription
      };

      if (mode === 'transcript') {
        return transcription;
      }

      // Use custom prompt if provided
      const finalPrompt = customPrompt 
        ? customPrompt.replace('{transcription}', transcription)
        : prompts[mode] || prompts.detailed;

      console.log('Calling OpenAI API...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert note-taking assistant. Create well-structured, clear, and useful notes from transcriptions.'
          },
          {
            role: 'user',
            content: finalPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      console.log('Notes generated successfully');
      return completion.choices[0].message.content;
    } catch (error) {
      console.error(`Note generation error (attempt ${attempt}/${retries}):`, error.message || error);
      
      // If it's a connection error and we have retries left, wait and retry
      const isConnectionError = error.code === 'ECONNRESET' || 
                                 error.message?.includes('Connection') || 
                                 error.type === 'system' ||
                                 error.cause?.code === 'ECONNRESET';
      
      if (isConnectionError && attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Connection error detected. Retrying in ${waitTime/1000} seconds...`);
        await sleep(waitTime);
        continue;
      }
      
      // Check for quota/billing errors
      if (error.status === 429 && error.error?.code === 'insufficient_quota') {
        throw new Error('You have exceeded your OpenAI API quota. Please add credits to your account at https://platform.openai.com/account/billing');
      }
      
      // If no more retries or it's a different error, throw
      const errorMsg = isConnectionError 
        ? 'Connection error. Please check your internet connection and try again.'
        : error.message || 'Failed to generate notes. Please check your API key and account credits.';
      throw new Error(`Failed to generate notes: ${errorMsg}`);
    }
  }
}

export async function generateInsights(transcription, notes) {
  try {
    console.log('Generating insights...');
    
    const prompt = `Analyze the following transcription and notes. Extract and return a JSON object with:
1. "topics" - array of main topics discussed
2. "action_items" - array of action items with format: {task: "...", assignee: "...", deadline: "..."}
3. "dates" - array of important dates mentioned
4. "key_points" - array of 3-5 key points

Transcription: ${transcription.substring(0, 2000)}
Notes: ${notes.substring(0, 2000)}

Return ONLY valid JSON, no other text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing text and extracting structured information. Always return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const insights = JSON.parse(completion.choices[0].message.content);
    console.log('Insights generated successfully');
    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    return null;
  }
}
