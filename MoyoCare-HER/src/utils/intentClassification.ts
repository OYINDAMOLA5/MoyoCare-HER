// Intent Classification Engine - The "Brain"
export type Intent = 'CRISIS' | 'ACADEMIC' | 'PHYSICAL' | 'EMOTIONAL' | 'GENERAL';

export interface IntentResult {
  primary: Intent;
  confidence: number;
  keywords: string[];
}

const intentKeywords: Record<Intent, string[]> = {
  CRISIS: [
    'die', 'kill', 'hurt myself', 'end it', 'suicide', 'suicidal',
    'can\'t go on', 'want to die', 'end my life', 'harm myself',
    'no point', 'better off dead', 'give up', 'hopeless'
  ],
  ACADEMIC: [
    'exam', 'test', 'study', 'studying', 'fail', 'failing', 'failed',
    'school', 'university', 'college', 'lecturer', 'professor', 'teacher',
    'assignment', 'homework', 'grade', 'grades', 'class', 'course',
    'presentation', 'project', 'deadline'
  ],
  PHYSICAL: [
    'cramps', 'pain', 'painful', 'body', 'head', 'headache', 'tired',
    'fatigue', 'nausea', 'bloating', 'sore', 'ache', 'aching',
    'stomach', 'back', 'bleeding', 'heavy flow', 'period pain',
    'exhausted', 'weak', 'dizzy'
  ],
  EMOTIONAL: [
    'sad', 'crying', 'emotional', 'mood', 'moody', 'angry', 'frustrated',
    'anxious', 'anxiety', 'stressed', 'stress', 'overwhelmed', 'worried',
    'upset', 'depressed', 'lonely', 'irritable', 'sensitive'
  ],
  GENERAL: []
};

export function classifyIntent(text: string): IntentResult {
  const lowerText = text.toLowerCase();
  const intentScores: Record<Intent, { score: number; keywords: string[] }> = {
    CRISIS: { score: 0, keywords: [] },
    ACADEMIC: { score: 0, keywords: [] },
    PHYSICAL: { score: 0, keywords: [] },
    EMOTIONAL: { score: 0, keywords: [] },
    GENERAL: { score: 0, keywords: [] }
  };
  
  // Score each intent based on keyword matches
  Object.entries(intentKeywords).forEach(([intent, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        intentScores[intent as Intent].score += 1;
        intentScores[intent as Intent].keywords.push(keyword);
      }
    });
  });
  
  // Find the highest scoring intent
  let maxScore = 0;
  let primaryIntent: Intent = 'GENERAL';
  
  Object.entries(intentScores).forEach(([intent, data]) => {
    if (data.score > maxScore) {
      maxScore = data.score;
      primaryIntent = intent as Intent;
    }
  });
  
  // Calculate confidence (0-100)
  const totalMatches = Object.values(intentScores).reduce((sum, data) => sum + data.score, 0);
  const confidence = totalMatches > 0 ? Math.round((maxScore / totalMatches) * 100) : 0;
  
  return {
    primary: primaryIntent,
    confidence,
    keywords: intentScores[primaryIntent].keywords
  };
}
