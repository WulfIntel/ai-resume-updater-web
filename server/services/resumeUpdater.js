const OpenAI = require('openai');
const config = require('../config');
const { buildRtfcPrompt } = require('./rtfcPromptBuilder');

const openai = new OpenAI({
  apiKey: config.openAiApiKey
});

/**
 * Generate an enhanced resume using OpenAI gpt-4o-mini.
 */
async function generateEnhancedResume({ resumeText, notes, jobDescription }) {
  const { system, user } = buildRtfcPrompt({ resumeText, notes, jobDescription });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.4,
      max_tokens: 900
    });

    const choice = completion.choices && completion.choices[0];
    let text = '';

    if (choice && choice.message && typeof choice.message.content === 'string') {
      text = choice.message.content;
    } else if (choice && Array.isArray(choice.message.content)) {
      // content could be an array of parts; join text parts
      text = choice.message.content
        .map((part) => (typeof part.text === 'string' ? part.text : ''))
        .join('');
    }

    return (text || '').trim();
  } catch (err) {
    console.error('Error generating enhanced resume:', err.message || err);
    throw new Error('Failed to generate enhanced resume. Please try again.');
  }
}

module.exports = { generateEnhancedResume };