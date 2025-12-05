import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon, Save, Heart, Frown, Meh, Smile, CloudRain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Mood = 'great' | 'good' | 'okay' | 'bad' | 'awful';

const moods: { value: Mood; icon: any; label: string; color: string }[] = [
    { value: 'great', icon: Heart, label: 'Great', color: 'text-primary' }, // Uses theme primary (Teal)
    { value: 'good', icon: Smile, label: 'Good', color: 'text-emerald-500' },
    { value: 'okay', icon: Meh, label: 'Okay', color: 'text-yellow-500' },
    { value: 'bad', icon: Frown, label: 'Bad', color: 'text-orange-500' },
    { value: 'awful', icon: CloudRain, label: 'Awful', color: 'text-slate-500' },
];

export default function Journal() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [date, setDate] = useState<Date | undefined>(new Date());
    const [content, setContent] = useState("");
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Load user
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });
    }, []);

    // Load entry for selected date
    useEffect(() => {
        if (!date || !user) return;

        const loadEntry = async () => {
            setLoading(true);
            const dateStr = format(date, 'yyyy-MM-dd');

            try {
                // Try to fetch from Supabase
                const { data, error } = await supabase
                    .from('journal_entries')
                    .select('*')
                    .eq('date', dateStr)
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                    // If table doesn't exist or other error, fallback to local storage for demo
                    console.warn("Could not fetch from DB, falling back to local storage", error);
                    const localData = localStorage.getItem(`journal_${user.id}_${dateStr}`);
                    if (localData) {
                        const parsed = JSON.parse(localData);
                        setContent(parsed.content || "");
                        setSelectedMood(parsed.mood || null);
                    } else {
                        setContent("");
                        setSelectedMood(null);
                    }
                } else if (data) {
                    setContent(data.content || "");
                    setSelectedMood(data.mood as Mood || null);
                } else {
                    setContent("");
                    setSelectedMood(null);
                }
            } catch (e) {
                // Fallback
                const localData = localStorage.getItem(`journal_${user?.id}_${dateStr}`);
                if (localData) {
                    const parsed = JSON.parse(localData);
                    setContent(parsed.content || "");
                    setSelectedMood(parsed.mood || null);
                } else {
                    setContent("");
                    setSelectedMood(null);
                }
            } finally {
                setLoading(false);
            }
        };

        loadEntry();
    }, [date, user]);

    const handleSave = async () => {
        if (!date || !user) return;
        setLoading(true);
        const dateStr = format(date, 'yyyy-MM-dd');

        try {
            // 1. Save to Local Storage (Backup/Demo)
            const dataToSave = { content, mood: selectedMood, date: dateStr };
            localStorage.setItem(`journal_${user.id}_${dateStr}`, JSON.stringify(dataToSave));

            // 2. Try Save to Supabase
            const { error } = await supabase
                .from('journal_entries')
                .upsert({
                    user_id: user.id,
                    date: dateStr,
                    content,
                    mood: selectedMood,
                    created_at: new Date().toISOString()
                }, { onConflict: 'user_id, date' });

            if (error) {
                console.warn("Supabase save failed:", error);
                toast({
                    title: "Save Error",
                    description: `Cloud sync failed: ${error.message} (Code: ${error.code})`,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Entry Saved",
                    description: "Your journal entry has been saved.",
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Saved Locally",
                description: "Saved to device only.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">My Journal</h1>
                        <p className="text-muted-foreground">Express yourself freely</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-[300px_1fr] gap-6">
                    {/* Calendar Sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-3">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Editor Area */}
                    <div className="space-y-4">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-medium">
                                    {date ? format(date, 'MMMM do, yyyy') : 'Select a date'}
                                </CardTitle>
                                <div className="flex gap-1">
                                    {moods.map((m) => {
                                        const Icon = m.icon;
                                        const isSelected = selectedMood === m.value;
                                        return (
                                            <button
                                                key={m.value}
                                                onClick={() => setSelectedMood(m.value)}
                                                className={cn(
                                                    "p-2 rounded-full transition-all hover:bg-muted",
                                                    isSelected ? "bg-muted scale-110 ring-2 ring-primary ring-offset-2" : "opacity-50 hover:opacity-100"
                                                )}
                                                title={m.label}
                                            >
                                                <Icon className={cn("w-6 h-6", m.color)} />
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-[400px] flex flex-col gap-4">
                                <Textarea
                                    placeholder="Dear Diary..."
                                    className="flex-1 resize-none text-lg leading-relaxed p-4 border-none focus-visible:ring-0"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                                <div className="flex justify-end pt-4 border-t">
                                    <Button onClick={handleSave} disabled={loading || !date} className="w-full md:w-auto">
                                        <Save className="w-4 h-4 mr-2" />
                                        {loading ? 'Saving...' : 'Save Entry'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
