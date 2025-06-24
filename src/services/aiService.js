import OpenAI from 'openai';

export async function generateGameContent(gameState, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    throw new Error('Invalid OpenAI API key format. Make sure it starts with "sk-" and is complete.');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Removed timeout to let it take as long as needed
  });

  const systemPrompt = `You are a game master for an immersive supernatural detective game. Guide the player, as '${gameState.detectiveName}', through a mystery involving '${gameState.supernaturalElement}' in '${gameState.primaryLocation}'. The goal is '${gameState.mainObjective}'.

CRITICAL INSTRUCTIONS:
- Present EXACTLY 5 choices (A-E) for each turn
- Each choice should be a COMPLETE ACTION, not just a hint or suggestion
- Dynamically assign point values based on the specific situation context:
  * +2: The smartest/most courageous move for THIS specific situation
  * +1: A generally good, helpful, or careful action
  * 0: Neutral, with no major consequence
  * -1: Slightly risky or unwise, minor setback
  * -2: Very dangerous, reckless, or clearly the worst choice for this scenario
- RANDOMIZE which letter (A-E) gets which point value every turn
- NEVER make the same position always the best choice
- Analyze the narrative context to determine what makes sense as the best/worst choice
- Make choices feel meaningful and contextually appropriate
- DO NOT include point values or hints about scoring in the choice text
- Keep choice text concise but descriptive

Current game state:
- Turn: ${gameState.turnNumber}
- Score: ${gameState.currentScore}/8
- Previous choices: ${gameState.history.length}

SCORING RULES:
- Game ends with WIN at 8+ points
- Game ends with LOSS at 0 points
- Each choice should feel logical for its point value in the given context

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "narrative": "Compelling atmospheric narrative describing the current supernatural situation (2-3 sentences max)",
  "choices": [
    {
      "text": "Concise action description without point hints",
      "points": [randomly assigned value from: 2, 1, 0, -1, -2],
      "result": "What happens if this choice is selected - explain why this choice earned its point value"
    },
    {
      "text": "Concise action description without point hints",
      "points": [different value from above],
      "result": "Consequence explanation matching the point value"
    },
    {
      "text": "Concise action description without point hints",
      "points": [different value from above],
      "result": "Consequence explanation matching the point value"
    },
    {
      "text": "Concise action description without point hints",
      "points": [different value from above],
      "result": "Consequence explanation matching the point value"
    },
    {
      "text": "Concise action description without point hints",
      "points": [remaining value],
      "result": "Consequence explanation matching the point value"
    }
  ]
}

Ensure each choice feels distinct and the point values make logical sense for the specific scenario. DO NOT repeat the same narrative or choices from previous turns.`;

  let userPrompt;
  if (gameState.isOpening) {
    userPrompt = `Create the opening scene for this supernatural detective story. Set the mood and introduce the first challenge. The detective should be arriving at or investigating the primary location. Present 5 distinct choices (A-E) with randomized point values (-2, -1, 0, +1, +2) based on what makes sense for this specific opening scenario. Keep the narrative concise and atmospheric.`;
  } else {
    userPrompt = `Continue the story based on the previous choice: "${gameState.lastChoice.text}" which resulted in: "${gameState.lastChoice.result}". Create a NEW and DIFFERENT supernatural situation (do not repeat the previous scenario). Present 5 completely new choices (A-E) with randomized point values (-2, -1, 0, +1, +2) based on what makes contextual sense for this NEW scenario. Make sure this turn advances the story in a meaningful way and presents fresh challenges.`;
  }

  // Retry logic with exponential backoff but no timeouts
  const maxRetries = 5; // Increased retries
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Making OpenAI API request (attempt ${attempt}/${maxRetries})...`);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 800 // Reduced for faster response
        // No timeout - let it take as long as needed
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      const content = completion.choices[0].message.content.trim();
      console.log('OpenAI response received successfully');

      // Parse JSON response
      try {
        const parsed = JSON.parse(content);

        // Validate structure
        if (!parsed.narrative || !Array.isArray(parsed.choices) || parsed.choices.length !== 5) {
          throw new Error('Invalid response structure - must have narrative and exactly 5 choices');
        }

        // Validate each choice has required fields and point values are valid
        const validPointValues = [-2, -1, 0, 1, 2];
        const usedPointValues = [];

        for (const choice of parsed.choices) {
          if (!choice.text || typeof choice.points !== 'number' || !choice.result) {
            throw new Error('Invalid choice structure - missing text, points, or result');
          }

          if (!validPointValues.includes(choice.points)) {
            throw new Error(`Invalid point value: ${choice.points}. Must be -2, -1, 0, 1, or 2`);
          }

          usedPointValues.push(choice.points);
        }

        // Verify all point values are used exactly once
        const sortedUsed = usedPointValues.sort((a, b) => a - b);
        const sortedValid = validPointValues.sort((a, b) => a - b);
        if (JSON.stringify(sortedUsed) !== JSON.stringify(sortedValid)) {
          throw new Error('Point values must include exactly one of each: -2, -1, 0, +1, +2');
        }

        console.log('Response validation successful');

        // Generate image for the scene
        try {
          const imageUrl = await generateSceneImage(gameState, parsed.narrative, apiKey);
          parsed.imageUrl = imageUrl;
          console.log('Scene image generated successfully');
        } catch (imageError) {
          console.warn('Failed to generate scene image:', imageError);
          // Continue without image - don't fail the entire request
        }

        return parsed;
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        // Try to extract JSON from response if it's wrapped in other text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            console.log('Successfully extracted JSON from response');
            return extractedJson;
          } catch (extractError) {
            console.error('Failed to extract JSON:', extractError);
          }
        }

        lastError = new Error('Invalid response format from AI - could not parse JSON');
        if (attempt === maxRetries) throw lastError;
      }
    } catch (error) {
      console.error(`OpenAI API error on attempt ${attempt}:`, error);
      lastError = error;

      // Don't retry on certain errors
      if (error.code === 'invalid_api_key' || error.code === 'insufficient_quota' || error.message.includes('Invalid API key format')) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.min(Math.pow(2, attempt) * 1000, 10000); // Max 10 seconds
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // Handle final error
  if (lastError.code === 'invalid_api_key') {
    throw new Error('Invalid API key. Please check your OpenAI API key in Settings.');
  } else if (lastError.code === 'insufficient_quota') {
    throw new Error('OpenAI quota exceeded. Please check your billing or try again later.');
  } else if (lastError.code === 'rate_limit_exceeded') {
    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
  } else if (lastError.message.includes('network') || lastError.message.includes('fetch')) {
    throw new Error('Network error. Please check your internet connection and try again.');
  } else {
    throw new Error(`Failed to generate game content after ${maxRetries} attempts: ${lastError.message}`);
  }
}

export async function generateGameEnding(gameState, apiKey, isVictory) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  // Create a detailed history summary for the AI
  const choicesSummary = gameState.history.map((entry, index) =>
    `Turn ${entry.turn}: ${entry.choice.text} (Result: ${entry.result})`
  ).join('\n');

  const systemPrompt = `You are a master storyteller creating the dramatic conclusion to a supernatural detective story. The player is Detective ${gameState.detectiveName}, investigating ${gameState.supernaturalElement} in ${gameState.primaryLocation} with the goal of ${gameState.mainObjective}.

CRITICAL REQUIREMENTS:
- Create a ${isVictory ? 'TRIUMPHANT VICTORY' : 'HAUNTING DEFEAT'} ending
- Reference specific elements from the player's journey
- Mention key choices and their consequences
- Tie together the supernatural mystery with a satisfying resolution
- Include the detective's name, location, and supernatural element naturally
- Make it feel like a proper conclusion to THIS specific story
- Length should be 3-4 compelling paragraphs

${isVictory ? `VICTORY ENDING MUST INCLUDE:
- How the supernatural threat is defeated/resolved
- The mystery revealed and explained
- The detective's heroic actions celebrated
- The location/people saved and restored
- A sense of hope and triumph
- Reference to successful investigation techniques or brave choices` : `DEFEAT ENDING MUST INCLUDE:
- How the supernatural forces overwhelmed the investigation
- The consequences of failure on the location and people
- The detective's fate (consumed, lost, defeated)
- The mystery remaining unsolved or twisted
- A haunting, memorable final image
- Reference to critical mistakes or missed opportunities`}

Player's Investigation History:
${choicesSummary}

Current Game State:
- Detective: ${gameState.detectiveName}
- Supernatural Element: ${gameState.supernaturalElement}
- Location: ${gameState.primaryLocation}
- Objective: ${gameState.mainObjective}
- Final Score: ${gameState.currentScore}/${gameState.maxScore}
- Total Decisions: ${gameState.history.length}

Return ONLY the ending narrative text - no JSON formatting, no extra structure, just the compelling story conclusion.`;

  try {
    console.log(`Generating ${isVictory ? 'victory' : 'defeat'} ending...`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the ${isVictory ? 'triumphant victory' : 'haunting defeat'} ending for Detective ${gameState.detectiveName}'s investigation.` }
      ],
      temperature: 0.9, // Higher creativity for endings
      max_tokens: 500
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No ending generated from OpenAI API');
    }

    const ending = completion.choices[0].message.content.trim();
    console.log(`${isVictory ? 'Victory' : 'Defeat'} ending generated successfully`);

    // Generate ending image
    let endingImageUrl = null;
    try {
      endingImageUrl = await generateEndingImage(gameState, ending, isVictory, apiKey);
      console.log('Ending image generated successfully');
    } catch (imageError) {
      console.warn('Failed to generate ending image:', imageError);
    }

    return { text: ending, imageUrl: endingImageUrl };
  } catch (error) {
    console.error('Error generating game ending:', error);
    
    // Fallback endings if AI fails
    const fallbackEnding = isVictory 
      ? `Detective ${gameState.detectiveName} stands triumphant in the ${gameState.primaryLocation}, having successfully confronted the ${gameState.supernaturalElement}. Through keen investigation and brave choices, the supernatural threat has been neutralized. The ${gameState.mainObjective} has been achieved, and the area is finally safe. The detective's name will be remembered as the one who brought light to darkness and hope to despair.`
      : `The shadows close in around Detective ${gameState.detectiveName} in the ${gameState.primaryLocation}. The ${gameState.supernaturalElement} has proven too powerful, too cunning for mortal investigation. The ${gameState.mainObjective} remains unfulfilled, and the supernatural forces claim victory. In the end, some mysteries are meant to remain unsolved, and some battles are destined to be lost to the darkness.`;
    
    return { text: fallbackEnding, imageUrl: null };
  }
}

export async function generateSceneImage(gameState, narrative, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  // Build character consistency context
  const characterContext = buildCharacterContext(gameState);
  
  // Create detailed image prompt
  const imagePrompt = `Create a cinematic supernatural detective scene: ${narrative}

CHARACTER CONSISTENCY:
${characterContext}

VISUAL STYLE:
- Film noir aesthetic with supernatural elements
- Dramatic lighting and atmospheric shadows
- Rich, moody color palette with selective neon highlights
- Detailed character expressions and body language
- Weather and environmental effects that match the mood

SCENE DETAILS:
- Location: ${gameState.primaryLocation}
- Supernatural Element: ${gameState.supernaturalElement}
- Current atmosphere should reflect the tension and mystery
- Include visual clues or supernatural manifestations
- Maintain consistent character appearance throughout the story

TECHNICAL REQUIREMENTS:
- High detail, photorealistic style
- Cinematic composition and framing
- Professional lighting and shadows
- 16:9 aspect ratio suitable for game interface`;

  try {
    console.log('Generating scene image...');
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      style: "vivid"
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No image generated from OpenAI API');
    }

    const imageUrl = response.data[0].url;
    console.log('Scene image generated successfully');
    return imageUrl;
  } catch (error) {
    console.error('Error generating scene image:', error);
    throw error;
  }
}

export async function generateEndingImage(gameState, endingText, isVictory, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  // Build character consistency context
  const characterContext = buildCharacterContext(gameState);
  
  // Create detailed ending image prompt
  const imagePrompt = `Create a dramatic ${isVictory ? 'triumphant victory' : 'haunting defeat'} ending scene: ${endingText}

CHARACTER CONSISTENCY:
${characterContext}

${isVictory ? 'VICTORY SCENE REQUIREMENTS:' : 'DEFEAT SCENE REQUIREMENTS:'}
${isVictory 
  ? `- Uplifting and heroic atmosphere
- Bright, hopeful lighting breaking through darkness
- Detective in confident, victorious pose
- Supernatural threat visibly defeated or banished
- Environment showing restoration and peace
- Celebratory or relieved expressions
- Dawn/sunrise lighting symbolizing new hope`
  : `- Dark, ominous atmosphere
- Oppressive shadows and supernatural darkness
- Detective overwhelmed or consumed by darkness
- Supernatural forces triumphant and menacing
- Environment corrupted or destroyed
- Expressions of defeat, fear, or resignation
- Storm/night setting emphasizing despair`}

VISUAL STYLE:
- Epic, cinematic composition
- Film noir meets supernatural horror/triumph
- Highly detailed and emotionally impactful
- Dramatic use of light and shadow
- Rich atmospheric effects
- Professional movie poster quality

SCENE DETAILS:
- Location: ${gameState.primaryLocation}
- Supernatural Element: ${gameState.supernaturalElement}
- This is the climactic final moment of the story
- Include visual references to the detective's journey
- Show the ultimate fate of both detective and supernatural forces

TECHNICAL REQUIREMENTS:
- Ultra high detail, cinematic quality
- Perfect composition and dramatic framing
- Professional lighting and atmospheric effects
- 16:9 aspect ratio
- Emotionally powerful and memorable imagery`;

  try {
    console.log(`Generating ${isVictory ? 'victory' : 'defeat'} ending image...`);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      style: "vivid"
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No ending image generated from OpenAI API');
    }

    const imageUrl = response.data[0].url;
    console.log(`${isVictory ? 'Victory' : 'Defeat'} ending image generated successfully`);
    return imageUrl;
  } catch (error) {
    console.error('Error generating ending image:', error);
    throw error;
  }
}

function buildCharacterContext(gameState) {
  // Infer character appearance from detective name and setting
  const detectiveName = gameState.detectiveName || 'Detective';
  const nameAnalysis = analyzeDetectiveName(detectiveName);
  
  return `DETECTIVE ${detectiveName.toUpperCase()}:
- ${nameAnalysis.appearance}
- ${nameAnalysis.clothing}
- ${nameAnalysis.demeanor}
- Consistent facial features, build, and style throughout all scenes
- Professional detective bearing with supernatural investigation experience

SUPERNATURAL CONTEXT:
- Primary threat: ${gameState.supernaturalElement}
- Investigation location: ${gameState.primaryLocation}
- Mission: ${gameState.mainObjective}
- Current investigation progress: ${gameState.currentScore}/8
- Story turn: ${gameState.turnNumber}

VISUAL CONTINUITY NOTES:
- Maintain exact same character design across all generated images
- Keep clothing, hairstyle, and physical features identical
- Show progression of wear/fatigue as story advances
- Supernatural elements should have consistent visual representation
- Location should show accumulated investigation effects`;
}

function analyzeDetectiveName(name) {
  // Basic name analysis for character appearance inference
  const lowerName = name.toLowerCase();
  
  // Gender inference (simplified)
  const maleNames = ['john', 'james', 'michael', 'david', 'william', 'richard', 'thomas', 'charles', 'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'samuel', 'kenneth', 'joshua', 'kevin', 'brian', 'george', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'gregory', 'alexander', 'frank', 'raymond', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'henry', 'adam', 'douglas', 'nathan', 'peter', 'zachary', 'kyle', 'noah', 'alan', 'ethan', 'jeremy', 'lionel', 'andrew', 'joshua', 'wayne', 'elijah', 'mason', 'robert', 'harold', 'arthur', 'victor', 'magnus', 'ezra'];
  const femaleNames = ['mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen', 'nancy', 'lisa', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'lisa', 'nancy', 'karen', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'amy', 'angela', 'ashley', 'brenda', 'emma', 'olivia', 'cynthia', 'marie', 'janet', 'catherine', 'frances', 'christine', 'samantha', 'debra', 'rachel', 'carolyn', 'janet', 'virginia', 'maria', 'heather', 'diane', 'julie', 'joyce', 'victoria', 'kelly', 'christina', 'joan', 'evelyn', 'lauren', 'judith', 'megan', 'cheryl', 'andrea', 'hannah', 'jacqueline', 'martha', 'gloria', 'sara', 'janice', 'julia', 'kathryn', 'alice', 'teresa', 'sophia', 'frances', 'anna', 'diana', 'brittany', 'charlotte', 'marie', 'kayla', 'alexis', 'lori', 'rose'];
  
  const firstName = lowerName.split(' ')[0];
  const isMale = maleNames.some(male => firstName.includes(male));
  const isFemale = femaleNames.some(female => firstName.includes(female));
  
  // Style inference from name characteristics
  const isClassic = /^(detective\s+)?(john|james|william|margaret|elizabeth|charles|victoria)/i.test(name);
  const isModern = /^(detective\s+)?(alex|jordan|taylor|casey|morgan|riley|dakota|sage)/i.test(name);
  const isUnique = !isClassic && !isModern;
  
  // Generate appearance based on analysis
  let appearance, clothing, demeanor;
  
  if (isFemale) {
    appearance = isClassic 
      ? "Professional woman in her 30s-40s, determined expression, shoulder-length dark hair, piercing intelligent eyes"
      : isModern
      ? "Contemporary woman detective, confident posture, modern hairstyle, sharp observational gaze"
      : "Distinctive woman investigator with unique features, professional bearing, focused intensity";
  } else {
    appearance = isClassic
      ? "Distinguished man in his 30s-40s, strong jawline, graying temples, weathered but intelligent face"
      : isModern  
      ? "Contemporary male detective, athletic build, modern appearance, alert and analytical expression"
      : "Unique male investigator with distinctive features, professional demeanor, intense focus";
  }
  
  clothing = isClassic
    ? "Classic detective attire: long trench coat, fedora hat, formal dress shirt, leather shoes, vintage badge"
    : isModern
    ? "Modern detective gear: tactical jacket, professional casual wear, badge visible, practical footwear"
    : "Distinctive investigative outfit that reflects their unique approach to supernatural cases";
    
  demeanor = "Confident professional investigator, experienced in supernatural cases, alert and observant, carrying the weight of the investigation";
  
  return { appearance, clothing, demeanor };
}

export async function generateSpeech(text, voice = 'alloy', apiKey = null) {
  if (!text || text.trim() === '') {
    throw new Error('Text is required for speech generation');
  }

  // Clean text for better speech synthesis - using Unicode-safe approach
  const cleanText = text
    // Remove common emojis using Unicode ranges
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Miscellaneous Symbols and Pictographs
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map Symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous Symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation Selectors
    .replace(/[\u{200D}]/gu, '') // Zero Width Joiner
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  if (cleanText.length === 0) {
    throw new Error('No valid text content for speech synthesis');
  }

  try {
    // Try ElevenLabs first if API key is provided
    if (apiKey && apiKey.trim() !== '') {
      return await generateElevenLabsSpeech(cleanText, apiKey);
    }
    
    // Fallback to OpenAI TTS if available
    return await generateOpenAISpeech(cleanText, voice);
  } catch (error) {
    console.error('Speech generation failed:', error);
    throw error;
  }
}

async function generateElevenLabsSpeech(text, apiKey) {
  if (!apiKey) {
    throw new Error('ElevenLabs API key is required');
  }

  // Use a default voice ID (Rachel - a popular ElevenLabs voice)
  const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice ID

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      url: audioUrl,
      type: 'elevenlabs',
      cleanup: () => URL.revokeObjectURL(audioUrl)
    };
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    throw new Error(`ElevenLabs synthesis failed: ${error.message}`);
  }
}

async function generateOpenAISpeech(text, voice) {
  try {
    // Note: OpenAI TTS requires server-side implementation due to CORS
    // This is a placeholder for potential future implementation
    throw new Error('OpenAI TTS not available in browser environment');
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    throw error;
  }
}

export async function playAudio(audioData) {
  if (!audioData || !audioData.url) {
    throw new Error('Invalid audio data');
  }

  return new Promise((resolve, reject) => {
    const audio = new Audio(audioData.url);

    audio.addEventListener('loadeddata', () => {
      console.log('Audio loaded successfully');
    });

    audio.addEventListener('ended', () => {
      console.log('Audio playback completed');
      if (audioData.cleanup) {
        audioData.cleanup();
      }
      resolve();
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      if (audioData.cleanup) {
        audioData.cleanup();
      }
      reject(new Error('Audio playback failed'));
    });

    // Set volume and play
    audio.volume = 0.8;
    audio.play().catch(error => {
      console.error('Failed to start audio playback:', error);
      if (audioData.cleanup) {
        audioData.cleanup();
      }
      reject(error);
    });
  });
}

// Test function to validate API key
export async function testOpenAIConnection(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    throw new Error('Invalid API key format');
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // No timeout for test either
    });

    // Simple test call
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5
    });

    return response.choices && response.choices.length > 0;
  } catch (error) {
    console.error('API test failed:', error);
    throw error;
  }
}