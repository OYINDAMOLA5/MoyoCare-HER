import { useState, useEffect } from 'react';
import { MessageCircle, Wind, Menu, Sparkles, LogOut, BookHeart, User } from 'lucide-react';
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

const wisdomCategories = {
  "Exam Prep": [
    { text: "Break study into small chunks, sis", icon: "📚" },
    { text: "Teach what you learned to a friend", icon: "🗣️" },
    { text: "Take 5 minute breaks every 25 minutes", icon: "⏱️" },
    { text: "Drink water before your exam", icon: "💧" },
    { text: "Review your notes before sleeping", icon: "🌙" },
    { text: "Focus on understanding, not just memorizing", icon: "🧠" },
    { text: "Practice with past questions today", icon: "📝" },
  ],
  "Safety Tip": [
    { text: "Always let someone know where you are", icon: "🛡️" },
    { text: "Trust your gut instinct, it's powerful", icon: "👀" },
    { text: "Keep emergency numbers on speed dial", icon: "📞" },
    { text: "Be aware of your surroundings when walking", icon: "🚶‍♀️" },
    { text: "Share your live location with a trusted friend", icon: "📍" },
    { text: "Don't share personal info with strangers", icon: "🤐" },
    { text: "Meet new people in public places first", icon: "☕" },
  ],
  "Self Love": [
    { text: "You are enough, exactly as you are", icon: "💜" },
    { text: "Treat yourself with kindness today", icon: "🥰" },
    { text: "Celebrate your small wins, they count", icon: "🎉" },
    { text: "Don't compare your Chapter 1 to someone's Chapter 20", icon: "🚫" },
    { text: "Your feelings are valid, sis", icon: "🫂" },
    { text: "Forgive yourself for yesterday's mistakes", icon: "🕊️" },
    { text: "Speak to yourself like you would a best friend", icon: "🗣️" },
  ],
  "Rest Well": [
    { text: "Sleep na medicine, make you rest well", icon: "😴" },
    { text: "Put your phone away 30 mins before bed", icon: "📵" },
    { text: "Listen to your body when it says stop", icon: "🛑" },
    { text: "A short nap can reset your brain", icon: "🔋" },
    { text: "Create a calming bedtime routine", icon: "🧘‍♀️" },
    { text: "Darken your room for better sleep", icon: "🌑" },
    { text: "Reading a book helps you relax better than scrolling", icon: "📖" },
  ],
  "Stay Hydrated": [
    { text: "Water na life, drink am well", icon: "💧" },
    { text: "Drink a glass of water first thing in the morning", icon: "🌅" },
    { text: "Carry a water bottle with you everywhere", icon: "🥤" },
    { text: "Eating fruits counts as hydration too!", icon: "🍉" },
    { text: "Drink water before you feel thirsty", icon: "🕒" },
    { text: "Your skin glows when you drink water", icon: "✨" },
    { text: "Replace one soda with water today", icon: "🔄" },
  ]
};

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
              className="p-6 cursor-pointer hover:shadow-lg transition-all bg-primary text-primary-foreground"
              onClick={onNavigateToChat}
            >
              <MessageCircle className="w-10 h-10 mb-3" />
              <h3 className="font-bold text-lg">Chat with Moyo</h3>
              <p className="text-sm text-white/90 mt-1">I'm here to listen</p>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-all bg-secondary text-secondary-foreground"
              onClick={onOpenBreathing}
            >
              <Wind className="w-10 h-10 mb-3" />
              <h3 className="font-bold text-lg">Quick Breathe</h3>
              <p className="text-sm text-white/90 mt-1">Calm your mind</p>
            </Card>

            {/* New Actions */}
            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-all bg-accent text-accent-foreground"
              onClick={() => window.location.href = '/journal'}
            >
              <BookHeart className="w-10 h-10 mb-3" />
              <h3 className="font-bold text-lg">Journal</h3>
              <p className="text-sm text-white/90 mt-1">Write your thoughts</p>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-all bg-muted text-foreground"
              onClick={() => window.location.href = '/profile'}
            >
              <User className="w-10 h-10 mb-3" />
              <h3 className="font-bold text-lg">Profile</h3>
              <p className="text-sm text-white/90 mt-1">Adjust your settings</p>
            </Card>
          </div>
        </section>

        {/* Daily Wisdom */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Daily Wisdom</h2>
          <DailyWisdom />
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
function DailyWisdom() {
  const [dailyTips, setDailyTips] = useState<{ title: string; text: string; icon: string }[]>([]);

  useEffect(() => {
    const generateTips = async () => {
      // 1. Get User ID (or use a default fallback for guests)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "guest_user";

      // 2. Get Date String
      const dateStr = new Date().toDateString();

      // 3. Generate Tips deterministically
      const categories = Object.keys(wisdomCategories) as (keyof typeof wisdomCategories)[];
      const newTips = categories.map(category => {
        const tips = wisdomCategories[category];

        // Simple hash function: UserID + Date + Category Name
        const seed = userId + dateStr + category;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % tips.length;
        return {
          title: category,
          ...tips[index] // { text, icon }
        };
      });

      setDailyTips(newTips);
    };

    generateTips();
  }, []); // Run once on mount

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
      {dailyTips.map((tip, index) => (
        <Card
          key={index}
          className="flex-shrink-0 w-64 p-4 cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-primary"
        >
          <div className="text-3xl mb-3">{tip.icon}</div>
          <h3 className="font-bold text-lg mb-1">{tip.title}</h3>
          <p className="text-sm text-muted-foreground">{tip.text}</p>
        </Card>
      ))}
    </div>
  );
}
