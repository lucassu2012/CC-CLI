import { useState } from 'react';
import { Search, Book, AlertCircle, Lightbulb, FileText, Tag, X } from 'lucide-react';
import { useText } from '../hooks/useText';
import { knowledgeEntries, type KnowledgeEntry } from '../data/knowledge';

const categoryConfig: Record<string, { icon: typeof Book; color: string; label: string; labelZh: string }> = {
  incident: { icon: AlertCircle, color: 'text-status-red bg-status-red/10 border-status-red/30', label: 'Incident', labelZh: '事件' },
  procedure: { icon: FileText, color: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30', label: 'Procedure', labelZh: '流程' },
  lesson: { icon: Lightbulb, color: 'text-status-yellow bg-status-yellow/10 border-status-yellow/30', label: 'Lesson Learned', labelZh: '经验教训' },
};

function DetailPanel({ entry, onClose }: { entry: KnowledgeEntry; onClose: () => void }) {
  const { t } = useText();
  const cat = categoryConfig[entry.category];
  const CatIcon = cat.icon;

  return (
    <div className="bg-bg-card rounded-xl border border-border p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded border ${cat.color}`}>
              <CatIcon className="w-3 h-3 inline mr-1" />
              {t(cat.label, cat.labelZh)}
            </span>
            <span className="text-xs text-text-muted">{entry.id}</span>
            <span className="text-xs text-text-muted">{entry.domain}</span>
          </div>
          <h2 className="text-base font-medium text-text-primary">{t(entry.title, entry.titleZh)}</h2>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-bg-primary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">{t('Confidence', '置信度')}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${entry.confidence * 100}%` }} />
            </div>
            <span className="text-sm font-medium text-text-primary">{(entry.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="bg-bg-primary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">{t('Occurrences', '发生次数')}</p>
          <p className="text-sm font-medium text-text-primary">{entry.occurrences}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">{t('Last Seen', '上次发生')}</p>
          <p className="text-sm font-medium text-text-primary">{entry.lastSeen}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">{t('Root Cause', '根本原因')}</h3>
          <p className="text-sm text-text-primary bg-bg-primary rounded-lg p-3 leading-relaxed">{t(entry.rootCause, entry.rootCauseZh)}</p>
        </div>
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">{t('Resolution', '解决方案')}</h3>
          <div className="text-sm text-text-primary bg-bg-primary rounded-lg p-3 leading-relaxed whitespace-pre-line">{t(entry.resolution, entry.resolutionZh)}</div>
        </div>
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">{t('Tags', '标签')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-bg-tertiary text-text-secondary rounded">
                <Tag className="w-2.5 h-2.5 inline mr-1" />{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Knowledge() {
  const { t } = useText();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);

  const filtered = knowledgeEntries.filter((e) => {
    const matchSearch = search === '' ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.titleZh.includes(search) ||
      e.tags.some((tag) => tag.includes(search.toLowerCase()));
    const matchCategory = filterCategory === 'all' || e.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="p-5 overflow-auto h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{t('Knowledge Base', '知识库')}</h1>
          <p className="text-xs text-text-muted mt-0.5">{knowledgeEntries.length} {t('entries', '条目')}</p>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-bg-card rounded-lg border border-border px-3 py-2 focus-within:border-accent-cyan/60 transition-colors">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search knowledge base...', '搜索知识库...')}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          {['all', 'incident', 'procedure', 'lesson'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'bg-accent-cyan/20 text-accent-cyan'
                  : 'text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {cat === 'all' ? t('All', '全部') : t(categoryConfig[cat].label, categoryConfig[cat].labelZh)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* List */}
        <div className="space-y-2">
          {filtered.map((entry) => {
            const cat = categoryConfig[entry.category];
            const CatIcon = cat.icon;
            return (
              <button
                key={entry.id}
                onClick={() => setSelected(entry)}
                className={`w-full text-left bg-bg-card rounded-xl border p-4 transition-all cursor-pointer ${
                  selected?.id === entry.id ? 'border-accent-cyan' : 'border-border hover:border-accent-cyan/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cat.color}`}>
                    <CatIcon className="w-2.5 h-2.5 inline mr-0.5" />
                    {t(cat.label, cat.labelZh)}
                  </span>
                  <span className="text-[10px] text-text-muted">{entry.id}</span>
                  <span className="text-[10px] text-text-muted ml-auto">{entry.domain}</span>
                </div>
                <h3 className="text-sm font-medium text-text-primary">{t(entry.title, entry.titleZh)}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  <span>{t('Confidence:', '置信度:')} {(entry.confidence * 100).toFixed(0)}%</span>
                  <span>{entry.occurrences} {t('occurrences', '次')}</span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Book className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">{t('No entries found', '未找到条目')}</p>
            </div>
          )}
        </div>

        {/* Detail */}
        <div>
          {selected ? (
            <DetailPanel entry={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="bg-bg-card rounded-xl border border-border flex items-center justify-center h-96">
              <div className="text-center">
                <Book className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">{t('Select an entry to view details', '选择条目查看详情')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
