import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Image,
  ChevronRight,
  Terminal,
  CheckCircle2,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { useText } from '../hooks/useText';
import { useStore } from '../store/useStore';
import { demoConversations, type ChatMessage, type ThinkingStep, type ToolCall } from '../data/chat';

const phaseColors: Record<string, string> = {
  Think: 'border-accent-purple text-accent-purple bg-accent-purple/10',
  Act: 'border-accent-cyan text-accent-cyan bg-accent-cyan/10',
  Observe: 'border-status-yellow text-status-yellow bg-status-yellow/10',
  Reflect: 'border-status-green text-status-green bg-status-green/10',
};

function ToolCallItem({ tc }: { tc: ToolCall }) {
  return (
    <div className="flex items-start gap-2 text-xs bg-bg-primary/60 rounded-lg p-2 border border-border">
      <Terminal className="w-3.5 h-3.5 mt-0.5 text-accent-cyan shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-accent-cyan">{tc.name}</span>
          {tc.status === 'completed' ? (
            <CheckCircle2 className="w-3 h-3 text-status-green" />
          ) : (
            <Loader2 className="w-3 h-3 text-accent-cyan animate-spin" />
          )}
          {tc.duration && <span className="text-text-muted">{tc.duration}</span>}
        </div>
        <div className="text-text-muted font-mono mt-1 truncate">{tc.input}</div>
        {tc.output && <div className="text-text-secondary mt-1">{tc.output}</div>}
      </div>
    </div>
  );
}

function ThinkingPanel({ steps }: { steps: ThinkingStep[] }) {
  const { t } = useText();
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
        {t('Agent Thinking (TAOR Loop)', '智能体思考 (TAOR循环)')}
      </h3>
      {steps.map((step, i) => (
        <div key={i} className="animate-slide-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded border inline-block mb-1 ${phaseColors[step.phase]}`}>
            {step.phase} / {step.phaseZh}
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{t(step.content, step.contentZh)}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{step.timestamp}</p>
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const { t } = useText();
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[75%] ${isUser ? 'order-1' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-text-muted">
            {isUser ? t('You', '你') : t('IOE Assistant', 'IOE助手')}
          </span>
          <span className="text-[10px] text-text-muted">{msg.timestamp}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-accent-cyan/20 text-text-primary rounded-br-md'
              : 'bg-bg-card border border-border text-text-primary rounded-bl-md'
          }`}
        >
          <div className="whitespace-pre-wrap">{msg.content}</div>
        </div>

        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">
              {t('Tool Calls', '工具调用')} ({msg.toolCalls.length})
            </p>
            {msg.toolCalls.map((tc) => (
              <ToolCallItem key={tc.id} tc={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const { t } = useText();
  const selectedConversation = useStore((s) => s.selectedConversation);
  const setSelectedConversation = useStore((s) => s.setSelectedConversation);
  const [input, setInput] = useState('');
  const [typingMsg, setTypingMsg] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeConv = demoConversations.find((c) => c.id === selectedConversation) || demoConversations[0];
  const [messages, setMessages] = useState<ChatMessage[]>(activeConv.messages);
  const activeThinking = activeConv.messages.filter((m) => m.thinkingSteps).flatMap((m) => m.thinkingSteps!);

  useEffect(() => {
    const conv = demoConversations.find((c) => c.id === selectedConversation) || demoConversations[0];
    setMessages(conv.messages);
  }, [selectedConversation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingMsg]);

  function handleSend() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTypingMsg('');
    const response = t(
      'I\'m analyzing your request. Based on the current system state, I can provide the following insights...\n\nThis is a demo environment. In production, IOE would process your request through the TAOR loop, invoking relevant domain agents and tools to generate a comprehensive response.',
      '我正在分析您的请求。根据当前系统状态，我可以提供以下洞察...\n\n这是演示环境。在生产环境中，IOE会通过TAOR循环处理您的请求，调用相关领域智能体和工具生成综合响应。'
    );

    let idx = 0;
    const timer = setInterval(() => {
      idx += 2;
      if (idx >= response.length) {
        clearInterval(timer);
        setTypingMsg(null);
        const assistantMsg: ChatMessage = {
          id: `msg-assistant-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setTypingMsg(response.slice(0, idx));
      }
    }, 20);
  }

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-56 bg-bg-secondary border-r border-border shrink-0 flex flex-col">
        <div className="p-3 border-b border-border">
          <h2 className="text-sm font-medium text-text-primary">{t('Conversations', '对话')}</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {demoConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`w-full text-left px-3 py-3 border-b border-border flex items-start gap-2 transition-colors cursor-pointer ${
                activeConv.id === conv.id ? 'bg-accent-cyan/10' : 'hover:bg-bg-hover'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{t(conv.title, conv.titleZh)}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{conv.domain}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-11 border-b border-border flex items-center px-4">
          <h2 className="text-sm font-medium text-text-primary">{t(activeConv.title, activeConv.titleZh)}</h2>
          <span className="text-xs text-text-muted ml-2">{activeConv.domain}</span>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {typingMsg !== null && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[75%]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-text-muted">{t('IOE Assistant', 'IOE助手')}</span>
                </div>
                <div className="rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed bg-bg-card border border-border text-text-primary">
                  <span>{typingMsg}</span>
                  <span className="typing-cursor" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 bg-bg-card rounded-xl border border-border px-3 py-2 focus-within:border-accent-cyan/60 transition-colors">
            <button className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
              <Paperclip className="w-4 h-4" />
            </button>
            <button className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
              <Image className="w-4 h-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={t('Type your message...', '输入消息...')}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-7 h-7 rounded-lg bg-accent-cyan flex items-center justify-center disabled:opacity-30 hover:bg-accent-cyan/80 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-bg-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Thinking Sidebar */}
      <div className="w-72 bg-bg-secondary border-l border-border shrink-0 overflow-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight className="w-4 h-4 text-accent-cyan" />
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            {t('Agent Thinking', '智能体思考')}
          </h3>
        </div>
        {activeThinking.length > 0 ? (
          <ThinkingPanel steps={activeThinking} />
        ) : (
          <p className="text-xs text-text-muted">{t('No thinking steps yet', '暂无思考步骤')}</p>
        )}
      </div>
    </div>
  );
}
