import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Send, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CyclePhase } from '@/utils/contextAwareness';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import ConversationHistory from '@/components/ConversationHistory';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  language?: string;
}

interface ChatInterfaceProps {
  onBack: () => void;
  isPeriodMode: boolean;
  cyclePhase: CyclePhase;
}

export default function ChatInterface({ onBack, isPeriodMode, cyclePhase }: ChatInterfaceProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [crisisAlert, setCrisisAlert] = useState<{ show: boolean; type: string }>({ show: false, type: '' });
  const [showHistory, setShowHistory] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, [selectedSessionId]);

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
      content: messageText,
      language: i18n.language,
    };

    // Optimistically update UI
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Save user message to database
    await saveMessage('user', messageText);

    try {
      // Build complete message history including the current user message
      const completeMessages = [
        ...messages,
        { role: 'user' as const, content: messageText }
      ].map(m => ({ role: m.role, content: m.content }));

      // Call the secure backend edge function with language and full history
      const { data, error } = await supabase.functions.invoke('chat-with-moyo', {
        body: {
          messages: completeMessages,
          language: i18n.language,
        }
      });

      if (error) {
        throw new Error('Moyo is having trouble connecting right now. Please try again.');
      }

      const aiResponse = data.choices[0]?.message?.content || 'I hear you, sis. Tell me more.';
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        language: data.language || i18n.language,
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage('assistant', aiResponse);

      // Check for crisis indicators from backend
      if (data.crisis?.isCrisis) {
        setCrisisAlert({ show: true, type: data.crisis.type });
        toast({
          title: '⚠️ We care about you',
          description: 'If you\'re in immediate danger, please reach out to a counselor or crisis line.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error in chat:', error);
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsThinking(false);
    }
  };

  const quickChips = [
    t('quick_chips.stressed'),
    t('quick_chips.cramps'),
    t('quick_chips.lonely'),
    t('quick_chips.exam'),
  ];

  return (
    <div className="h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-pink-200 px-4 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          title="Go back"
          className="p-2 hover:bg-pink-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-pink-600" />
        </button>
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-pink-600" />
          <h1 className="text-2xl font-bold text-pink-600">Chat with Moyo</h1>
        </div>
        <Select value={i18n.language} onValueChange={(lang) => i18n.changeLanguage(lang)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('language')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t('english')}</SelectItem>
            <SelectItem value="yo">{t('yoruba')}</SelectItem>
            <SelectItem value="ig">{t('igbo')}</SelectItem>
            <SelectItem value="ha">{t('hausa')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content - Flex Row with History Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar History */}
        <ConversationHistory
          onSelectSession={(sessionId) => {
            setSelectedSessionId(sessionId);
            if (sessionId === null) {
              setMessages([]);
            }
          }}
          onNewChat={() => {
            setMessages([]);
            setSelectedSessionId(null);
          }}
          currentSessionId={selectedSessionId}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {crisisAlert.show && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                <p className="text-red-800 font-semibold">⚠️ Your wellbeing matters</p>
                <p className="text-red-700 text-sm mt-1">If you're in crisis, please reach out to a counselor or emergency service immediately.</p>
                <button
                  onClick={() => setCrisisAlert({ show: false, type: '' })}
                  className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
                >
                  Dismiss
                </button>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Brain className="w-12 h-12 text-pink-300 mb-4" />
                <p className="text-gray-500 mb-4">No messages yet. Let's start chatting!</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickChips.map(chip => (
                    <button
                      key={chip}
                      onClick={() => handleSendMessage(chip)}
                      className="px-4 py-2 bg-pink-200 text-pink-800 rounded-full hover:bg-pink-300 transition text-sm"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg ${message.role === 'user'
                      ? 'bg-pink-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-pink-200 rounded-bl-none'
                      }`}
                  >
                    <p className="break-words">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-pink-200 rounded-lg rounded-bl-none px-4 py-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse opacity-75"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse opacity-50"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-pink-200 p-4 space-y-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chat_placeholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(input);
                  }
                }}
                className="flex-1 resize-none border-pink-300 focus:border-pink-500"
                rows={2}
              />
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isThinking}
                className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2 h-fit"
              >
                <Send className="w-4 h-4" />
                {t('send_button')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
