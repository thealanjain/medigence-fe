'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { messagesAPI, chatsAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/services/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { formatTime, getInitials } from '@/utils/helpers';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  emitTypingStart, 
  emitTypingStop, 
  joinChat, 
  sendSocketMessage, 
  emitMarkRead,
  getOnlineUsers 
} from '@/services/socket';

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="chat-bubble-received px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/60 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/60 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/60 typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default function ChatRoomPage() {
  const { chatId } = useParams();
  const { user, role } = useAuth();
  const router = useRouter();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [joined, setJoined] = useState(false);

  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Derive partner info from flat chat object
  const getPartnerName = useCallback(() => {
    if (!chat) return 'Loading…';
    if (role === 'PATIENT') return chat.doctor_name || chat.doctor_email?.split('@')[0] || 'Doctor';
    return chat.patient_name || chat.patient_email?.split('@')[0] || 'Patient';
  }, [chat, role]);

  const getPartnerId = useCallback(() => {
    if (!chat) return null;
    return role === 'PATIENT' ? chat.doctor_id : chat.patient_id;
  }, [chat, role]);

  // Load chat and messages
  useEffect(() => {
    async function load() {
      try {
        const [chatRes, msgRes] = await Promise.all([
          chatsAPI.getChatById(chatId),
          messagesAPI.getMessages(chatId),
        ]);
        setChat(chatRes.data.data.chat);
        setMessages(msgRes.data.data.messages || []);
      } catch {
        toast.error('Failed to load chat');
        router.push('/chat');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [chatId, router]);

  // Join socket room once chat is loaded
  useEffect(() => {
    const socket = getSocket();
    if (!socket || joined || !chat) return;
    joinChat(chatId, (ack) => {
      if (ack?.success) {
        setJoined(true);
        emitMarkRead(chatId);
      }
    });
  }, [chatId, joined, chat]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Socket event: receive message
  useSocketEvent('receive_message', useCallback((msg) => {
    if (msg.chat_id === chatId) {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
      emitMarkRead(chatId);
    }
  }, [chatId]));

  // Socket event: typing
  useSocketEvent('typing_start', useCallback(({ chatId: cId, userId }) => {
    if (cId === chatId && userId !== user?.id) setIsTyping(true);
  }, [chatId, user?.id]));

  useSocketEvent('typing_stop', useCallback(({ chatId: cId, userId }) => {
    if (cId === chatId && userId !== user?.id) setIsTyping(false);
  }, [chatId, user?.id]));

  // Socket event: presence
  useSocketEvent('user_online', useCallback(({ userId }) => {
    if (userId === getPartnerId()) setPartnerOnline(true);
  }, [getPartnerId]));

  useSocketEvent('user_offline', useCallback(({ userId }) => {
    if (userId === getPartnerId()) setPartnerOnline(false);
  }, [getPartnerId]));

  // Initial presence check
  useEffect(() => {
    const partnerId = getPartnerId();
    if (!partnerId) return;

    const checkStatus = () => {
      getOnlineUsers((res) => {
        if (res?.success && Array.isArray(res.onlineUsers)) {
          setPartnerOnline(res.onlineUsers.includes(partnerId));
        }
      });
    };

    checkStatus();
    // Also re-check occasionally in case of socket sync issues
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [getPartnerId]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTypingStart(chatId);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emitTypingStop(chatId), 1500);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    emitTypingStop(chatId);
    setInput('');
    setSending(true);

    // Optimistic message
    const optimisticId = `opt-${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: user?.id,
      message_text: text,
      created_at: new Date().toISOString(),
      is_read: false,
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    sendSocketMessage(chatId, text, (ack) => {
      setSending(false);
      if (ack?.success) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === ack.message.id);
          if (exists) {
            return prev.filter((m) => m.id !== optimisticId);
          }
          return prev.map((m) =>
            m.id === optimisticId ? { ...ack.message, _optimistic: false } : m
          );
        });
      } else {
        // Fallback: REST API
        messagesAPI.sendMessage({ chat_id: chatId, message_text: text })
          .then((res) => {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === res.data.data.message.id);
              if (exists) {
                return prev.filter((m) => m.id !== optimisticId);
              }
              return prev.map((m) =>
                m.id === optimisticId ? { ...res.data.data.message, _optimistic: false } : m
              );
            });
          })
          .catch(() => {
            toast.error('Failed to send message');
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          });
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading chat…</p>
        </div>
      </div>
    );
  }

  const partnerName = getPartnerName();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-border/50 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/chat')}
          className="rounded-full shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarFallback className="medical-gradient text-white font-semibold text-sm">
              {getInitials(partnerName)}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white',
              partnerOnline ? 'bg-green-500' : 'bg-gray-300'
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">{partnerName}</div>
          <div className="flex items-center gap-1.5">
            {partnerOnline ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-muted-foreground">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-3">👋</div>
              <p className="font-medium">Start the conversation!</p>
              <p className="text-sm">Send your first message below.</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === user?.id;
          const prev = messages[idx - 1];
          const showTimestamp =
            idx === 0 ||
            new Date(msg.created_at) - new Date(prev?.created_at) > 5 * 60 * 1000;

          return (
            <div key={msg.id}>
              {showTimestamp && (
                <div className="flex justify-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={cn('flex mb-1.5', isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-2.5 text-sm leading-relaxed',
                    isMine ? 'chat-bubble-sent' : 'chat-bubble-received',
                    msg._optimistic && 'opacity-60'
                  )}
                >
                  {msg.message_text}
                  {isMine && (
                    <span className="text-[10px] ml-2 opacity-60 align-bottom">
                      {msg.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ─── Input ─── */}
      <div className="px-4 py-3 bg-white border-t border-border/50">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="rounded-full border-border/60 bg-muted/30 focus-visible:ring-primary/30"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="rounded-full medical-gradient border-0 text-white hover:opacity-90 h-10 w-10 p-0 shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
