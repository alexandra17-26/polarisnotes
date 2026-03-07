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
        summary: `You are taking notes as a focused student who wants to remember what actually matters later (exams, assignments, and decisions).
Create a concise summary of the following transcription that:
- Clearly states the main ideas and conclusions
- Calls out any points the speaker repeats, emphasizes, or labels as important
- Mentions deadlines, next steps, and anything that sounds like it will "be on the test"
Do NOT use markdown formatting (no #, *, **, or any markdown syntax). Use plain text only. For headings, use bold text with **text** format.\n\nTranscription:\n${transcription}`,
        
        detailed: `You are an excellent student sitting in a class or meeting, writing detailed notes you will study from later.
From the transcription below, create detailed, well-organized notes that:
- Follow the flow of the lecture/meeting with clear topic sections
- Capture key definitions, formulas, examples, and explanations
- Explicitly highlight concepts the speaker repeats, spends extra time on, or calls "important", "test material", or similar
- Call out important questions that were answered and any confusions that were clarified
- Include concrete takeaways, follow-ups, and "things to remember" at the end
Write in a natural student-note style (not a formal report). Do NOT use markdown formatting (no #, *, **, or any markdown syntax). Use plain text only. For headings, use bold text with **text** format.\n\nTranscription:\n${transcription}`,
        
        bullet: `You are creating meeting or class notes as a student who wants a clean checklist-style review sheet.
Turn the following transcription into organized bullet point notes that:
- Use clear main bullets with short sub-bullets where helpful
- Group information by topic or section
- Emphasize repeated or strongly stressed points, marking them as important
- Clearly list any to-dos, deadlines, or assignments
Do NOT use markdown formatting (no #, *, **, or any markdown syntax). Use plain text only. Use regular bullet points (•) or dashes (-) for lists.\n\nTranscription:\n${transcription}`,
        
        'action-items': `Extract and list all action items, tasks, decisions, and exam-relevant instructions from the following transcription.
Format them clearly with:
- What needs to be done or remembered
- Who is responsible (if mentioned)
- Any dates, deadlines, or test/quiz references
Do NOT use markdown formatting (no #, *, **, or any markdown syntax). Use plain text only.\n\nTranscription:\n${transcription}`,
        
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
            content: 'You are an expert student note-taker. You listen to classes and meetings and turn them into clear, structured notes that are genuinely useful for studying, revising, and following up on important points.'
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
      let notes = completion.choices[0].message.content;
      
      // Convert markdown headers to bold text, then remove all # characters
      // First, convert headers to bold (### Header -> **Header**)
      notes = notes.replace(/^#{1,6}\s+(.+)$/gm, '**$1**'); // Convert headers at start of lines to bold
      notes = notes.replace(/\s+#{1,6}\s+(.+?)(?=\n|$)/g, ' **$1**'); // Convert headers in middle of lines
      
      // Remove all remaining # characters
      notes = notes.replace(/#/g, '');
      
      // Remove markdown bullet points (*) and convert to plain text
      notes = notes.replace(/^\s*\*\s+/gm, '• '); // Convert * bullets to • bullets
      notes = notes.replace(/^\s*-\s+/gm, '• '); // Convert - bullets to • bullets
      
      // Clean up excessive line breaks
      notes = notes.replace(/\n{3,}/g, '\n\n');
      notes = notes.trim();
      
      return notes;
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
