import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const formatDay  = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

let sock = null;

const DMPage = () => {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const roomId = [me?._id, userId].sort().join('-');

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Load profile + history
    Promise.all([
      api.get(`/friends/users/${userId}`),
      api.get(`/dm/${userId}`),
    ]).then(([profileRes, dmRes]) => {
      setOtherUser(profileRes.data.user);
      setMessages(dmRes.data.messages);
    }).catch(() => toast.error('Failed to load conversation'));

    // Socket
    sock = io('http://localhost:5100', { auth: { token }, transports: ['websocket'] });
    sock.on('connect',    () => { setConnected(true); sock.emit('join-dm', roomId); });
    sock.on('disconnect', () => setConnected(false));
    sock.on('new-dm',     (msg) => setMessages(prev => [...prev, msg]));

    return () => { sock?.disconnect(); sock = null; };
  }, [userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim() || !sock) return;
    sock.emit('send-dm', { toUserId: userId, content: input.trim() });
    setInput('');
    inputRef.current?.focus();
  };

  const grouped = messages.reduce((acc, m) => {
    const day = formatDay(m.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(m);
    return acc;
  }, {});

  return (
    <div className="-mx-4 -mt-6 -mb-6 flex flex-col sm:-mx-6 lg:-mx-8"
         style={{ height: 'calc(100vh - 3.75rem)' }}>

      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-2.5">
        <Link to="/friends" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition">
          <ArrowLeft size={18} />
        </Link>
        {otherUser && (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-400 border border-indigo-500/30">
              {otherUser.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{otherUser.name}</p>
              <p className="text-xs text-slate-500">{otherUser.department}</p>
            </div>
          </>
        )}
        <span className={`ml-auto flex items-center gap-1.5 text-xs ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          {connected ? 'Online' : 'Connecting…'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">
            No messages yet. Say hello to {otherUser?.name}!
          </p>
        )}
        {Object.entries(grouped).map(([day, msgs]) => (
          <div key={day}>
            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-xs text-slate-500">{day}</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>
            {msgs.map((msg, i) => {
              const isOwn   = msg.sender?._id === me?._id || msg.sender === me?._id;
              const prevSame = i > 0 && (msgs[i-1].sender?._id || msgs[i-1].sender) === (msg.sender?._id || msg.sender);
              return (
                <div key={msg._id || i} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''} ${prevSame ? 'mt-0.5' : 'mt-3'}`}>
                  {!isOwn && (
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400 ${prevSame ? 'invisible' : ''}`}>
                      {(msg.sender?.name || otherUser?.name)?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${isOwn ? 'rounded-br-sm bg-indigo-600 text-white' : 'rounded-bl-sm bg-slate-700 text-slate-200'}`}>
                      {msg.content}
                    </div>
                    <span className="mt-0.5 px-1 text-xs text-slate-500">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex shrink-0 items-center gap-2 border-t border-slate-700 px-3 py-3">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Message ${otherUser?.name || ''}…`}
          className="flex-1 rounded-full border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <button type="submit" disabled={!input.trim() || !connected}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:bg-indigo-600 disabled:opacity-40">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};

export default DMPage;
