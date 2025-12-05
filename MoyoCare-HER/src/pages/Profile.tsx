import { useState, useEffect } from "react";
import { ArrowLeft, User, Globe, Moon, Sun, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const { i18n, t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [fullName, setFullName] = useState("");

    // Use local storage for profile if Supabase profile table doesn't exist or isn't set up
    // Ideally this would sync with a 'profiles' table in Supabase
    const [localName, setLocalName] = useState(() => localStorage.getItem("user_name") || "");

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            // Try to load profile if table exists, else use local
            if (session?.user) {
                // Placeholder for future DB sync
            }
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            localStorage.setItem("user_name", localName);

            // If we had a profiles table, we would update it here:
            /*
            if (session?.user) {
              const { error } = await supabase
                .from('profiles')
                .upsert({ id: session.user.id, full_name: localName })
              if (error) throw error;
            }
            */

            toast({
                title: "Profile Updated",
                description: "Your settings have been saved successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Your Profile</h1>
                </div>

                {/* Personal Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>Tell us what to call you</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input
                                id="name"
                                placeholder="Enter your name"
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance & Language */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            Preferences
                        </CardTitle>
                        <CardDescription>Customize your experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Dark Mode</Label>
                                <p className="text-sm text-muted-foreground">
                                    Switch between light and dark themes
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sun className="h-4 w-4 text-muted-foreground" />
                                <Switch
                                    checked={theme === 'dark'}
                                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                />
                                <Moon className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Language</Label>
                            <Select value={i18n.language} onValueChange={(lang) => i18n.changeLanguage(lang)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English (Nigeria)</SelectItem>
                                    <SelectItem value="yo">Yoruba</SelectItem>
                                    <SelectItem value="ig">Igbo</SelectItem>
                                    <SelectItem value="ha">Hausa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Button className="w-full" onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
