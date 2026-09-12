import { ref, get, set, update, push, onValue } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { Conversation, Message } from '../../types';
import { sendNotification } from '../notifications/notificationService';

/**
 * Generate a deterministic conversation ID for a pair of users
 */
export function getConversationId(userA: string, userB: string): string {
  return `conv_${[userA, userB].sort().join('__')}`;
}

/**
 * Get or create a 1-on-1 conversation
 */
export async function getOrCreateConversation(params: {
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  artistId: string;
  artistName: string;
  artistPhoto?: string;
}): Promise<Conversation> {
  const convId = getConversationId(params.clientId, params.artistId);
  const convRef = ref(rtdb, `conversations/${convId}`);
  const snap = await get(convRef);

  if (snap.exists()) {
    return snap.val() as Conversation;
  }

  const newConv: Conversation = {
    id: convId,
    participants: {
      [params.clientId]: true,
      [params.artistId]: true
    },
    participantDetails: {
      [params.clientId]: {
        name: params.clientName,
        photo: params.clientPhoto || '',
        role: 'client'
      },
      [params.artistId]: {
        name: params.artistName,
        photo: params.artistPhoto || '',
        role: 'artist'
      }
    },
    lastMessage: 'Conversation started',
    lastSenderId: params.clientId,
    lastMessageTime: Date.now(),
    updatedAt: Date.now(),
    unreadCount: {
      [params.clientId]: 0,
      [params.artistId]: 0
    }
  };

  await set(convRef, newConv);
  return newConv;
}

/**
 * Send a message within a conversation
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
}): Promise<Message> {
  const msgRef = push(ref(rtdb, `messages/${params.conversationId}`));
  const messageId = msgRef.key!;

  const message: Message = {
    messageId,
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderName: params.senderName,
    text: params.text.trim(),
    timestamp: Date.now(),
    read: false
  };

  await set(msgRef, message);

  // Update conversation parent
  const convRef = ref(rtdb, `conversations/${params.conversationId}`);
  const convSnap = await get(convRef);
  let recipientUnread = 1;
  if (convSnap.exists()) {
    const prev = convSnap.val() as Conversation;
    recipientUnread = ((prev.unreadCount?.[params.recipientId]) || 0) + 1;
  }

  await update(convRef, {
    lastMessage: params.text.trim(),
    lastSenderId: params.senderId,
    lastMessageTime: Date.now(),
    updatedAt: Date.now(),
    [`unreadCount/${params.recipientId}`]: recipientUnread
  });

  // Send real-time notification
  await sendNotification({
    userId: params.recipientId,
    type: 'new_message',
    title: `New message from ${params.senderName}`,
    message: params.text.length > 60 ? `${params.text.slice(0, 57)}...` : params.text,
    link: `?tab=messages&convId=${params.conversationId}`
  });

  return message;
}

/**
 * Subscribe to messages in a specific conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = ref(rtdb, `messages/${conversationId}`);
  return onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
    } else {
      const msgs: Message[] = Object.values(snapshot.val());
      callback(msgs.sort((a, b) => a.timestamp - b.timestamp));
    }
  });
}

/**
 * Subscribe to user's conversation list
 */
export function subscribeToUserConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const convRef = ref(rtdb, 'conversations');
  return onValue(convRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
    } else {
      const all: Conversation[] = Object.values(snapshot.val());
      const userConvs = all
        .filter(c => c.participants && c.participants[userId] === true)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      callback(userConvs);
    }
  });
}

/**
 * Mark messages in conversation as read for user
 */
export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await update(ref(rtdb, `conversations/${conversationId}/unreadCount`), {
    [userId]: 0
  });
}
