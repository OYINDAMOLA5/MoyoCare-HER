// Context Awareness Engine
import { Intent } from './intentClassification';
import { SentimentResult } from './sentimentAnalysis';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface ContextData {
  isPeriodMode: boolean;
  cyclePhase: CyclePhase;
}

export interface ResponseContext {
  sentiment: SentimentResult;
  intent: Intent;
  context: ContextData;
  thinking: string[];
}

const phaseDescriptions: Record<CyclePhase, string> = {
  menstrual: 'Menstrual Phase (Days 1-5)',
  follicular: 'Follicular Phase (Days 6-13)',
  ovulation: 'Ovulation Phase (Days 14-16)',
  luteal: 'Luteal Phase (Days 17-28)'
};

export function generateResponse(responseContext: ResponseContext): {
  response: string;
  thinking: string[];
  resources?: string[];
} {
  const { sentiment, intent, context } = responseContext;
  const thinking: string[] = [];
  
  // Thinking process visualization with Nigerian flavor
  thinking.push(`Analyzing sentiment: ${sentiment.level.toUpperCase()}`);
  thinking.push(`Intent classified as: ${intent}`);
  thinking.push(`Context: ${phaseDescriptions[context.cyclePhase]}`);
  thinking.push(`Period Mode: ${context.isPeriodMode ? 'Active' : 'Inactive'}`);
  thinking.push('Moyo is preparing response...');
  
  // CRISIS MODE - Safety protocols (Nigerian resources)
  if (intent === 'CRISIS' || sentiment.level === 'high-distress') {
    thinking.push('⚠️ CRISIS PROTOCOL ACTIVATED');
    return {
      response: `Sis, abeg listen to me. Your life matters pass anything. I dey beg you, please reach out for help now:\n\n🆘 **Emergency Help:**\n• Nigeria Emergency: 112\n• Mental Health Helpline: 0800 9000 0009\n• Crisis Text Line: Text HOME to 741741\n\nYou no dey alone. People wey care about you dey. Please call somebody now. 💜`,
      thinking,
      resources: [
        'Nigeria Emergency: 112',
        'Mental Health Helpline: 0800 9000 0009',
        'Crisis Text Line: 741741'
      ]
    };
  }
  
  // PHYSICAL INTENT with Context Awareness (Nigerian style)
  if (intent === 'PHYSICAL') {
    thinking.push('Generating context-aware physical wellness advice...');
    
    if (context.isPeriodMode) {
      return {
        response: `Sis, I hear you - period pain no be joke at all. Since na ${phaseDescriptions[context.cyclePhase]} you dey, make I give you some tips:\n\n🌡️ **For Cramps & Pain:**\n• Use hot water bottle for your belle\n• Try small small stretching or yoga\n• Drink warm ginger tea - e dey help well well\n\n💊 **Wetin You Fit Do:**\n• Take Ibuprofen (if e fit you)\n• Try magnesium supplements\n• Rest well, no stress yourself\n\n${context.cyclePhase === 'menstrual' ? 'This na the hardest time, sis. Be gentle with yourself, you hear? 💛' : 'Your body dey work hard. Make you rest and take am easy. ✨'}`,
        thinking
      };
    } else {
      return {
        response: `Sis, I dey feel you. Body pain fit be from wahala or stress. Make I help you:\n\n💧 **Small Small Self-Care:**\n• Drink plenty water (e dey important)\n• Sleep well - at least 7-8 hours\n• Take breaks, no overdo am\n\n🌿 **Natural Ways to Feel Better:**\n• Do small breathing exercise\n• Stretch your body small\n• Go outside, breathe fresh air\n\nIf e still dey pain you after some days, abeg go see doctor. Take care of yourself! 🌸`,
        thinking
      };
    }
  }
  
  // ACADEMIC INTENT with Empathy (Nigerian style)
  if (intent === 'ACADEMIC') {
    thinking.push('Providing academic support with cycle awareness...');
    
    const academicResponse = `School wahala is real, sis. ${context.isPeriodMode ? 'E dey even harder when you dey on your period' : 'But no worry, you fit do am'}.\n\n📚 **How to Manage the Stress:**\n• Break your work into small small parts\n• Study for 25 minutes, rest 5 minutes (Pomodoro)\n• No pressure yourself too much\n\n${context.cyclePhase === 'luteal' ? '⚠️ Note: You dey Luteal Phase - your brain fit dey tire well well. E normal, just take am easy!' : ''}\n\n🧠 **Study Tips:**\n• Read small small, no cram marathon\n• Face the important topics first\n• Remember: One exam no go define who you be\n\nYou go do am, sis! I believe in you! 💪`;
    
    return {
      response: academicResponse,
      thinking
    };
  }
  
  // EMOTIONAL SUPPORT (Nigerian style)
  if (intent === 'EMOTIONAL' || sentiment.level === 'empathy') {
    thinking.push('Activating empathy mode...');
    
    return {
      response: `Sis, I dey here for you. ${context.isPeriodMode ? 'Your feelings dey valid - hormones fit cause plenty emotions during your period.' : 'Wetin you dey feel na real thing.'}\n\n💜 **Wetin Fit Help:**\n• Talk to person wey you trust\n• Write how you dey feel for diary\n• Do wetin dey make you happy\n• Remember: This feeling go pass\n\n${context.cyclePhase === 'luteal' ? '🌙 You dey Luteal Phase - hormones fit make your emotions strong well well. E no be weakness, na biology.' : ''}\n\nTake am easy with yourself today, you hear? 🌸`,
      thinking
    };
  }
  
  // POSITIVE / GENERAL (Nigerian style)
  thinking.push('Generating supportive response...');
  return {
    response: `${sentiment.level === 'positive' ? 'Ah sis! I dey happy say you dey do well! 😊' : 'Sis, I dey here for you.'}\n\nWetin you need help with today? I fit help with:\n• Period wahala and how to manage am\n• School stress and exam prep\n• Emotional wellness tips\n• Self-care advice based on your cycle\n\nTalk to me, I dey listen. 💛`,
    thinking
  };
}
