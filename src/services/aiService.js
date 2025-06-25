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
    dangerouslyAllowBrowser: true
  });

  // Build comprehensive story context for narrative continuity
  const storyContext = buildStoryContext(gameState);

  const systemPrompt = `You are a master storyteller creating a CONTINUOUS supernatural detective narrative. You must maintain absolute story continuity by building directly upon ALL previous events, choices, and consequences.

DETECTIVE: ${gameState.detectiveName}
SUPERNATURAL THREAT: ${gameState.supernaturalElement}
LOCATION: ${gameState.primaryLocation}
MISSION: ${gameState.mainObjective}

${storyContext.length > 0 ? `STORY CONTINUITY CONTEXT:
${storyContext}

CRITICAL: The next scene MUST directly reference and build upon the most recent outcome. Show the immediate consequences of the last choice in the environment, character state, or situation.` : ''}

NARRATIVE RULES:
1. **DIRECT CONTINUITY**: Start the next scene showing the immediate aftermath of the previous choice's result
2. **CUMULATIVE CONSEQUENCES**: Reference multiple past events to show how they've shaped the current situation
3. **CHARACTER DEVELOPMENT**: Show how previous experiences have affected the detective's mental/physical state
4. **ENVIRONMENTAL PROGRESSION**: Locations should reflect the cumulative impact of all previous choices
5. **ESCALATING TENSION**: Each scene should build upon previous supernatural encounters

CHOICE DESIGN PRINCIPLES:
- Present EXACTLY 5 choices (A-E) that feel natural to the current situation
- Each choice should be a COMPLETE ACTION with clear intent
- Assign point values (-2, -1, 0, +1, +2) based on strategic value for THIS specific scenario
- RANDOMIZE which letter gets which point value
- Make consequences feel earned and meaningful
- Ensure choices advance the overarching investigation

SCORING CONTEXT:
- Current Score: ${gameState.currentScore}/${gameState.maxScore}
- Turn: ${gameState.turnNumber}
- Game ends at 8+ points (Victory) or 0 points (Defeat)

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "narrative": "2-3 sentences that DIRECTLY continue from the previous scene's outcome, showing immediate consequences and setting up the current challenge",
  "choices": [
    {
      "text": "Clear, actionable choice without point hints",
      "points": [random value: 2, 1, 0, -1, or -2],
      "result": "Specific consequence that will directly influence the next scene - explain immediate and potential long-term effects"
    },
    {
      "text": "Clear, actionable choice without point hints", 
      "points": [different value],
      "result": "Specific consequence with clear story implications"
    },
    {
      "text": "Clear, actionable choice without point hints",
      "points": [different value], 
      "result": "Specific consequence with clear story implications"
    },
    {
      "text": "Clear, actionable choice without point hints",
      "points": [different value],
      "result": "Specific consequence with clear story implications"
    },
    {
      "text": "Clear, actionable choice without point hints",
      "points": [remaining value],
      "result": "Specific consequence with clear story implications"
    }
  ]
}

The narrative must feel like the next chapter of the same continuous story, not a disconnected scene.`;

  let userPrompt;
  if (gameState.isOpening) {
    userPrompt = `Create the opening scene where Detective ${gameState.detectiveName} first encounters the ${gameState.supernaturalElement} threat in ${gameState.primaryLocation}. Set up the investigation with an immediate supernatural challenge that demands action. Present 5 choices with randomized point values that establish the detective's initial approach to this case.`;
  } else {
    // Build detailed continuation prompt with recent context
    const lastChoice = gameState.lastChoice;
    const recentHistory = gameState.history.slice(-2); // Last 2 turns for immediate context
    
    userPrompt = `CONTINUATION REQUIREMENT: The previous scene ended with this outcome: "${lastChoice.result}"

IMMEDIATE CONSEQUENCE: Show how this outcome has DIRECTLY changed the situation. If the detective made a mistake, show the immediate danger or setback. If they succeeded, show the advantage gained.

${recentHistory.length > 0 ? `RECENT CONTEXT:
${recentHistory.map(entry => `Turn ${entry.turn}: ${entry.choice.text} → ${entry.result}`).join('\n')}` : ''}

Create the next scene that DIRECTLY follows from "${lastChoice.result}". The narrative must:
1. Start by showing the immediate aftermath of this result
2. Reference how past choices have shaped the current situation
3. Present a new challenge that builds on previous events
4. Offer 5 choices that feel natural given what just happened

The detective should feel the weight of their previous decisions in this moment.`;
  }

  // Enhanced retry logic for content generation
  const maxRetries = 5;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating continuous narrative (attempt ${attempt}/${maxRetries})...`);

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1000 // Increased for richer narrative context
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      const content = completion.choices[0].message.content.trim();
      console.log('Continuous narrative generated successfully');

      // Parse and validate JSON response
      let parsed = parseAndValidateResponse(content);

      // Validate narrative continuity
      if (!gameState.isOpening && gameState.lastChoice) {
        validateNarrativeContinuity(parsed.narrative, gameState.lastChoice.result);
      }

      console.log('Narrative continuity validation passed');

      // Generate contextual scene image
      try {
        console.log('Generating contextual scene image...');
        const imageUrl = await generateContextualSceneImage(gameState, parsed.narrative, apiKey);
        parsed.imageUrl = imageUrl;
        console.log('Contextual scene image generated successfully');
      } catch (imageError) {
        console.error('Failed to generate scene image:', imageError);
        parsed.imageUrl = null;
        console.warn('Continuing without scene image');
      }

      return parsed;

    } catch (error) {
      console.error(`Narrative generation error on attempt ${attempt}:`, error);
      lastError = error;

      // Don't retry on certain errors
      if (error.code === 'invalid_api_key' || error.code === 'insufficient_quota' || error.message.includes('Invalid API key format')) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.min(Math.pow(2, attempt) * 1000, 10000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // Handle final error with enhanced context
  throw new Error(`Failed to generate continuous narrative after ${maxRetries} attempts: ${lastError.message}`);
}

// Build comprehensive story context for AI
function buildStoryContext(gameState) {
  if (!gameState.history || gameState.history.length === 0) {
    return '';
  }

  const contextParts = [];

  // Add story progression summary
  contextParts.push(`INVESTIGATION PROGRESS: Turn ${gameState.turnNumber}, Score ${gameState.currentScore}/${gameState.maxScore}`);

  // Add recent narrative flow (last 3 turns for context)
  const recentHistory = gameState.history.slice(-3);
  if (recentHistory.length > 0) {
    contextParts.push('\nRECENT STORY FLOW:');
    recentHistory.forEach(entry => {
      contextParts.push(`Turn ${entry.turn}: "${entry.choice.text}"`);
      contextParts.push(`→ Outcome: ${entry.result}`);
      contextParts.push(`→ Impact: ${getScoreImpactText(entry.scoreChange)}`);
    });
  }

  // Add cumulative consequences
  const consequences = analyzeCumulativeConsequences(gameState.history);
  if (consequences.length > 0) {
    contextParts.push('\nCUMULATIVE STORY EFFECTS:');
    contextParts.push(consequences.join('\n'));
  }

  // Add detective's current state
  const detectiveState = analyzeDetectiveState(gameState);
  contextParts.push(`\nDETECTIVE'S CURRENT STATE: ${detectiveState}`);

  return contextParts.join('\n');
}

// Analyze cumulative consequences across the story
function analyzeCumulativeConsequences(history) {
  const consequences = [];
  
  // Track significant choices and their lasting effects
  const significantEvents = history.filter(entry => Math.abs(entry.scoreChange) >= 2);
  
  if (significantEvents.length > 0) {
    const excellentChoices = significantEvents.filter(e => e.scoreChange === 2);
    const terribleChoices = significantEvents.filter(e => e.scoreChange === -2);
    
    if (excellentChoices.length > 0) {
      consequences.push(`- Detective has made ${excellentChoices.length} excellent decision(s), building confidence and supernatural insight`);
    }
    
    if (terribleChoices.length > 0) {
      consequences.push(`- Detective has made ${terribleChoices.length} terrible mistake(s), facing increased danger and supernatural opposition`);
    }
  }

  // Analyze investigation momentum
  const recentChoices = history.slice(-3);
  const recentScore = recentChoices.reduce((sum, entry) => sum + entry.scoreChange, 0);
  
  if (recentScore >= 3) {
    consequences.push('- Investigation momentum is strong, supernatural forces are being pushed back');
  } else if (recentScore <= -3) {
    consequences.push('- Investigation is faltering, supernatural forces are gaining power');
  }

  return consequences;
}

// Analyze detective's psychological and physical state
function analyzeDetectiveState(gameState) {
  const score = gameState.currentScore;
  const maxScore = gameState.maxScore;
  const progress = score / maxScore;

  if (progress >= 0.8) {
    return 'Confident and determined, close to solving the case, supernatural threats are weakening';
  } else if (progress >= 0.6) {
    return 'Experienced and capable, making good progress, supernatural resistance is noticeable';
  } else if (progress >= 0.4) {
    return 'Cautious but persistent, facing significant challenges, supernatural forces are testing them';
  } else if (progress >= 0.2) {
    return 'Struggling against mounting supernatural pressure, mistakes are taking their toll';
  } else {
    return 'Desperate and overwhelmed, supernatural forces are dominating, danger is imminent';
  }
}

// Get descriptive text for score changes
function getScoreImpactText(scoreChange) {
  switch (scoreChange) {
    case 2: return 'Major breakthrough, supernatural advantage gained';
    case 1: return 'Positive progress, investigation advancing';
    case 0: return 'Neutral outcome, situation unchanged';
    case -1: return 'Minor setback, supernatural pressure increased';
    case -2: return 'Serious mistake, supernatural forces strengthened';
    default: return 'Unknown impact';
  }
}

// Enhanced JSON parsing with better error handling
function parseAndValidateResponse(content) {
  let parsed;
  
  try {
    parsed = JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    
    // Try to extract JSON from response if it's wrapped in other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
        console.log('Successfully extracted JSON from response');
      } catch (extractError) {
        throw new Error('Invalid response format from AI - could not parse JSON');
      }
    } else {
      throw new Error('Invalid response format from AI - no JSON found');
    }
  }

  // Validate response structure
  if (!parsed.narrative || !Array.isArray(parsed.choices) || parsed.choices.length !== 5) {
    throw new Error('Invalid response structure - must have narrative and exactly 5 choices');
  }

  // Validate each choice
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

  return parsed;
}

// Validate narrative continuity
function validateNarrativeContinuity(narrative, lastResult) {
  // Check if narrative references or builds upon the last result
  const narrativeLower = narrative.toLowerCase();
  const lastResultLower = lastResult.toLowerCase();
  
  // Extract key concepts from the last result
  const keyWords = extractKeyWords(lastResultLower);
  
  // Check if any key concepts are referenced in the new narrative
  const hasReference = keyWords.some(word => 
    narrativeLower.includes(word) || 
    semanticallyRelated(narrativeLower, word)
  );

  if (!hasReference && lastResult.length > 20) {
    console.warn('Potential narrative discontinuity detected - new scene may not reference previous outcome');
    // Don't throw error, but log warning for monitoring
  }
}

// Extract key words from result text
function extractKeyWords(text) {
  // Remove common words and extract meaningful terms
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'];
  
  return text
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 5); // Top 5 key words
}

// Check semantic relationship between narrative and key concepts
function semanticallyRelated(narrative, keyWord) {
  // Simple semantic checking - can be enhanced with more sophisticated NLP
  const relatedTerms = {
    'mirror': ['reflection', 'glass', 'surface', 'image'],
    'door': ['entrance', 'exit', 'threshold', 'portal'],
    'shadow': ['darkness', 'dark', 'shade', 'silhouette'],
    'sound': ['noise', 'echo', 'whisper', 'voice'],
    'light': ['glow', 'bright', 'illumination', 'shine']
  };

  const related = relatedTerms[keyWord] || [];
  return related.some(term => narrative.includes(term));
}

// Generate contextual scene image that reflects story progression
export async function generateContextualSceneImage(gameState, narrative, apiKey, maxRetries = 3) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required for image generation');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  // Build enhanced character consistency with story progression
  const characterContext = buildProgressiveCharacterContext(gameState);
  
  // Build environmental context based on story history
  const environmentalContext = buildEnvironmentalContext(gameState);

  // Create detailed contextual image prompt
  const imagePrompt = `Create a cinematic supernatural detective scene that continues the visual story: ${narrative}

CHARACTER PROGRESSION: ${characterContext}

ENVIRONMENTAL CONTINUITY: ${environmentalContext}

VISUAL STORYTELLING REQUIREMENTS:
- Show the immediate aftermath/consequence of recent events
- Reflect the detective's current psychological and physical state
- Include visual references to previous supernatural encounters
- Maintain consistent supernatural threat presence and evolution
- Show environmental damage or changes from past choices

SCENE DETAILS:
- Location: ${gameState.primaryLocation}
- Supernatural Element: ${gameState.supernaturalElement}
- Investigation Turn: ${gameState.turnNumber}
- Case Progress: ${gameState.currentScore}/${gameState.maxScore}
- Current Narrative: ${narrative}

VISUAL CONTINUITY:
- Character should show wear/fatigue/confidence based on progress
- Environment should reflect cumulative investigation effects
- Supernatural elements should show progression (stronger/weaker)
- Lighting and atmosphere should match story momentum

TECHNICAL REQUIREMENTS:
- Cinematic film noir with supernatural elements
- High detail, photorealistic style
- Dramatic lighting reflecting story tone
- 16:9 aspect ratio
- Emotionally resonant with current story beat`;

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating contextual scene image (attempt ${attempt}/${maxRetries})...`);

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
      console.log(`Contextual scene image generated successfully on attempt ${attempt}`);

      return imageUrl;

    } catch (error) {
      console.error(`Contextual image generation error on attempt ${attempt}:`, error);
      lastError = error;

      // Don't retry on certain errors
      if (error.code === 'invalid_api_key' || error.code === 'insufficient_quota' || error.message.includes('content_policy_violation')) {
        break;
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        const waitTime = Math.min(attempt * 2000, 6000);
        console.log(`Waiting ${waitTime}ms before image retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error(`Failed to generate contextual scene image after ${maxRetries} attempts:`, lastError.message);
  throw lastError;
}

// Build progressive character context showing story impact
function buildProgressiveCharacterContext(gameState) {
  const detectiveName = gameState.detectiveName || 'Detective';
  const baseContext = buildCharacterContext(gameState);
  
  // Add story progression context
  const progressionContext = [];
  
  // Analyze investigation impact on character
  const score = gameState.currentScore;
  const maxScore = gameState.maxScore;
  const progress = score / maxScore;
  
  if (progress >= 0.8) {
    progressionContext.push('- Confident posture, determined expression, supernatural aura of authority');
    progressionContext.push('- Clothing still professional but showing signs of intense investigation');
    progressionContext.push('- Eyes bright with understanding and resolve');
  } else if (progress >= 0.6) {
    progressionContext.push('- Alert and focused, showing experience with supernatural forces');
    progressionContext.push('- Professional attire slightly disheveled from active investigation');
    progressionContext.push('- Cautious but determined expression');
  } else if (progress >= 0.4) {
    progressionContext.push('- Tense posture, showing strain from supernatural encounters');
    progressionContext.push('- Clothing showing wear from dangerous investigation work');
    progressionContext.push('- Worried but persistent expression');
  } else if (progress >= 0.2) {
    progressionContext.push('- Defensive posture, clearly affected by supernatural pressure');
    progressionContext.push('- Clothing disheveled, showing physical toll of mistakes');
    progressionContext.push('- Anxious expression with traces of fear');
  } else {
    progressionContext.push('- Overwhelmed posture, struggling against supernatural forces');
    progressionContext.push('- Clothing damage from supernatural encounters');
    progressionContext.push('- Expression of desperation and mounting dread');
  }

  // Add recent choice impacts
  if (gameState.history && gameState.history.length > 0) {
    const lastChoice = gameState.history[gameState.history.length - 1];
    if (lastChoice.scoreChange === 2) {
      progressionContext.push('- Recent success has boosted confidence and supernatural insight');
    } else if (lastChoice.scoreChange === -2) {
      progressionContext.push('- Recent mistake has left visible marks of supernatural backlash');
    }
  }

  return baseContext + '\n\nSTORY PROGRESSION EFFECTS:\n' + progressionContext.join('\n');
}

// Build environmental context showing cumulative story effects
function buildEnvironmentalContext(gameState) {
  const environmental = [];
  
  environmental.push(`BASE LOCATION: ${gameState.primaryLocation} with ${gameState.supernaturalElement} presence`);
  
  if (gameState.history && gameState.history.length > 0) {
    // Analyze cumulative environmental impact
    const totalScore = gameState.currentScore;
    const maxScore = gameState.maxScore;
    const progress = totalScore / maxScore;
    
    if (progress >= 0.8) {
      environmental.push('- Environment shows signs of supernatural retreat');
      environmental.push('- Lighting becoming less oppressive, shadows receding');
      environmental.push('- Previous investigation sites showing positive changes');
    } else if (progress >= 0.6) {
      environmental.push('- Environment in supernatural flux, battle between forces evident');
      environmental.push('- Some areas cleared, others still threatening');
      environmental.push('- Mix of hope and danger in atmospheric conditions');
    } else if (progress >= 0.4) {
      environmental.push('- Environment showing strain from supernatural conflict');
      environmental.push('- Previous investigation areas show mixed results');
      environmental.push('- Atmosphere tense with competing supernatural influences');
    } else if (progress >= 0.2) {
      environmental.push('- Environment increasingly corrupted by supernatural forces');
      environmental.push('- Previous mistake locations show supernatural strengthening');
      environmental.push('- Oppressive atmosphere with growing supernatural dominance');
    } else {
      environmental.push('- Environment heavily corrupted by unchecked supernatural forces');
      environmental.push('- Visible supernatural damage from investigation failures');
      environmental.push('- Menacing atmosphere with supernatural forces in control');
    }

    // Add specific environmental changes from recent choices
    const recentChoices = gameState.history.slice(-2);
    recentChoices.forEach(choice => {
      if (choice.scoreChange >= 1) {
        environmental.push(`- Area affected by "${choice.choice.text}" shows positive supernatural cleansing`);
      } else if (choice.scoreChange <= -1) {
        environmental.push(`- Area affected by "${choice.choice.text}" shows increased supernatural corruption`);
      }
    });
  }

  return environmental.join('\n');
}

// Inherit other functions from previous version
function buildCharacterContext(gameState) {
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
  const lowerName = name.toLowerCase();

  // Gender inference (simplified)
  const maleNames = ['john', 'james', 'michael', 'david', 'william', 'richard', 'thomas', 'charles', 'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'samuel', 'kenneth', 'joshua', 'kevin', 'brian', 'george', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'gregory', 'alexander', 'frank', 'raymond', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'henry', 'adam', 'douglas', 'nathan', 'peter', 'zachary', 'kyle', 'noah', 'alan', 'ethan', 'jeremy', 'lionel', 'andrew', 'joshua', 'wayne', 'elijah', 'mason', 'robert', 'harold', 'arthur', 'victor', 'magnus', 'ezra', 'hasan'];
  const femaleNames = ['mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen', 'nancy', 'lisa', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'lisa', 'nancy', 'karen', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'amy', 'angela', 'ashley', 'brenda', 'emma', 'olivia', 'cynthia', 'marie', 'janet', 'catherine', 'frances', 'christine', 'samantha', 'debra', 'rachel', 'carolyn', 'janet', 'virginia', 'maria', 'heather', 'diane', 'julie', 'joyce', 'victoria', 'kelly', 'christina', 'joan', 'evelyn', 'lauren', 'judith', 'megan', 'cheryl', 'andrea', 'hannah', 'jacqueline', 'martha', 'gloria', 'sara', 'janice', 'julia', 'kathryn', 'alice', 'teresa', 'sophia', 'frances', 'anna', 'diana', 'brittany', 'charlotte', 'marie', 'kayla', 'alexis', 'lori', 'rose'];

  const firstName = lowerName.split(' ')[0];
  const isMale = maleNames.some(male => firstName.includes(male));
  const isFemale = femaleNames.some(female => firstName.includes(female));

  // Style inference from name characteristics
  const isClassic = /^(detective\s+)?(john|james|william|margaret|elizabeth|charles|victoria|hasan)/i.test(name);
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

// Continue with existing functions for ending generation, speech synthesis, etc.
export async function generateGameEnding(gameState, apiKey, isVictory) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  // Create a detailed history summary for the AI with story flow
  const storyFlow = gameState.history.map((entry, index) => {
    return `Turn ${entry.turn}: ${entry.choice.text}
→ Result: ${entry.result}
→ Impact: ${getScoreImpactText(entry.scoreChange)} (Score: ${entry.newScore})`;
  }).join('\n\n');

  const systemPrompt = `You are creating the dramatic conclusion to a CONTINUOUS supernatural detective story. Every choice and consequence has led to this moment.

DETECTIVE'S JOURNEY: ${gameState.detectiveName} investigating ${gameState.supernaturalElement} in ${gameState.primaryLocation}
FINAL MISSION STATUS: ${gameState.mainObjective}

COMPLETE STORY ARC:
${storyFlow}

CRITICAL REQUIREMENTS:
- Create a ${isVictory ? 'TRIUMPHANT VICTORY' : 'HAUNTING DEFEAT'} ending that feels EARNED
- Reference SPECIFIC choices and their consequences from the investigation
- Show how the CUMULATIVE effect of all decisions led to this outcome
- Tie together the supernatural mystery with ALL previous story elements
- Make this feel like the inevitable conclusion of THIS specific detective's journey

${isVictory ? `VICTORY ENDING MUST SHOW:
- How specific successful choices weakened the supernatural threat
- The detective's growth through the investigation
- How past mistakes were overcome by later successes
- The supernatural mystery fully resolved and explained
- The location and people saved through the detective's persistence
- References to key breakthrough moments from the story` : `DEFEAT ENDING MUST SHOW:
- How specific poor choices strengthened the supernatural forces
- The detective's gradual overwhelm throughout the investigation
- How early successes were undone by critical failures
- The supernatural mystery consuming the detective and location
- The consequences of failure for everyone involved
- References to key mistake moments that sealed this fate`}

FINAL GAME STATE:
- Detective: ${gameState.detectiveName}
- Final Score: ${gameState.currentScore}/${gameState.maxScore}
- Total Decisions: ${gameState.history.length}
- Investigation Outcome: ${isVictory ? 'Case Solved' : 'Case Failed'}

Create a 4-5 paragraph ending that feels like the natural conclusion to this specific detective's story. Reference actual events and choices from their investigation.`;

  try {
    console.log(`Generating ${isVictory ? 'victory' : 'defeat'} ending with story continuity...`);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the ${isVictory ? 'triumphant victory' : 'haunting defeat'} ending for Detective ${gameState.detectiveName}'s complete investigation journey.` }
      ],
      temperature: 0.9,
      max_tokens: 700
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No ending generated from OpenAI API');
    }

    const ending = completion.choices[0].message.content.trim();
    console.log(`${isVictory ? 'Victory' : 'Defeat'} ending with story continuity generated successfully`);

    // Generate ending image that reflects the complete story
    let endingImageUrl = null;
    try {
      console.log('Generating story-concluding ending image...');
      endingImageUrl = await generateStoryEndingImage(gameState, ending, isVictory, apiKey);
      console.log('Story-concluding ending image generated successfully');
    } catch (imageError) {
      console.warn('Failed to generate ending image:', imageError);
    }

    return {
      text: ending,
      imageUrl: endingImageUrl
    };

  } catch (error) {
    console.error('Error generating game ending:', error);

    // Enhanced fallback endings with story context
    const storyContext = gameState.history.length > 0 
      ? `Through ${gameState.history.length} critical decisions, each choice shaping the final outcome, `
      : '';

    const fallbackEnding = isVictory
      ? `${storyContext}Detective ${gameState.detectiveName} stands triumphant in the ${gameState.primaryLocation}. The ${gameState.supernaturalElement} has been defeated through careful investigation and brave choices. Every decision, every risk taken, led to this moment of victory. The ${gameState.mainObjective} has been achieved, and the supernatural threat that once seemed insurmountable has been banished. The detective's persistence and wisdom have saved not just this location, but proven that even the darkest supernatural forces can be overcome by human determination and intelligence.`
      : `${storyContext}The darkness claims Detective ${gameState.detectiveName} in the ${gameState.primaryLocation}. Despite their best efforts, the cumulative weight of mistakes and the overwhelming power of the ${gameState.supernaturalElement} has proven too much. Each poor choice weakened the detective's position, each missed opportunity strengthened the supernatural forces, until this inevitable conclusion. The ${gameState.mainObjective} remains forever unfulfilled, and the location is consumed by the very evil the detective sought to stop. Some investigations are doomed from the start, and some supernatural forces are simply beyond mortal comprehension.`;

    return {
      text: fallbackEnding,
      imageUrl: null
    };
  }
}

// Generate ending image that reflects the complete story journey
export async function generateStoryEndingImage(gameState, endingText, isVictory, apiKey, maxRetries = 3) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required for image generation');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  // Build comprehensive story-conclusion context
  const storyJourney = buildStoryJourneyContext(gameState);
  const finalCharacterState = buildFinalCharacterState(gameState, isVictory);

  const imagePrompt = `Create the ultimate climactic ending scene that concludes the complete supernatural detective story: ${endingText}

COMPLETE STORY JOURNEY: ${storyJourney}

FINAL CHARACTER STATE: ${finalCharacterState}

${isVictory ? 'TRIUMPHANT VICTORY SCENE:' : 'DEVASTATING DEFEAT SCENE:'}
${isVictory ? `- Detective stands victorious, showing the culmination of their growth
- Environment restored and cleansed, supernatural threat visibly banished
- Visual references to key successful choices throughout the investigation
- Lighting symbolizes hope and triumph over darkness
- Detective's posture and expression show earned confidence and relief
- Supernatural elements retreat or dissolve, showing complete victory` : `- Detective overwhelmed or consumed, showing the cost of accumulated failures
- Environment corrupted and dominated by supernatural forces
- Visual references to key failed choices that led to this doom
- Oppressive lighting emphasizes hopelessness and supernatural dominance
- Detective's posture shows defeat, exhaustion, or worse
- Supernatural elements triumphant and menacing, showing complete control`}

VISUAL STORY CONCLUSION:
- This is the FINAL moment of a ${gameState.history.length}-turn investigation
- Show the ultimate consequence of ALL previous choices
- Character should reflect the complete journey from start to finish
- Environment should show the final state after all investigation effects
- Include symbolic elements representing the detective's complete story arc

TECHNICAL REQUIREMENTS:
- Epic, cinematic composition worthy of a story conclusion
- Maximum emotional impact reflecting the earned ending
- Professional movie poster quality
- 16:9 aspect ratio
- Lighting and atmosphere that captures the story's final tone`;

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating story-concluding ending image (attempt ${attempt}/${maxRetries})...`);

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
      console.log(`Story-concluding ending image generated successfully on attempt ${attempt}`);

      return imageUrl;

    } catch (error) {
      console.error(`Story ending image generation error on attempt ${attempt}:`, error);
      lastError = error;

      if (error.code === 'invalid_api_key' || error.code === 'insufficient_quota' || error.message.includes('content_policy_violation')) {
        break;
      }

      if (attempt < maxRetries) {
        const waitTime = Math.min(attempt * 3000, 9000);
        console.log(`Waiting ${waitTime}ms before ending image retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

// Build context of the complete story journey for ending imagery
function buildStoryJourneyContext(gameState) {
  const journey = [];
  
  journey.push(`Investigation: ${gameState.history.length} critical decisions over ${gameState.turnNumber} turns`);
  
  if (gameState.history.length > 0) {
    const excellentChoices = gameState.history.filter(h => h.scoreChange === 2).length;
    const poorChoices = gameState.history.filter(h => h.scoreChange === -2).length;
    
    journey.push(`Major successes: ${excellentChoices}, Critical failures: ${poorChoices}`);
    journey.push(`Final score: ${gameState.currentScore}/${gameState.maxScore}`);
    
    // Add key story moments
    const keyMoments = gameState.history.filter(h => Math.abs(h.scoreChange) >= 2);
    if (keyMoments.length > 0) {
      journey.push('Key story moments:');
      keyMoments.forEach(moment => {
        journey.push(`- ${moment.choice.text} (${getScoreImpactText(moment.scoreChange)})`);
      });
    }
  }
  
  return journey.join('\n');
}

// Build final character state reflecting complete story arc
function buildFinalCharacterState(gameState, isVictory) {
  const baseContext = buildProgressiveCharacterContext(gameState);
  
  const finalState = [];
  
  if (isVictory) {
    finalState.push('VICTORIOUS DETECTIVE:');
    finalState.push('- Triumphant posture showing earned victory');
    finalState.push('- Face showing relief, satisfaction, and hard-won wisdom');
    finalState.push('- Professional attire weathered but dignified');
    finalState.push('- Eyes bright with accomplishment and supernatural mastery');
    finalState.push('- Confident stance of someone who has faced evil and won');
  } else {
    finalState.push('DEFEATED DETECTIVE:');
    finalState.push('- Broken or overwhelmed posture showing ultimate failure');
    finalState.push('- Face showing despair, exhaustion, or supernatural corruption');
    finalState.push('- Professional attire damaged or transformed by supernatural forces');
    finalState.push('- Eyes showing defeat, fear, or worse');
    finalState.push('- Posture of someone consumed by forces beyond understanding');
  }
  
  return baseContext + '\n\n' + finalState.join('\n');
}

// Include all other existing functions for speech synthesis, testing, etc.
export async function generateSpeech(text, voice = 'alloy', apiKey = null) {
  if (!text || text.trim() === '') {
    throw new Error('Text is required for speech generation');
  }

  // Clean text for better speech synthesis
  const cleanText = text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{200D}]/gu, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\n+/g, ' ')
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

// ElevenLabs with smart rate limiting and retry logic
async function generateElevenLabsSpeech(text, apiKey) {
  if (!apiKey) {
    throw new Error('ElevenLabs API key is required');
  }

  const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice ID
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`ElevenLabs TTS attempt ${attempt}/${maxRetries}...`);

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
        
        if (response.status === 429) {
          const error429 = new Error(`ElevenLabs rate limit exceeded: ${errorData}`);
          error429.code = 'rate_limit_exceeded';
          error429.isRetryable = true;
          throw error429;
        } else if (response.status === 401) {
          const error401 = new Error('ElevenLabs API key is invalid or expired');
          error401.code = 'invalid_api_key';
          error401.isRetryable = false;
          throw error401;
        } else if (response.status === 402) {
          const error402 = new Error('ElevenLabs quota exceeded. Please check your billing or upgrade your plan');
          error402.code = 'insufficient_quota';
          error402.isRetryable = false;
          throw error402;
        }
        
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorData}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log(`ElevenLabs TTS successful on attempt ${attempt}`);

      return {
        url: audioUrl,
        type: 'elevenlabs',
        cleanup: () => URL.revokeObjectURL(audioUrl)
      };

    } catch (error) {
      console.error(`ElevenLabs TTS error on attempt ${attempt}:`, error);
      lastError = error;

      // Don't retry on certain errors
      if (error.code === 'invalid_api_key' || error.code === 'insufficient_quota') {
        console.error('Non-retryable ElevenLabs error:', error.message);
        break;
      }

      // Implement exponential backoff with jitter for rate limits
      if (attempt < maxRetries) {
        const baseDelay = error.code === 'rate_limit_exceeded' ? 5000 : 2000;
        const jitter = Math.random() * 1000;
        const waitTime = Math.min(baseDelay * Math.pow(2, attempt - 1) + jitter, 30000);
        
        console.log(`Waiting ${Math.round(waitTime)}ms before ElevenLabs retry (attempt ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // Handle final error with user-friendly messages
  if (lastError.code === 'rate_limit_exceeded') {
    throw new Error('Voice service is busy. Please try again in a few moments. Consider upgrading to a higher tier for priority access.');
  } else if (lastError.code === 'invalid_api_key') {
    throw new Error('ElevenLabs API key is invalid. Please check your key in Settings.');
  } else if (lastError.code === 'insufficient_quota') {
    throw new Error('ElevenLabs quota exceeded. Please check your billing or try again later.');
  } else {
    throw new Error(`ElevenLabs synthesis failed after ${maxRetries} attempts: ${lastError.message}`);
  }
}

async function generateOpenAISpeech(text, voice) {
  try {
    // Note: OpenAI TTS requires server-side implementation due to CORS
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

    audio.volume = 0.8;
    audio.play().catch(error => {
      console.error('Failed to start audio playbook:', error);
      if (audioData.cleanup) {
        audioData.cleanup();
      }
      reject(error);
    });
  });
}

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
      dangerouslyAllowBrowser: true
    });

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