import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Send, ArrowLeft, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CyclePhase } from '@/utils/contextAwareness';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

interface ChatInterfaceProps {
  onBack: () => void;
  isPeriodMode: boolean;
  cyclePhase: CyclePhase;
}

const quickChips = [
  'I am stressed',
  'Cramps are killing me',
  'I feel lonely',
  'Exam tomorrow'
];

const SYSTEM_PROMPT = `You are Moyo, a warm, compassionate, and professional AI Therapist for young Nigerian female students.

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
4. LENGTH: Keep responses short (2-3 sentences max). This is a chat, not an email.`;

export default function ChatInterface({ onBack, isPeriodMode, cyclePhase }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(data.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          id: msg.id
        })));
      }
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      toast({
        title: 'Could not load chat history',
        description: 'Starting a fresh conversation.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          role,
          content
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving message:', error);
      toast({
        title: 'Could not save message',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText
    };

    // Optimistically update UI
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Save user message to database
    await saveMessage('user', messageText);

    try {
      // Add context about cycle phase to the user message if needed
      let contextualMessage = messageText;
      if (isPeriodMode) {
        contextualMessage += ` [Context: User is currently in ${cyclePhase} phase of menstrual cycle]`;
      }

      // Call the secure backend edge function
      const { data, error } = await supabase.functions.invoke('chat-with-moyo', {
        body: {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: contextualMessage }
          ]
        }
      });

      if (error) {
        throw new Error('Moyo is having trouble connecting right now. Please try again.');
      }

      const aiResponse = data.choices[0]?.message?.content || 'I hear you, sis. Tell me more.';
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      await saveMessage('assistant', aiResponse);
    } catch (error) {
      console.error('Chat Error:', error);
      toast({
        title: 'Connection Error',
        description: 'Moyo is having trouble connecting right now. Please try again.',
        variant: 'destructive',
      });

      // Remove the user message if API call failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendMessage(input);
  };

  const handleChipClick = async (chipText: string) => {
    setInput(chipText);
    await handleSendMessage(chipText);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Brain className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading your conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto p-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Chat with Moyo</h1>
            <p className="text-xs text-muted-foreground">I'm here to listen, sis</p>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <Brain className="w-16 h-16 text-primary opacity-50" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Wetin dey worry you today?
              </h3>
              <p className="text-sm text-muted-foreground">
                Talk to me, sis. I dey here to listen.
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-3xl p-4 ${message.role === 'user'
                ? 'bg-primary text-white'
                : 'bg-card border border-border'
                }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-3xl p-4 bg-accent/10 border border-accent/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Brain className="w-4 h-4 animate-pulse" />
                Moyo is thinking...
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 bg-card border-t border-border shadow-lg">
        <div className="max-w-4xl mx-auto p-4 space-y-3">
          {/* Quick Chips */}
          {messages.length === 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {quickChips.map((chip, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleChipClick(chip)}
                  disabled={isThinking}
                  className="flex-shrink-0 rounded-full"
                >
                  {chip}
                </Button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[50px] max-h-[120px] resize-none rounded-3xl"
              disabled={isThinking}
              rows={1}
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="flex-shrink-0"
              disabled={isThinking}
            >
              <Mic className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={isThinking || !input.trim()}
              className="flex-shrink-0 bg-primary hover:bg-primary/90 rounded-full"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
}