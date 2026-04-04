import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Image, Brain, Wrench, CheckCircle2, Loader2, MessageSquare, Lightbulb, ThumbsUp, Pencil, Search, XCircle } from 'lucide-react';
import { useText } from '../hooks/useText';
import { demoConversations, type ChatMessage, type Suggestion } from '../data/chat';

const phaseColors: Record<string, string> = {
  Think: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Act: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Observe: 'bg-green-500/20 text-green-400 border-green-500/30',
  Reflect: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const suggestionIcons: Record<string, React.ReactNode> = {
  approve: <ThumbsUp className="w-3.5 h-3.5" />,
  modify: <Pencil className="w-3.5 h-3.5" />,
  explore: <Search className="w-3.5 h-3.5" />,
  reject: <XCircle className="w-3.5 h-3.5" />,
};

function formatChatContent(content: string): string {
  // Split into lines to detect tables
  const lines = content.split('\n');
  const out: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableRow = /^\|(.+)\|$/.test(line.trim());
    const isSeparator = /^\|[-\s|:]+\|$/.test(line.trim());

    if (isTableRow && !isSeparator) {
      if (!inTable) {
        inTable = true;
        out.push('<table class="text-xs border-collapse my-2 w-full">');
      }
      const cells = line.trim().slice(1, -1).split('|').map(c => c.trim());
      // First row after table start is header
      const tag = out.filter(l => l.includes('<tr')).length === 0 ? 'th' : 'td';
      const thStyle = tag === 'th' ? ' style="color:#94a3b8;font-weight:600;text-align:left;padding:4px 8px;border-bottom:1px solid #334155"' : ' style="padding:4px 8px;border-bottom:1px solid #1e293b"';
      out.push(`<tr>${cells.map(c => `<${tag}${thStyle}>${c}</${tag}>`).join('')}</tr>`);
    } else if (isSeparator) {
      // Skip separator rows
      continue;
    } else {
      if (inTable) {
        inTable = false;
        out.push('</table>');
      }
      out.push(line);
    }
  }
  if (inTable) out.push('</table>');

  return out.join('\n')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent-cyan">$1</strong>')
    .replace(/✅/g, '<span class="text-status-green">✅</span>');
}

const suggestionColors: Record<string, string> = {
  approve: 'border-status-green/40 hover:border-status-green hover:bg-status-green/10 text-status-green',
  modify: 'border-accent-cyan/40 hover:border-accent-cyan hover:bg-accent-cyan/10 text-accent-cyan',
  explore: 'border-purple-400/40 hover:border-purple-400 hover:bg-purple-400/10 text-purple-400',
  reject: 'border-status-red/40 hover:border-status-red hover:bg-status-red/10 text-status-red',
};

export default function Chat() {
  const { t } = useText();
  const [activeConv, setActiveConv] = useState(0);
  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingIdx, setThinkingIdx] = useState(-1);
  const [pendingResponse, setPendingResponse] = useState<ChatMessage | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const conv = demoConversations[activeConv];

  // Initialize with first message
  useEffect(() => {
    setDisplayedMessages([conv.messages[0]]);
    setIsTyping(false);
    setThinkingIdx(-1);
    setPendingResponse(null);
    setSelectedSuggestions(new Set());
  }, [activeConv]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [displayedMessages, thinkingIdx]);

  const animateResponse = useCallback((msg: ChatMessage) => {
    if (isTyping) return;
    setIsTyping(true);
    setThinkingIdx(0);
    setPendingResponse(msg);
    const steps = msg.thinkingSteps?.length || 0;
    let step = 0;
    const iv = setInterval(() => {
      step++;
      if (step < steps) { setThinkingIdx(step); }
      else {
        clearInterval(iv);
        setTimeout(() => {
          setIsTyping(false);
          setThinkingIdx(-1);
          setDisplayedMessages(prev => [...prev, msg]);
          setPendingResponse(null);
        }, 500);
      }
    }, 800);
  }, [isTyping]);

  const advanceConversation = useCallback(() => {
    if (isTyping) return;
    // Find the next main message not yet displayed
    const displayedIds = new Set(displayedMessages.map(m => m.id));
    const nextMsg = conv.messages.find(m => !displayedIds.has(m.id));
    if (nextMsg) animateResponse(nextMsg);
  }, [isTyping, displayedMessages, conv.messages, animateResponse]);

  const handleSuggestion = useCallback((parentMsg: ChatMessage, s: Suggestion) => {
    if (isTyping || selectedSuggestions.has(parentMsg.id)) return;
    setSelectedSuggestions(prev => new Set(prev).add(parentMsg.id));
    const response = parentMsg.suggestionResponses?.[s.id];
    if (response) {
      // Add user echo message then animate the response
      const userEcho: ChatMessage = {
        id: `echo-${s.id}`,
        role: 'user',
        content: s.textZh || s.text,
        timestamp: response.timestamp,
      };
      setDisplayedMessages(prev => [...prev, userEcho]);
      setTimeout(() => animateResponse(response), 300);
    } else {
      // Fallback: advance to next main message
      setTimeout(() => advanceConversation(), 300);
    }
  }, [isTyping, selectedSuggestions, animateResponse, advanceConversation]);

  const currentThinkingMsg = pendingResponse;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Conversation list */}
      <div className="w-60 border-r border-border bg-bg-card flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent-cyan" />
            {t('Conversations', '对话')}
          </h2>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {demoConversations.map((c, i) => (
            <button key={c.id} onClick={() => setActiveConv(i)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${i === activeConv ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' : 'text-text-secondary hover:bg-bg-primary border border-transparent'}`}>
              <div className="font-medium truncate">{t(c.title, c.titleZh)}</div>
              <div className="text-xs text-text-muted mt-0.5">{c.domain}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="px-5 py-3 border-b border-border bg-bg-card flex items-center gap-3">
          <Brain className="w-5 h-5 text-accent-cyan" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{t(conv.title, conv.titleZh)}</h3>
            <p className="text-xs text-text-muted">{t('Human-AI Collaboration', '人机协同')} · TAOR Loop</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
            <span className="text-xs text-status-green">{t('Agent Active', 'Agent运行中')}</span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto p-5 space-y-4">
          {displayedMessages.map(msg => {
            const isMsgSelected = selectedSuggestions.has(msg.id);
            return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'bg-accent-cyan/15 border border-accent-cyan/20' : 'bg-bg-card border border-border'} rounded-2xl px-4 py-3`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-accent-cyan' : 'text-status-green'}`}>
                    {msg.role === 'user' ? t('You', '用户') : 'IOE Agent'}
                  </span>
                  <span className="text-[10px] text-text-muted">{msg.timestamp}</span>
                </div>
                <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed chat-content"
                  dangerouslySetInnerHTML={{ __html: formatChatContent(msg.content) }} />

                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1"><Wrench className="w-3 h-3" /> {t('Tool Calls', '工具调用')}</div>
                    {msg.toolCalls.map(tc => (
                      <div key={tc.id} className="flex items-center gap-2 text-xs bg-bg-primary rounded-lg px-2.5 py-1.5">
                        <CheckCircle2 className="w-3 h-3 text-status-green shrink-0" />
                        <span className="text-accent-cyan font-mono">{tc.name}</span>
                        <span className="text-text-muted truncate flex-1">{tc.output}</span>
                        <span className="text-text-muted shrink-0">{tc.duration}</span>
                      </div>
                    ))}
                  </div>
                )}

                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1"><Lightbulb className="w-3 h-3 text-status-yellow" /> {t('Suggested Actions', '建议操作')}</div>
                    <div className="space-y-1">
                      {msg.suggestions.map(s => (
                        <button key={s.id} onClick={() => handleSuggestion(msg, s)} disabled={isMsgSelected || isTyping}
                          className={`w-full text-left flex items-center gap-2 text-xs rounded-lg px-3 py-2 border transition-all cursor-pointer ${isMsgSelected ? 'opacity-40 border-border text-text-muted' : suggestionColors[s.type]}`}>
                          {suggestionIcons[s.type]}
                          <span>{t(s.text, s.textZh)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-bg-card border border-border rounded-2xl px-4 py-3"><div className="flex items-center gap-2 text-xs text-accent-cyan"><Loader2 className="w-3.5 h-3.5 animate-spin" />{t('Agent thinking...', 'Agent思考中...')}</div></div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border bg-bg-card">
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-muted hover:text-text-primary cursor-pointer"><Paperclip className="w-4 h-4" /></button>
            <button className="p-2 text-text-muted hover:text-text-primary cursor-pointer"><Image className="w-4 h-4" /></button>
            <div className="flex-1 bg-bg-primary rounded-xl border border-border px-4 py-2.5 text-sm text-text-muted cursor-pointer" onClick={advanceConversation}>
              {t('Select a suggested action above to continue...', '请选择上方建议操作继续对话...')}
            </div>
            <button onClick={advanceConversation} disabled={isTyping}
              className="p-2.5 bg-accent-cyan text-bg-primary rounded-xl hover:bg-accent-cyan/80 disabled:opacity-30 cursor-pointer"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Right: Agent Thinking */}
      <div className="w-72 border-l border-border bg-bg-card flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Brain className="w-4 h-4 text-accent-cyan" />{t('Agent Thinking', 'Agent思维')}</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Think → Act → Observe → Reflect</p>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {(() => {
            const steps = currentThinkingMsg?.thinkingSteps?.slice(0, thinkingIdx + 1) || displayedMessages.filter(m => m.role === 'assistant').pop()?.thinkingSteps || [];
            return steps.length > 0 ? steps.map((step, i) => (
              <div key={i} className={`border rounded-lg p-2.5 transition-all duration-300 ${phaseColors[step.phase]} ${isTyping && i === thinkingIdx ? 'ring-1 ring-accent-cyan/50' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{step.phase}</span>
                  <span className="text-[10px] opacity-60">{step.timestamp}</span>
                  {isTyping && i === thinkingIdx && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
                </div>
                <p className="text-xs leading-relaxed">{t(step.content, step.contentZh)}</p>
              </div>
            )) : (
              <div className="text-xs text-text-muted text-center py-8">{t('Click Send to start the conversation and see TAOR thinking process.', '点击发送开始对话，查看TAOR思维过程。')}</div>
            );
          })()}
        </div>
        <div className="px-4 py-2.5 border-t border-border text-xs">
          <div className="flex items-center justify-between"><span className="text-text-muted">{t('Permission', '权限')}</span><span className="text-status-green font-mono">L3</span></div>
          <div className="flex items-center justify-between mt-1"><span className="text-text-muted">{t('Digital Twin', '数字孪生')}</span><span className="text-accent-cyan">{t('Verified', '已验证')}</span></div>
        </div>
      </div>
    </div>
  );
}
