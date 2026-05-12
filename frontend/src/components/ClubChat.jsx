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

    // Load history
    api.get(`/messages/${clubId}`).then(({ data }) => {
      setMessages(data.messages);
    });

    // Connect socket
    socketInstance = io('http://localhost:5100', {
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

  // Auto-scroll on new messages
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

  // Group messages by day
  const grouped = messages.reduce((acc, msg) => {
    const day = formatDay(msg.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col rounded-2xl border border-slate-700 bg-slate-800 overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-3">
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
        <span className="text-sm font-semibold text-white">Club Chat</span>
        <span className="text-xs text-slate-500">{connected ? 'Live' : 'Connecting…'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">
            No messages yet. Say hello!
          </p>
        )}

        {Object.entries(grouped).map(([day, msgs]) => (
          <div key={day}>
            {/* Day separator */}
            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-xs text-slate-500">{day}</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>

            {msgs.map((msg, i) => {
              const isOwn = msg.author?._id === user?._id || msg.author === user?._id;
              const prevSame = i > 0 && msgs[i - 1].author?._id === msg.author?._id;

              return (
                <div
                  key={msg._id}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''} ${prevSame ? 'mt-0.5' : 'mt-3'}`}
                >
                  {/* Avatar — only show on first message in a run */}
                  {!isOwn && (
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400 ${prevSame ? 'invisible' : ''}`}>
                      {msg.author?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[72%]`}>
                    {!prevSame && !isOwn && (
                      <span className="mb-0.5 pl-1 text-xs font-semibold text-slate-400">
                        {msg.author?.name}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        isOwn
                          ? 'rounded-br-sm bg-indigo-600 text-white'
                          : 'rounded-bl-sm bg-slate-700 text-slate-200'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="mt-0.5 px-1 text-xs text-slate-500">
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
        className="flex items-center gap-2 border-t border-slate-700 px-3 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
