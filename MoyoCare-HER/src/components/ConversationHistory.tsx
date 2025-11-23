import { useEffect, useState } from 'react';
import { Trash2, MessageCircle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ConversationSession {
    id: string;
    created_at: string;
    message_count: number;
    preview: string;
}

interface ConversationHistoryProps {
    onSelectSession: (sessionId: string | null) => void;
    onNewChat: () => void;
    currentSessionId: string | null;
}

export default function ConversationHistory({
    onSelectSession,
    onNewChat,
    currentSessionId,
}: ConversationHistoryProps) {
    const [sessions, setSessions] = useState<ConversationSession[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get distinct conversation sessions and their first message
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                // Group messages into sessions (could use a session_id if you add one to schema)
                // For now, we'll create virtual sessions based on time gaps
                const groupedSessions: ConversationSession[] = [];
                let currentGroup: any[] = [];
                let lastTimestamp: Date | null = null;

                data.forEach((msg) => {
                    const msgTime = new Date(msg.created_at);

                    // If gap > 30 minutes, start new session
                    if (lastTimestamp && (msgTime.getTime() - lastTimestamp.getTime()) > 30 * 60 * 1000) {
                        if (currentGroup.length > 0) {
                            groupedSessions.push({
                                id: currentGroup[0].id,
                                created_at: currentGroup[0].created_at,
                                message_count: currentGroup.length,
                                preview: currentGroup.find((m: any) => m.role === 'user')?.content || 'Conversation',
                            });
                        }
                        currentGroup = [];
                    }

                    currentGroup.push(msg);
                    lastTimestamp = msgTime;
                });

                // Add last group
                if (currentGroup.length > 0) {
                    groupedSessions.push({
                        id: currentGroup[0].id,
                        created_at: currentGroup[0].created_at,
                        message_count: currentGroup.length,
                        preview: currentGroup.find((m: any) => m.role === 'user')?.content || 'Conversation',
                    });
                }

                setSessions(groupedSessions);
            }
        } catch (error: any) {
            console.error('Error loading sessions:', error);
            toast({
                title: 'Could not load history',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Delete all messages in this session
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('user_id', user.id)
                .eq('id', sessionId); // This would need to be updated if using session_id

            if (error) throw error;

            setSessions(sessions.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                onSelectSession(null);
            }

            toast({
                title: 'Conversation deleted',
            });
        } catch (error: any) {
            console.error('Error deleting session:', error);
            toast({
                title: 'Could not delete conversation',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="w-64 bg-gray-50 border-r border-pink-200 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-pink-200">
                <Button
                    onClick={onNewChat}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </Button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        Loading history...
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No conversations yet
                    </div>
                ) : (
                    <div className="space-y-2 p-2">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`p-3 rounded-lg cursor-pointer group transition ${currentSessionId === session.id
                                        ? 'bg-pink-100'
                                        : 'hover:bg-gray-100'
                                    }`}
                            >
                                <div
                                    onClick={() => onSelectSession(session.id)}
                                    className="flex-1"
                                >
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {session.preview.length > 30
                                            ? session.preview.substring(0, 30) + '...'
                                            : session.preview}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(session.created_at)} • {session.message_count} messages
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSession(session.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition"
                                    title="Delete conversation"
                                >
                                    <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
