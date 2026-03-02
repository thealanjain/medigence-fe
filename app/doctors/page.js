'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doctorsAPI, onboardingAPI, chatsAPI } from '@/services/api';
import { useSocketEvent, useSocketEmit } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { getErrorMessage, getInitials } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Stethoscope, Wifi, WifiOff, ArrowRight, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function DoctorCard({ doctor, onlineUsers, onConnect, connecting }) {
  const isOnline = onlineUsers.has(doctor.user_id);

  return (
    <Card className={`group shadow-sm hover:shadow-lg border border-border/50 bg-white transition-all duration-500 hover:-translate-y-1 ${isOnline ? 'ring-1 ring-green-100 shadow-green-50/50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar className={`h-14 w-14 ring-2 transition-all duration-500 ${isOnline ? 'ring-green-400/30' : 'ring-primary/20'}`}>
              <AvatarFallback className={`${isOnline ? 'bg-green-600' : 'medical-gradient'} text-white text-lg font-semibold transition-colors duration-500`}>
                {getInitials(doctor.name || 'Dr')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5">
              <div className={`h-4 w-4 rounded-full border-2 border-white transition-all duration-500 ${isOnline ? 'bg-green-500 scale-110' : 'bg-gray-300 scale-100'}`} />
              {isOnline && (
                <div className="absolute inset-0 h-4 w-4 rounded-full bg-green-500 animate-ping-slow -z-10" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
                  {doctor.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {doctor.specialization}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 gap-1.5 font-medium transition-all duration-500 ${
                  isOnline
                    ? 'border-green-200 bg-green-50 text-green-700 shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                {isOnline ? (
                  <>
                    <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Online
                  </>
                ) : (
                  <><WifiOff className="h-3 w-3" /> Offline</>
                )}
              </Badge>
            </div>

            {doctor.bio && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                {doctor.bio}
              </p>
            )}

            {doctor.available_slots?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {doctor.available_slots.map((slot) => (
                  <Badge key={slot} variant="secondary" className="text-[10px] font-normal uppercase tracking-wider">
                    {slot}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => onConnect(doctor)}
            disabled={connecting === doctor.id}
            className={`border-0 text-white hover:opacity-90 gap-2 transition-all duration-300 ${isOnline ? 'bg-green-600 hover:bg-green-700' : 'medical-gradient'}`}
            size="sm"
          >
            {connecting === doctor.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [confirmDoctor, setConfirmDoctor] = useState(null);
  const [alreadyHasChat, setAlreadyHasChat] = useState(false);
  const emit = useSocketEmit();

  useEffect(() => {
    async function loadData() {
      try {
        const docRes = await doctorsAPI.getAll();
        const fetchedDoctors = docRes.data.data.doctors || [];
        setDoctors(fetchedDoctors);

        // Initialize online users from API
        const initialOnline = fetchedDoctors
          .filter((d) => d.is_online)
          .map((d) => d.user_id);
        
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          initialOnline.forEach(id => next.add(id));
          return next;
        });

        // Also get initial online users from socket
        emit('get_online_users', (res) => {
          if (res?.success && res.onlineUsers) {
            setOnlineUsers((prev) => {
              const next = new Set(prev);
              res.onlineUsers.forEach(id => next.add(id));
              return next;
            });
          }
        });

        // Check if patient already has a chat (already submitted onboarding)
        try {
          const chatRes = await chatsAPI.getMyChats();
          const chats = chatRes.data.data.chats || [];
          if (chats.length > 0) setAlreadyHasChat(true);
        } catch {}
      } catch {
        toast.error('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [emit]);

  useSocketEvent('user_online', useCallback(({ userId }) => {
    setOnlineUsers((prev) => new Set([...prev, userId]));
  }, []));

  useSocketEvent('user_offline', useCallback(({ userId }) => {
    setOnlineUsers((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }, []));

  const handleConnectClick = (doctor) => setConfirmDoctor(doctor);

  const handleConfirmConnect = async () => {
    const doctor = confirmDoctor;
    setConfirmDoctor(null);
    setConnecting(doctor.id);

    try {
      let chatId = null;

      if (alreadyHasChat) {
        // Already submitted — find existing chat
        const chatRes = await chatsAPI.getMyChats();
        const chats = chatRes.data.data.chats || [];
        const match = chats.find((c) => c.doctor_id === doctor.user_id);
        chatId = match?.id || chats[0]?.id;
      } else {
        // Save preferred doctor to step-3, then submit
        let step3Draft = {};
        try {
          const draftRes = await onboardingAPI.getDraft();
          const draft = draftRes.data.data.drafts?.find((d) => d.step_number === 3);
          if (draft?.data) {
            step3Draft = typeof draft.data === 'string' ? JSON.parse(draft.data) : draft.data;
          }
        } catch {}

        await onboardingAPI.saveStep3({ ...step3Draft, preferred_doctor_id: doctor.id });
        const submitRes = await onboardingAPI.submit();
        chatId = submitRes.data.data?.chat?.id;

        if (!chatId) {
          const chatRes = await chatsAPI.getMyChats();
          chatId = chatRes.data.data.chats?.[0]?.id;
        }
        setAlreadyHasChat(true);
      }

      if (chatId) {
        toast.success(`Connected with ${doctor.name}!`);
        router.push(`/chat/${chatId}`);
      } else {
        toast.error('Chat could not be created. Please try again.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConnecting(null);
    }
  };

  const onlineCount = doctors.filter((d) => onlineUsers.has(d.user_id)).length;

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl medical-gradient mb-4 shadow-lg">
          <Stethoscope className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Choose Your Doctor</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Browse available doctors and connect with the one that suits you best.
          Green badge means they are currently online.
        </p>
      </div>

      {!loading && (
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white rounded-full px-4 py-2 shadow-sm border border-border/50">
            <Users className="h-4 w-4 text-primary" />
            <span><strong className="text-foreground">{doctors.length}</strong> Doctors registered</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white rounded-full px-4 py-2 shadow-sm border border-border/50">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span><strong className="text-foreground">{onlineCount}</strong> Online now</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading available doctors…</p>
          </div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border/50 shadow-sm">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-lg">No doctors registered yet</p>
          <p className="text-muted-foreground text-sm">Please check back later.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onlineUsers={onlineUsers}
              onConnect={handleConnectClick}
              connecting={connecting}
            />
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDoctor} onOpenChange={() => setConfirmDoctor(null)}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="medical-gradient h-2" />
          <div className="p-6 pt-8 text-center">
            <div className="mx-auto w-20 h-20 rounded-full medical-gradient p-1 mb-6 shadow-lg shadow-primary/20">
              <Avatar className="h-full w-full border-4 border-white">
                <AvatarFallback className="bg-white text-primary text-2xl font-bold">
                  {getInitials(confirmDoctor?.name || 'Dr')}
                </AvatarFallback>
              </Avatar>
            </div>

            <DialogHeader className="text-center sm:text-center space-y-2">
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                Connect with {confirmDoctor?.name}?
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground px-4">
                You're about to start a private consultation with {confirmDoctor?.specialization}.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 flex flex-col gap-3">
              <Button
                className="w-full h-12 text-base font-semibold medical-gradient border-0 text-white hover:opacity-90 shadow-md transition-all active:scale-[0.98]"
                onClick={handleConfirmConnect}
              >
                Confirm & Connect
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-11 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setConfirmDoctor(null)}
              >
                Maybe later
              </Button>
            </div>
            
            <p className="mt-6 text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-60">
              Secure & Private Consultation
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
