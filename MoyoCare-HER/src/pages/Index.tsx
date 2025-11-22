import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import SplashScreen from '../components/SplashScreen';
import HomeDashboard from '../components/HomeDashboard';
import ChatInterface from '../components/ChatInterface';
import BreathingTool from '../components/BreathingTool';
import Auth from './Auth';
import { CyclePhase } from '@/utils/contextAwareness';

type View = 'splash' | 'home' | 'chat';

export default function Index() {
  const [currentView, setCurrentView] = useState<View>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPeriodMode, setIsPeriodMode] = useState(false);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>('follicular');
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);

  const handleSplashComplete = () => {
    setCurrentView('home');
  };

  const handleNavigateToChat = () => {
    setCurrentView('chat');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const handleTogglePeriodMode = (checked: boolean) => {
    setIsPeriodMode(checked);
    if (checked && cyclePhase === 'follicular') {
      setCyclePhase('menstrual');
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-2xl text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      {currentView === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      
      {currentView === 'home' && (
        <HomeDashboard
          onNavigateToChat={handleNavigateToChat}
          onOpenBreathing={() => setIsBreathingOpen(true)}
          isPeriodMode={isPeriodMode}
          onTogglePeriodMode={handleTogglePeriodMode}
        />
      )}
      
      {currentView === 'chat' && (
        <ChatInterface
          onBack={handleBackToHome}
          isPeriodMode={isPeriodMode}
          cyclePhase={cyclePhase}
        />
      )}

      <BreathingTool
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
      />
    </>
  );
}
