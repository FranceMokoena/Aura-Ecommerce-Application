import React, { useState, useEffect } from 'react';
import { MessageCircle, ArrowLeft, Send } from 'lucide-react';
import api from '../services/api';

interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  receiverId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  partner: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  lastMessage: {
    content: string;
    messageType: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export default function AdminMessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [view, setView] = useState<'conversations' | 'messages'>('conversations');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/messages/conversations');
      if (response.data.success) {
        setConversations(response.data.data);
      } else {
        alert(response.data.message || 'Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      alert('Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/messages/conversation/${partnerId}`);
      if (response.data.success) {
        setMessages(response.data.data.messages);
        setView('messages');
      } else {
        alert(response.data.message || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      alert('Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (receiverId: string) => {
    if (!newMessage.trim()) return;

    try {
      const response = await api.post('/messages/send', {
        receiverId,
        content: newMessage.trim(),
        messageType: 'text'
      });

      if (response.data.success) {
        setNewMessage('');
        // Refresh messages
        await fetchMessages(receiverId);
      } else {
        alert(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleKeyPress = (e: React.KeyboardEvent, receiverId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(receiverId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {view === 'conversations' ? (
        <>
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Conversations</h1>
              <p className="text-gray-600">Manage user messages</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No conversations found</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedConversation(conversation);
                    fetchMessages(conversation.partner._id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{conversation.partner.name}</h3>
                        <span className="text-sm text-gray-500">({conversation.partner.role})</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{conversation.partner.email}</p>
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {conversation.unreadCount} unread
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setView('conversations');
                setSelectedConversation(null);
                setMessages([]);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Chat with {selectedConversation?.partner.name}
              </h1>
              <p className="text-gray-600">
                {selectedConversation?.partner.role} • {selectedConversation?.partner.email}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No messages yet</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.senderId.role === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId.role === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {message.senderId.name} ({message.senderId.role})
                        </span>
                        <span className="text-xs opacity-75">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      {!message.isRead && message.senderId.role !== 'admin' && (
                        <p className="text-xs opacity-75 mt-1 italic">Unread</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => selectedConversation && handleKeyPress(e, selectedConversation.partner._id)}
                  placeholder="Type a message..."
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
                <button
                  onClick={() => selectedConversation && sendMessage(selectedConversation.partner._id)}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
