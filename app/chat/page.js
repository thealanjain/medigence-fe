'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { chatsAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { formatTime, getInitials } from '@/utils/helpers';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MessageSquare, ArrowRight } from 'lucide-react';

export default function ChatListPage() {
  const { role } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chatsAPI.getMyChats().then((res) => {
      setChats(res.data.data.chats || []);
    }).catch(() => {
      toast.error('Failed to load chats');
    }).finally(() => setLoading(false));
  }, []);

  const getPartnerName = (chat) => {
    if (role === 'PATIENT') {
      return chat.doctor_name || chat.doctor_email?.split('@')[0] || 'Doctor';
    }
    return chat.patient_name || chat.patient_email?.split('@')[0] || 'Patient';
  };

  const getPartnerEmail = (chat) => {
    if (role === 'PATIENT') return chat.doctor_email || '';
    return chat.patient_email || '';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="medical-gradient rounded-xl p-2.5">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">Your active conversations</p>
        </div>
      </div>

      <Card className="shadow-sm border border-border/50 bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No conversations yet</p>
              <p className="text-muted-foreground text-sm">
                {role === 'PATIENT'
                  ? 'Complete onboarding and connect with a doctor to start chatting.'
                  : 'Patients will appear here once they connect with you.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {chats.map((chat) => {
                const name = getPartnerName(chat);
                const email = getPartnerEmail(chat);
                const unread = parseInt(chat.unread_count || 0);

                return (
                  <Link key={chat.id} href={`/chat/${chat.id}`}>
                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group cursor-pointer">
                      <Avatar className="h-11 w-11 ring-2 ring-primary/20 shrink-0">
                        <AvatarFallback className="medical-gradient text-white font-semibold">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{name}</span>
                            {unread > 0 && (
                              <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0 h-5">
                                {unread}
                              </Badge>
                            )}
                          </div>
                          {chat.last_message_at && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTime(chat.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.last_message || email}
                        </p>
                      </div>

                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
