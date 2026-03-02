'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { chatsAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatTime, getInitials } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Users, Stethoscope, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chatsAPI.getMyChats().then((res) => {
      setChats(res.data.data.chats || []);
    }).catch(() => {
      toast.error('Failed to load patient list');
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: 'Assigned Patients',
      value: chats.length,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Unread Messages',
      value: chats.reduce((sum, c) => sum + (parseInt(c.unread_count) || 0), 0),
      icon: MessageSquare,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Active Conversations',
      value: chats.filter((c) => c.last_message).length,
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome header */}
      <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6">
        <div className="flex items-center gap-4">
          <div className="medical-gradient rounded-2xl p-3">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good day, Dr. {user?.email?.split('@')[0]}!
            </h1>
            <p className="text-muted-foreground mt-0.5">Here&apos;s an overview of your assigned patients</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm border border-border/50 bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn('rounded-xl p-3', bg)}>
                <Icon className={cn('h-6 w-6', color)} />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Patient list */}
      <Card className="shadow-sm border border-border/50 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Assigned Patients
          </CardTitle>
          <CardDescription>
            Click &quot;Open Chat&quot; to start a real-time conversation with your patient
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No patients assigned yet</p>
              <p className="text-muted-foreground text-sm">
                Patients will appear here once they complete onboarding and select you
              </p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/50">
              {chats.map((chat) => {
                const displayName = chat.patient_name || chat.patient_email?.split('@')[0] || 'Patient';
                const unreadCount = parseInt(chat.unread_count || 0);

                return (
                  <div
                    key={chat.id}
                    className="py-4 flex items-center gap-4 hover:bg-muted/30 px-2 rounded-lg transition-colors"
                  >
                    <Avatar className="h-11 w-11 ring-2 ring-primary/20 shrink-0">
                      <AvatarFallback className="medical-gradient text-white font-semibold">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-foreground truncate">{displayName}</span>
                        {unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0 h-5">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {chat.specialization && (
                          <span className="text-xs text-muted-foreground">
                            {chat.specialization}
                          </span>
                        )}
                        {chat.last_message_at && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(chat.last_message_at)}
                          </span>
                        )}
                        {chat.last_message && (
                          <span className="text-xs text-muted-foreground italic truncate max-w-xs">
                            &ldquo;{chat.last_message}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => router.push(`/chat/${chat.id}`)}
                      className="medical-gradient border-0 text-white hover:opacity-90 gap-2 shrink-0"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Open Chat
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
