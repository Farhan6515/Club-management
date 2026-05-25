import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Send } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const formatDay = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

let socketInstance = null;

const ClubChat = ({ clubId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    api.get(`/messages/${clubId}`).then(({ data }) => {
      setMessages(data.messages);
    });

    socketInstance = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      socketInstance.emit('join-club', clubId);
    });
    socketInstance.on('disconnect', () => setConnected(false));
    socketInstance.on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketInstance.emit('leave-club', clubId);
      socketInstance.disconnect();
      socketInstance = null;
    };
  }, [clubId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketInstance) return;
    socketInstance.emit('send-message', { clubId, content: input.trim() });
    setInput('');
    inputRef.current?.focus();
  };

  const grouped = messages.reduce((acc, msg) => {
    const day = formatDay(msg.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden h-full dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-slate-700">
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-300 dark:bg-slate-500'}`} />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Club Chat</span>
        <span className="text-xs text-gray-400 dark:text-slate-500">{connected ? 'Live' : 'Connecting…'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gray-50 dark:bg-slate-900/50">
        {messages.length === 0 && (
          <p className="py-16 text-center text-sm text-gray-400 dark:text-slate-500">
            No messages yet. Say hello!
          </p>
        )}

        {Object.entries(grouped).map(([day, msgs]) => (
          <div key={day}>
            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
              <span className="text-xs text-gray-400 dark:text-slate-500">{day}</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            </div>

            {msgs.map((msg, i) => {
              const isOwn    = msg.author?._id === user?._id || msg.author === user?._id;
              const prevSame = i > 0 && msgs[i - 1].author?._id === msg.author?._id;

              return (
                <div
                  key={msg._id}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''} ${prevSame ? 'mt-0.5' : 'mt-3'}`}
                >
                  {!isOwn && (
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 ${prevSame ? 'invisible' : ''}`}>
                      {msg.author?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[72%]`}>
                    {!prevSame && !isOwn && (
                      <span className="mb-0.5 pl-1 text-xs font-semibold text-gray-500 dark:text-slate-400">
                        {msg.author?.name}
                      </span>
                    )}
                    <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      isOwn
                        ? 'rounded-br-sm bg-indigo-600 text-white'
                        : 'rounded-bl-sm bg-white text-gray-800 shadow-sm border border-gray-100 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="mt-0.5 px-1 text-xs text-gray-400 dark:text-slate-500">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || !connected}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:bg-indigo-600 disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};

export default ClubChat;
