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
import { Loader2, MessageSquare, Users, Stethoscope, Clock, Activity, Wifi, WifiOff } from 'lucide-react';
import { useSocketEvent } from '@/hooks/useSocket';
import { getOnlineUsers } from '@/services/socket';
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

  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Listen for online/offline events
  useSocketEvent('user_online', (data) => {
    setOnlineUsers((prev) => new Set([...prev, data.userId]));
  });

  useSocketEvent('user_offline', (data) => {
    setOnlineUsers((prev) => {
      const next = new Set(prev);
      next.delete(data.userId);
      return next;
    });
  });

  // Initial presence check
  useEffect(() => {
    const checkStatus = () => {
      getOnlineUsers((res) => {
        if (res?.success && Array.isArray(res.onlineUsers)) {
          setOnlineUsers(new Set(res.onlineUsers));
        }
      });
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
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
                const isOnline = onlineUsers.has(chat.patient_id);

                return (
                  <div
                    key={chat.id}
                    className="py-4 flex items-center gap-4 hover:bg-muted/30 px-2 rounded-lg transition-colors group"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                        <AvatarFallback className="medical-gradient text-white font-semibold">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white transition-colors duration-300',
                          isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {displayName}
                        </span>
                        {isOnline && (
                           <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-tighter">
                             <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                             Online
                           </span>
                        )}
                        {unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4.5 font-bold">
                            {unreadCount}
                          </Badge>
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
