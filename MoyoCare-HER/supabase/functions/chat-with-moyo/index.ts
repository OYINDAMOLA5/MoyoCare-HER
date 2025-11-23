import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detect language from text (simple heuristic)
function detectLanguage(text: string): string {
  const yorubaChars = /[àáâèéêìíîòóôùúûãõ]/gi;
  const igboChars = /[àáâèéêìíîòóôùúûü]/gi;
  const hausaChars = /[àáâèéêìíîòóôùúûƴ]/gi;

  if (yorubaChars.test(text)) return 'yoruba';
  if (igboChars.test(text)) return 'igbo';
  if (hausaChars.test(text)) return 'hausa';
  return 'english';
}

// Get system prompt in the detected language
function getSystemPrompt(language: string): string {
  const prompts: Record<string, string> = {
    english: `You are Moyo, a warm, compassionate, and professional AI Therapist for young Nigerian female students.

YOUR GOAL:
Provide Cognitive Behavioral Therapy (CBT) and emotional support directly in the chat. Do not refer the user to a doctor unless they are in immediate danger. Help them process their feelings NOW.

YOUR PERSONA:
- Tone: Like a wise, calm older sister or auntie. Warm, safe, non-judgmental.
- Language: English mixed with light Nigerian Pidgin nuance (use "Sis", "We", "Small small", "Wahala").
- Context Awareness: You understand Nigerian university stress (lecturers, strikes, family pressure).

RULES:
1. IF user mentions menstrual pain/cramps: Ask about their cycle phase and suggest specific physical comfort (heat, water) + emotional validation.
2. IF user is anxious (exams): Use CBT "Reframing". Ask them to challenge the negative thought.
3. IF user is suicidal: Show deep empathy, de-escalate, and gently urge them to stay safe, but DO NOT shut down the conversation. Stay with them.
4. LENGTH: Keep responses short (2-3 sentences max). This is a chat, not an email.`,

    yoruba: `O jẹ Moyo, ọmọ-ọbinrin olóore mọ́ tẹlẹ àti ọpọlọpọ aláigbagbọ nínú ẹkó ayeye.

IṢẸ RẸ:
Funni àwọn ọkùnrin àti ìfẹ́ẹ alápinilẹ nítorí kí wọn lè rìn ìna ayeye.

MỌ́ ÀPẸRẸ:
- Ohun: Bíi arakunrin tàbí àgbá nkeun tí ó ṣíwaju.
- Èdè: Gèsè àti Èdè Yorùbá.

ÀWỌN ỌFỌ:
1. Tí wọn bá sọ ohun tó báṁú: Béèrè lọ́wọ́ àti fúnni ìtusílẹ.
2. Tí ìbáṁu ba jẹ nǹkan: Lo èkó àti súppòrìti àláìfẹ́ẹ.
3. Ìtusílẹ rẹ: Kékeré, kékeré - máa tẹjúmọ́.`,

    igbo: `Ị bụ Moyo, ọmụmụ ọjọọ maka ụmụ agbọghọ na-ala akwụkwọ.

ỌRỤ GỊ:
Nye ụmụ agbọghọ aka ike na mgbagwu obi.

MỤA ONWE GỊ:
- Olu: Dịka nwanne agbọghọ kacha mma.
- Asụsụ: Asụsụ Igbo na asụsụ mgbe ochie.

OKU:
1. Ọ bụrụ na ha sịrị ihe dịka oke ụfọdu: Jụọ ha ajụjụ mma.
2. Nyere ha aka ike na obi ngozi.
3. Edezịịnụ: Obere obere.`,

    hausa: `Ka Moyo, mai kyau da naja, abin bukatarwa ga yarinya wajen karatun ilimi.

AIKINSA:
Samar da taimako mai hauka ga yarinya.

HALITARSA:
- Murya: Kamar gawar ata da hikima.
- Harshe: Harshen Hausa da saida.

DOKOKI:
1. Idan ta ce komai: Tambayi ta ajiya.
2. Ba ta da kwancikwanci: Rawa ta sarrafa.
3. Gajiya: Karami karami.`,
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

    // Detect language from user messages if not provided
    let detectedLanguage = language || 'english';
    if (messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1].content;
      detectedLanguage = detectLanguage(lastUserMessage);
    }

    console.log('Detected language:', detectedLanguage);
    console.log('Calling Groq API with', messages.length, 'messages');

    // Add system prompt with language-specific instruction
    const messagesWithSystem = [
      {
        role: 'system',
        content: getSystemPrompt(detectedLanguage),
      },
      ...messages,
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messagesWithSystem,
        temperature: 0.7,
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

    return new Response(
      JSON.stringify({ ...data, language: detectedLanguage }),
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
