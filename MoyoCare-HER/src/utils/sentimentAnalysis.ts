// Sentiment Analysis Engine - Weighted Word Dictionary
export interface SentimentResult {
  score: number;
  level: 'high-distress' | 'empathy' | 'neutral' | 'positive';
  matchedWords: string[];
}

const sentimentDictionary: Record<string, number> = {
  // High Distress (-5 to -3)
  'devastated': -5,
  'hopeless': -5,
  'worthless': -5,
  'suicidal': -5,
  'die': -5,
  'kill': -5,
  'end it': -5,
  'give up': -4,
  'terrible': -4,
  'awful': -4,
  'miserable': -4,
  'depressed': -4,
  'anxious': -3,
  'overwhelmed': -3,
  'panic': -3,
  
  // Empathy (-2 to -1)
  'sad': -2,
  'tired': -2,
  'stressed': -2,
  'worried': -2,
  'upset': -2,
  'frustrated': -2,
  'disappointed': -2,
  'lonely': -2,
  'hurt': -2,
  'pain': -2,
  'cramps': -2,
  'uncomfortable': -1,
  'annoyed': -1,
  'bothered': -1,
  
  // Neutral (0)
  'okay': 0,
  'fine': 0,
  'alright': 0,
  
  // Positive (1 to 5)
  'good': 2,
  'better': 2,
  'happy': 3,
  'great': 3,
  'excited': 3,
  'wonderful': 4,
  'amazing': 4,
  'fantastic': 5,
  'excellent': 5,
};

export function analyzeSentiment(text: string): SentimentResult {
  const lowerText = text.toLowerCase();
  let totalScore = 0;
  const matchedWords: string[] = [];
  
  // Check for each word in dictionary
  Object.entries(sentimentDictionary).forEach(([word, score]) => {
    if (lowerText.includes(word)) {
      totalScore += score;
      matchedWords.push(word);
    }
  });
  
  // Determine sentiment level
  let level: SentimentResult['level'];
  if (totalScore <= -3) {
    level = 'high-distress';
  } else if (totalScore < 0) {
    level = 'empathy';
  } else if (totalScore === 0) {
    level = 'neutral';
  } else {
    level = 'positive';
  }
  
  return {
    score: totalScore,
    level,
    matchedWords,
  };
}
