import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, Copy } from 'lucide-react';

interface HistoryListProps {
  history: HistoryItem[];
  onClear: () => void;
  onCopy: (text: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onClear, onCopy }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full mt-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
        <h3 className="text-base font-black text-black uppercase tracking-wider flex items-center gap-2">
          <Clock size={18} /> 近期杰作
        </h3>
        <button 
          onClick={onClear}
          className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-300 hover:border-red-500"
        >
          <Trash2 size={12} /> 清空
        </button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {history.map((item) => (
          <div key={item.id} className="bg-white rounded-lg p-3 border-2 border-black shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all flex justify-between items-center group">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-black text-lg text-black">{item.nickname}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                原名: {item.originalName} ({item.relationship})
              </p>
            </div>
            <button 
              onClick={() => onCopy(item.nickname)}
              className="p-2 text-black bg-yellow-300 hover:bg-yellow-400 border-2 border-black rounded-md transition-all active:translate-y-1"
              title="复制绰号"
            >
              <Copy size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};