import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Search, Check } from 'lucide-react';
import { Conversation, Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeToUserConversations,
  subscribeToMessages,
  sendMessage,
  markConversationRead
} from '../../services/messages/messagingService';

interface ChatViewProps {
  initialConversationId?: string;
  targetUser?: {
    uid: string;
    displayName: string;
    photoURL?: string;
  };
}

export const ChatView: React.FC<ChatViewProps> = ({ initialConversationId }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to conversation list
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToUserConversations(currentUser.uid, (list) => {
      setConversations(list);
      if (!activeConvId && list.length > 0) {
        setActiveConvId(list[0].id);
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Subscribe to messages of active conversation
  useEffect(() => {
    if (!activeConvId || !currentUser?.uid) {
      setMessages([]);
      return;
    }

    markConversationRead(activeConvId, currentUser.uid);

    const unsub = subscribeToMessages(activeConvId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsub();
  }, [activeConvId, currentUser?.uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Find partner in active conversation
  const getPartnerDetails = (conv: Conversation): { name: string; photo?: string; role?: string } => {
    if (!currentUser?.uid) return { name: 'المحادثة', photo: '' };
    const partnerId = Object.keys(conv.participants || {}).find(id => id !== currentUser.uid);
    if (!partnerId) return { name: 'الدعم الفني', photo: '' };
    return conv.participantDetails?.[partnerId] || { name: 'مستخدم', photo: '' };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || !currentUser || sending) return;

    const partnerId = Object.keys(activeConv?.participants || {}).find(id => id !== currentUser.uid);
    if (!partnerId) return;

    setSending(true);
    const text = inputText;
    setInputText('');

    try {
      await sendMessage({
        conversationId: activeConvId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        recipientId: partnerId,
        text
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const partner = getPartnerDetails(c);
    return partner.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex h-[620px]" dir="rtl">
      
      {/* Conversations Sidebar */}
      <div className="w-80 border-l border-stone-200 flex flex-col bg-stone-50/50 shrink-0 text-right">
        <div className="p-4 border-b border-stone-200 bg-white">
          <h3 className="text-sm font-bold text-stone-900 font-serif-display mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-700" />
            المحادثات والرسائل
          </h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="ابحثي في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-xs focus:outline-none focus:bg-white text-right"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400 leading-relaxed">
              مفيش محادثات هنا حالياً. تقدري تتواصلي مع أي ميك أب آرتست وتسأليها عن الحجز واللوكات!
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const partner = getPartnerDetails(conv);
              const unread = (currentUser?.uid && conv.unreadCount?.[currentUser.uid]) || 0;
              const isActive = conv.id === activeConvId;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isActive ? 'bg-amber-50/70 font-semibold' : 'hover:bg-stone-100/70'
                  }`}
                >
                  <img
                    src={partner.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                    alt={partner.name}
                    className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {partner.name}
                      </span>
                      <span className="text-[10px] text-stone-400 shrink-0">
                        {formatMsgTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">
                      {conv.lastMessage || 'لا توجد رسائل'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Message Thread */}
      <div className="flex-1 flex flex-col bg-stone-50/20 text-right">
        {activeConv ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getPartnerDetails(activeConv).photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                  alt="Partner"
                  className="w-9 h-9 rounded-full object-cover border border-stone-200"
                />
                <div>
                  <h4 className="text-sm font-bold text-stone-900 leading-tight">
                    {getPartnerDetails(activeConv).name}
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    {getPartnerDetails(activeConv).role === 'artist' ? 'ميك أب آرتست' : 'عميلة'}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400 leading-relaxed">
                  قولي مرحباً! اسألي عن تفاصيل اللوك والميعاد، الماتريال المفضلة، أو تفاصيل مكان المناسبة ✨
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUser?.uid;
                  return (
                    <div
                      key={msg.messageId}
                      className={`flex flex-col ${isMine ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-2xl text-xs shadow-xs leading-relaxed ${
                          isMine
                            ? 'bg-stone-900 text-white rounded-bl-xs'
                            : 'bg-white border border-stone-200 text-stone-800 rounded-br-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-stone-400 px-1">
                        <span>{formatMsgTime(msg.timestamp)}</span>
                        {isMine && (
                          <Check className="w-3 h-3 text-stone-400" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتبي رسالتك هنا..."
                className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 text-right"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl transition-colors disabled:opacity-50 rotate-180"
                title="إرسال"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400">
            <MessageSquare className="w-12 h-12 stroke-1 mb-2 text-stone-300" />
            <p className="text-sm font-bold text-stone-600">مفيش محادثة مختارة</p>
            <p className="text-xs max-w-xs mt-1 leading-relaxed">
              اختاري محادثة من القائمة الجانبية أو تواصلي مع أي ميك أب آرتست لبدء الحديث مباشرة.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

function formatMsgTime(ts?: number): string {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}
