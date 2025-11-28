import { useState } from 'react';
import { MessageCircle, Wind, Menu, Sparkles, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HomeDashboardProps {
  onNavigateToChat: () => void;
  onOpenBreathing: () => void;
  isPeriodMode: boolean;
  onTogglePeriodMode: (checked: boolean) => void;
}

const wisdomTips = [
  { title: 'Exam Prep', text: 'Break study into small chunks, sis', icon: '📚' },
  { title: 'Safety Tip', text: 'Always let someone know where you are', icon: '🛡️' },
  { title: 'Self Love', text: 'You are enough, exactly as you are', icon: '💜' },
  { title: 'Rest Well', text: 'Sleep na medicine, make you rest well', icon: '😴' },
  { title: 'Stay Hydrated', text: 'Water na life, drink am well', icon: '💧' },
];

export default function HomeDashboard({
  onNavigateToChat,
  onOpenBreathing,
  isPeriodMode,
  onTogglePeriodMode,
}: HomeDashboardProps) {
  const { toast } = useToast();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className={`sticky top-0 z-10 transition-colors duration-300 ${isPeriodMode
          ? 'bg-gradient-to-r from-accent/30 to-accent/20'
          : 'bg-card'
          } border-b border-border shadow-sm`}
      >
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
                {getGreeting()}, Sis 👋
              </h1>
              <p className="text-sm text-muted-foreground">How are you feeling today?</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Cycle Context Toggle */}
          <Card className={`p-3 md:p-4 transition-all duration-300 ${isPeriodMode ? 'bg-accent/20 border-accent/40' : ''
            }`}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="cycle-toggle" className="text-sm md:text-base font-semibold flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${isPeriodMode ? 'text-accent' : 'text-muted-foreground'}`} />
                  <span className="truncate">Cycle Context</span>
                </Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {isPeriodMode ? 'Menstrual Phase Active' : 'Follicular Phase'}
                </p>
              </div>
              <Switch
                id="cycle-toggle"
                checked={isPeriodMode}
                onCheckedChange={onTogglePeriodMode}
                className="ml-2 shrink-0"
              />
            </div>
          </Card>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-3 md:p-4 space-y-4 md:space-y-6">
        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-primary to-primary/80 text-white"
              onClick={onNavigateToChat}
            >
              <MessageCircle className="w-10 h-10 mb-3" />
              <h3 className="font-bold text-lg">Chat with Moyo</h3>
              <p className="text-sm text-white/90 mt-1">I'm here to listen</p>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-secondary to-secondary/80 text-white"
              onClick={onOpenBreathing}
            >
              <Wind className="w-10 h-10 mb-3" />
              <h3 className="font-bold text-lg">Quick Breathe</h3>
              <p className="text-sm text-white/90 mt-1">Calm your mind</p>
            </Card>
          </div>
        </section>

        {/* Daily Wisdom */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Daily Wisdom</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {wisdomTips.map((tip, index) => (
              <Card
                key={index}
                className="flex-shrink-0 w-48 md:w-64 p-3 md:p-4 cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="text-2xl md:text-3xl mb-2">{tip.icon}</div>
                <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">{tip.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-tight">{tip.text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Info Banner */}
        <Card className="p-4 bg-muted/50 border-border">
          <p className="text-sm text-muted-foreground text-center">
            <strong>MoyoCare-Her:</strong> Your safe space for mental and menstrual wellness.
            I'm here for you, sis. 💜
          </p>
        </Card>
      </main>
    </div>
  );
}
