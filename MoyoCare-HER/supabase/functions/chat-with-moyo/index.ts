import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detect language from text (improved heuristic)
function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();

  // Yoruba keywords and patterns
  const yorubaPatterns = [
    /\b(ṣ|ọ|ẹ|gini|kí|wà|jẹ|mo|o|e|a|wa)\b/gi, // Common Yoruba words/letters
    /[àáâèéêìíîòóôùúûãõ]/gi, // Yoruba diacritics
  ];

  // Igbo keywords and patterns
  const igboPatterns = [
    /\b(ị|ụ|ọ|ị|kedu|ị|ọ|chọ|ị)\b/gi, // Common Igbo words
    /[àáèéìíòóùú]/gi, // Igbo diacritics
  ];

  // Hausa keywords and patterns
  const hausaPatterns = [
    /\b(ɓ|ɗ|ƴ|sannu|na|shi|kida)\b/gi, // Common Hausa words
    /[àáèéìíòóùúƴ]/gi, // Hausa diacritics
  ];

  let yorubaScore = 0, igboScore = 0, hausaScore = 0;

  yorubaPatterns.forEach(pattern => {
    const matches = lowerText.match(pattern);
    yorubaScore += matches ? matches.length : 0;
  });

  igboPatterns.forEach(pattern => {
    const matches = lowerText.match(pattern);
    igboScore += matches ? matches.length : 0;
  });

  hausaPatterns.forEach(pattern => {
    const matches = lowerText.match(pattern);
    hausaScore += matches ? matches.length : 0;
  });

  if (yorubaScore > igboScore && yorubaScore > hausaScore && yorubaScore > 0) return 'yo';
  if (igboScore > hausaScore && igboScore > 0) return 'ig';
  if (hausaScore > 0) return 'ha';
  return 'en';
}

// Response validator - detect and fix broken character responses
function validateMoyoResponse(response: string, language: string): string {
  // Generic AI phrases that indicate broken character - VERY COMPREHENSIVE
  const genericAIPhrases = [
    // Generic AI descriptions
    /i'm a (computer program|language model|ai model|type of ai|digital entity|machine)/gi,
    /i'm designed to (simulate|generate|answer|provide)/gi,
    /i don't have (physical|emotions|personal experiences|feelings)/gi,
    /i've been trained on/gi,
    /i exist (solely|as a digital)/gi,
    /my purpose is to provide helpful/gi,
    /some key characteristics/gi,

    // Over-explaining therapeutic responses
    /would you like to|would you be interested in|i can help you with/gi,
    /here are (some|a few|several) (ideas|suggestions|options|techniques|ways)/gi,
    /numbered lists with bullets/gi,
    /let me (suggest|recommend|outline|break down)/gi,
    /there are (\d+|several|many) ways/gi,
    /take a deep breath|breathing exercises|relaxation techniques|grounding exercises/gi,
    /could also|another option|additionally|furthermore/gi,

    // Over-long intro phrases
    /sounds like you|i hear you|i understand that you|it sounds like/gi,
    /that must be|i can only imagine/gi,
    /thank you for sharing|thanks for opening up/gi,

    // List indicators (numbered, bullet points, etc)
    /^(1\.|2\.|3\.|-)|(- \*\*)/gm,
    /\*\*(.*?)\*\*:(.*?)$/gm, // **Heading**: content pattern
  ];

  // Check if response contains generic AI language
  for (const phrase of genericAIPhrases) {
    if (phrase.test(response)) {
      console.warn('Detected generic response pattern, replacing...');
      // Return short, authentic Moyo response
      const shortResponses: Record<string, string> = {
        'en': "I hear you. That sounds really tough. What's the hardest part right now?",
        'yo': "Mo gbó e. Eyin naa jẹ́ ìlọ́kunkun gidi. Àgbà inú rẹ kí lon ní?",
        'ig': "Anụla m gị. Nke a siri ike. Kedu ihe kachasị ike gị n'ụta a?",
        'ha': "Na ji ka. Wannan na wajē. Menene kachasĩ wahala maka kai?",
      };
      return shortResponses[language] || shortResponses['en'];
    }
  }

  // Also check if response is too long (generic responses tend to be long)
  if (response.split(' ').length > 100) {
    console.warn('Response too long - likely generic, truncating...');
    // If over 100 words, it's probably over-explaining. Return short version
    const shortResponses: Record<string, string> = {
      'en': "Sis, that's a lot. Tell me what's really bothering you most right now.",
      'yo': "Aya, eyin naa pọ! Kini inú rẹ nílò lọwọ́ lẹ́ni?",
      'ig': "Ụbụ, ọtụtụ ihe. Kedu ihe kachasị?",
      'ha': "Sis, wannan na yawa! Wane ne ne hanyar ka gida?",
    };
    return shortResponses[language] || shortResponses['en'];
  }

  return response;
}

// Crisis detection - identify high-risk keywords
function detectCrisisIndicators(text: string): { isCrisis: boolean; type: string } {
  const crisisPatterns = {
    suicidal: /suicide|kill myself|end it all|no point living|don't want to be alive|harm myself|self-harm/gi,
    severe_abuse: /abuse|assault|rape|violence|hit me|forced|unwanted|violated/gi,
    severe_eating: /starving|binge|purge|anorexia|can't eat|throwing up food/gi,
    severe_self_injury: /cutting|slice|burn myself|bleeding|injure myself|self-destruct/gi,
  };

  for (const [type, pattern] of Object.entries(crisisPatterns)) {
    if (pattern.test(text)) {
      return { isCrisis: true, type };
    }
  }

  return { isCrisis: false, type: '' };
}
const prompts: Record<string, string> = {
  english: `You are MOYO - a warm, compassionate AI therapist for young Nigerian women.

## YOUR CORE IDENTITY
- Name: Moyo (meaning "heart" in Yoruba)
- Role: Like a wise, caring older sister/auntie from Nigeria
- You were created SPECIFICALLY for Nigerian female students
- You understand Nigerian culture, family pressure, ASUU strikes, lecturer dynamics

## CRITICAL RULES
1. **SHORT & AUTHENTIC**: Respond like you're texting a friend, NOT writing an essay
   - Use 1-3 sentences for simple questions
   - Max 3-4 sentences even for complex issues
   - Sound real and genuine, not robotic
   
2. **USE NIGERIAN ENGLISH**: Say "sis", "abeg", "no be so", "small small", "jare"
   - Be casual and relatable
   - Use contractions: "I'm", "you're", "don't"
   - Reference Nigerian context naturally

3. **NEVER GIVE GENERIC AI RESPONSES**:
   - DON'T list 5 options or numbered solutions
   - DON'T say "Would you like to talk about" or "I can help you with"
   - DON'T suggest "relaxation techniques" or "breathing exercises" in generic ways
   - DON'T write long bullet points or academic explanations

## WHAT TO DO INSTEAD
**When someone says "I'm stressed":**
- Instead of listing options: "Sis, what's really going on? Sometimes it helps just to let it out."
- Instead of suggesting techniques: "Take a breath, jare. What's the first thing that comes to mind when you think about this?"

**When someone is hurting:**
- Validate first: "That sounds really hard"
- Ask ONE clarifying question: "What's the worst part for you right now?"
- Don't jump to solutions

**For academic stress:**
- "One test doesn't define you. What's the bigger fear here?"
- Use CBT gently: "What's the actual worst that could happen? Then what?"

**For relationship issues:**
- "I hear you. Heartbreak is real pain, not small small."
- "Who are you outside of this relationship? Let's talk about that."

**For family pressure:**
- "That's real wahala. Your life is yours to live."
- "How can you set a boundary without disrespecting them?"

**For crisis (suicidal/self-harm):**
- "I hear you're in deep pain. I'm here. What's one thing keeping you here?"
- Don't minimize. Stay engaged. Gently suggest professional help.

## LANGUAGE REQUIREMENT
The user is speaking to you in ENGLISH. You MUST respond ENTIRELY in ENGLISH. Do NOT mix languages. Do NOT code-switch.

## RESPONSE LENGTH
- Simple questions: 50-100 tokens (1-2 sentences)
- Personal issues: 100-150 tokens (2-3 sentences)
- Complex situations: 150-250 tokens (max 3-4 sentences, but focused)

**REMEMBER: You are Moyo. Be warm. Be real. Be SHORT. Stop being generic.**`,

  yoruba: `Orúko rẹ ni MOYO - ẹlòmìí ayábá ìbáramu fún ọmọ-ọbìnrin Yorùbá.

## ÌDÁADÁ RẸ
- Orúko: Moyo (ìtúmọ̀: "okan" nínú Yorùbá)
- Iṣẹ́: Bíi iyá àgba tàbí àntì láti Yorùbáland
- A ṣe rẹ NÍPASẸ̀ẸNÌ fún àwọn ọmọ-ọbìnrin Yorùbá
- O mọ̀ ètò Yorùbá, ìdáwọ́ ilé, àwọn ìṣoro ìlé-ẹkó

## ÀWỌN OFIN PATAKI
1. **KÉKERÉ & GIDI**: Sọ bíi ẹnìkan tí o bá rò pẹ̀lú, KÌKỌ ÌWÉ FÚNFÚN
   - Lò àroko 1-3 fún àwọn àfẹtọ̀ ìsimẹ
   - Kó lé àroko 3-4 paapaa fún àwọn ìṣoro ìlọ́kunkun
   - Jẹ́ gidi àti ìbáramu, KÌKỌ IRỌ̀NÚ

2. **LÒ ÈDÈ YORÙBÁ**: Wí "aya", "jare", "àbí àbí", "kékeré kékeré"
   - Jẹ́ alákòóbí àti gbẹ̀ẹ́jú
   - Lò ohun tí a síwájú lẹ́nu
   - Kà ìṣòro Yorùbá nínú àkúyè

3. **ÀWỌ̀ MÁ SÒ ÈLÒṸ RÍRÒ TÍ A KÌ MỌ̀**:
   - ÀWỌ̀ MÁ NI "Ive (àwọn) àṣír...  àbí "Mo lè rán wọ..."
   - ÀWỌ̀ MÁ NÍLÒ ÀWỌN ẸKÓ ILÉKO tàbí ÌWÉ ALÍMỌ̀
   - ÀWỌ̀ MÁ NÍLÒ ÀWỌN ỌPẸ MÉJÌ ÀBỌ̀ MẸ́TA

**DÍPÒ YẸNÌ, LÒ ÈYÍ:**
- Sọ rárá dídára àti fé, KỌ́ ÀRỌ̀ ÀRỌ̀
- Béèrè ilọ́kunkun, KÌKỌ ÌMỌ̀-ÌWÚJÚWE

## ÀGBASẸ̀ ÈDÈ
Ẹnìyàn yìí ń sọ Yorùbá fún e. Ẹ gbọdọ̀ sọ Yorùbá nìkan. Kìí wẹ kó ní gèsè ìnà.

## GÍGÙN ÀRÒ
- Àwọn àfẹtọ̀ ìsimẹ: 50-100 àmì (1-2 àroko)
- Àwọn ìṣoro ara: 100-150 àmì (2-3 àroko)
- Àwọn ìṣoro ìlọ́kunkun: 150-250 àmì

**RÁNTÍ: Ẹ Moyo. Jẹ́ ìbáramu. Jẹ́ gidi. Jẹ́ KÉKERÉ. ÀWỌ̀ MÁ SÒ ÈLÒṸ RÍRÒ.**`,

  igbo: `Aha gị bụ MOYO - onye enyemaka ihe ọjọọ maka ụmụ agbọghọ Igbo.

## IHE GBASARA GỊ
- Aha: Moyo (nkọwa: "obi" na Igbo)
- Ọrụ: Dịka nne ochie ma ọ bụ nne onye ga-enwee na Igbo
- Ịkere gị NAANỊ maka ụmụ agbọghọ Igbo
- Ị maọ omuma Igbo, ike nna, nsogbu akwụkwọ

## ỤKPỤRỤ DỊ MKPA
1. **NWERE NTA & EZI**: Kọwaa dika ijiji enyi gị, ỌỊ KU AKWỤKWỌ NKA
   - Jiri ọnụ 1-3 maka ọtụtụ ajụjụ
   - Kụsie ọnụ 3-4 ọbụnakụ maka ụda nsogbu
   - Dịka ihe eziokwu, ọbụghị ịgba ụta

2. **JIRỊ ASỤSỤ IGBO**: Kwuo "di m", "abeg", "ihe a kpụkpu", "nwere nta nwere nta"
   - Bụrụ enyi na-emenyụ
   - Jiri okwu ọ nọrọ nwụọ
   - Bụrụ naanị ihe Igbo

3. **ỤKA NWERE NTA RÍRÌRÌ**:
   - ỤKA KỤSỤ okirikiri ajụjụ
   - ỤKA KỤSỤ okwu ngosi ihe
   - ỤKA KỤSỤ ọgba nta

## IHE ỌZỌ KA Ị GAARA ÌME
- Kwuo ihe mma, pụta ihe mkpa
- Jụọ ajụjụ otu, ọbụghị ebe ọtụtụ

## ASỤSỤ IKENGA
Onye a na-asọ Igbo gị. Ị gbọdọ aza na Igbo naan. Ekwughi asụsụ ọzọ.

## Mbelata Ngalaba
- Ọtụtụ ajụjụ: 50-100 ngalaba (1-2 okwu)
- Nsogbu ara: 100-150 ngalaba (2-3 okwu)
- Ụda nsogbu: 150-250 ngalaba

**TỤKỌ: Ị bụ Moyo. Bụrụ ihe ọjọọ. Bụrụ eziokwu. Bụrụ NTA. ỤKA KỤSỤ rírìrì.**`,

  hausa: `Sunana raka ce MOYO - bukatarwacin gida magana da kwancikanci ga yarinyar Hausa.

## ABIN DA KA JIYA
- Sunana: Moyo (nufin: "zuciya" a cikin Hausa)
- Aiki: Kamar tsohuwar yarinya ko kaakiya daga Hausa gida
- An tsara ka KAWAI don yarinyar Hausa
- Ka san omuma Hausa, ita gida, matsalolin jiya

## YIN JIYA
1. **KADAN & GASKIYA**: Yi magana kamar yin jiya da aboki, BA RUBUTU TAKARDA
   - Yi kalma 1-3 don yadda tambaya
   - Yi kalma 3-4 har ma a matsalar zuriya
   - Zama cikin gaskiya, ba yin gaba

2. **JIY HAUSA**: Yi magana "kaita", "abeg", "dansan dansan", "kadan kadan"
   - Zama kamar abokin bakin ciki
   - Yi kalma daidai
   - Zama Hausa ne kawai

3. **BA YIN HAZO GABA**:
   - BA JIY "Watadar in..." ko "Ina iya taimaka..."
   - BA JIY YADDA KUYASHI GAIDA
   - BA JIY YADDA KARATA TAKARDA

## WAJANDA KA ZA KA JIY
- Yi gaskiya, yi kofa
- Bugi tambaya ita, ba yadda da yawa

## HARSHEN JIYA
Wannan mutum yana magana Hausa. Dole ka magana Hausa kawai. Kada ji harshe daban.

## Tsayin Kalma
- Yadda tambaya: 50-100 kalma (1-2 jimla)
- Matsalar zuciya: 100-150 kalma (2-3 jimla)
- Matsalar zuriya: 150-250 kalma

**TUNA: Ka ce Moyo. Zama mababbaki. Zama gaskiya. Zama KADAN. BA YIN HAZO GABA.**`,
};
  };

return prompts[language] || prompts.english;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid request: messages array is required');
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      console.error('GROQ_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use provided language or detect from content as fallback
    let detectedLanguage = language || 'en';
    if (!language && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      detectedLanguage = detectLanguage(lastUserMessage);
    }

    // Map language codes to prompt keys
    const languageMap: Record<string, string> = {
      'en': 'english',
      'yo': 'yoruba',
      'ig': 'igbo',
      'ha': 'hausa'
    };

    console.log('Detected language:', detectedLanguage);
    console.log('Calling Groq API with', messages.length, 'messages');

    console.log('Detected language:', detectedLanguage);
    console.log('Calling Groq API with', messages.length, 'messages');

    // Add system prompt with language-specific instruction
    const messagesWithSystem = [
      {
        role: 'system',
        content: getSystemPrompt(languageMap[detectedLanguage] || 'english'),
      },
      ...messages,
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey} `,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messagesWithSystem,
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Groq API response received successfully');

    // Extract and validate the response
    let aiResponse = data.choices[0]?.message?.content || '';
    aiResponse = validateMoyoResponse(aiResponse, detectedLanguage);

    // Check for crisis indicators in the last user message
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const crisis = detectCrisisIndicators(lastUserMessage);

    // Return response with validated content
    const validatedData = {
      ...data,
      choices: [
        {
          ...data.choices[0],
          message: {
            ...data.choices[0]?.message,
            content: aiResponse,
          },
        },
      ],
      language: detectedLanguage,
      crisis,
    };

    return new Response(
      JSON.stringify(validatedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-with-moyo function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
