import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Copy, Check, RotateCcw, Heart, User, Briefcase, Smile, Info, Zap } from 'lucide-react';
import { generateNickname } from './services/geminiService';
import { NicknameResult, RelationshipType, VibeType, HistoryItem } from './types';
import { Button } from './components/Button';
import { HistoryList } from './components/HistoryList';

const App: React.FC = () => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>(RelationshipType.BestFriend);
  const [vibe, setVibe] = useState<VibeType>(VibeType.Funny);
  const [trait, setTrait] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NicknameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refactored: Lazy initialization for history from localStorage
  // This ensures we read the data BEFORE the first render cycle completes, 
  // preventing any useEffect race conditions that might overwrite storage with []
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nicknameHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse history", e);
      return [];
    }
  });

  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('nicknameHistory', JSON.stringify(history));
  }, [history]);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (cooldown > 0) return;

    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const generated = await generateNickname({
        name,
        relationship,
        vibe,
        trait: trait.trim() || undefined
      });
      
      setResult(generated);
      
      const newItem: HistoryItem = {
        ...generated,
        id: Date.now().toString(),
        originalName: name,
        relationship,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
      
      // Set cooldown to prevent spamming (3 seconds)
      setCooldown(3);
      
    } catch (err: any) {
      console.error(err);
      
      let errorMessage = "哎呀，脑洞卡住了。请再试一次！";
      
      if (err.message) {
        if (err.message.includes('quota') || err.message.includes('429')) {
          errorMessage = "请求太快啦，AI 需要喘口气 (Quota Limit)。请稍等几秒再试。";
        } else if (err.message.includes('safety') || err.message.includes('harmful')) {
          errorMessage = "触发了安全过滤，换个名字或描述试试看？";
        } else if (err.message.includes('All retry attempts failed')) {
           errorMessage = "网络有点拥堵，AI 尽力了但没连上。请稍后再试。";
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    if (window.confirm('确定要清空所有的历史记录吗？')) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center py-8 px-4 sm:px-6 font-sans">
      
      {/* Decorative Background Elements */}
      <div className="fixed top-20 left-10 w-16 h-16 bg-blue-400 rounded-full border-2 border-black hidden lg:block animate-bounce shadow-hard"></div>
      <div className="fixed bottom-20 right-10 w-12 h-12 bg-pink-400 rotate-12 border-2 border-black hidden lg:block animate-pulse shadow-hard"></div>

      <header className="mb-8 text-center relative z-10 max-w-2xl">
        <div className="inline-block relative mb-4">
          <div className="absolute -inset-1 bg-black translate-x-2 translate-y-2 rounded-2xl"></div>
          <div className="relative inline-flex items-center justify-center p-4 bg-pink-500 border-2 border-black rounded-2xl transform -rotate-2 hover:rotate-2 transition-transform cursor-default">
            <Wand2 className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-black mb-3 tracking-tighter drop-shadow-sm">
          起名鬼才 <span className="text-purple-600">AI</span>
        </h1>
        <p className="text-slate-700 text-lg font-medium bg-white inline-block px-4 py-1 rounded-full border-2 border-black shadow-hard-sm transform rotate-1">
          专治各种起名困难症 💊
        </p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10">
        
        {/* Left Column: Input Form */}
        <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-hard relative overflow-hidden">
           {/* Decorative strip */}
           <div className="absolute top-0 left-0 w-full h-4 bg-stripes-gray border-b-2 border-black"></div>

          <form onSubmit={handleGenerate} className="space-y-6 mt-2">
            
            <div className="space-y-2">
              <label htmlFor="name" className="block text-base font-bold text-black flex items-center gap-2">
                <User size={18} className="text-blue-500" /> 对方的名字/称呼
              </label>
              <input
                id="name"
                type="text"
                maxLength={20}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：王小明, 老爸, 亲爱的"
                className="w-full bg-slate-50 border-2 border-black rounded-xl px-4 py-3 text-lg font-medium text-black placeholder-slate-400 focus:ring-0 focus:border-purple-500 focus:shadow-[4px_4px_0px_0px_#a855f7] outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="relationship" className="block text-base font-bold text-black flex items-center gap-2">
                  <Heart size={18} className="text-red-500" /> 你们的关系
                </label>
                <div className="relative">
                  <select
                    id="relationship"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                    className="w-full appearance-none bg-slate-50 border-2 border-black rounded-xl px-4 py-3 text-black font-medium focus:ring-0 focus:border-purple-500 focus:shadow-[4px_4px_0px_0px_#a855f7] outline-none transition-all cursor-pointer"
                  >
                    {Object.values(RelationshipType).map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="vibe" className="block text-base font-bold text-black flex items-center gap-2">
                  <Zap size={18} className="text-yellow-500" /> 想要的风格
                </label>
                <div className="relative">
                  <select
                    id="vibe"
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value as VibeType)}
                    className="w-full appearance-none bg-slate-50 border-2 border-black rounded-xl px-4 py-3 text-black font-medium focus:ring-0 focus:border-purple-500 focus:shadow-[4px_4px_0px_0px_#a855f7] outline-none transition-all cursor-pointer"
                  >
                    {Object.values(VibeType).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="trait" className="block text-base font-bold text-black flex items-center gap-2">
                  <Sparkles size={18} className="text-green-500" /> 特征/槽点 (选填)
                </label>
                <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded border border-slate-400">注入灵魂</span>
              </div>
              <input
                id="trait"
                type="text"
                maxLength={100}
                value={trait}
                onChange={(e) => setTrait(e.target.value)}
                placeholder="例如：爱喝奶茶，经常迟到，笑点低"
                className="w-full bg-slate-50 border-2 border-black rounded-xl px-4 py-3 text-lg font-medium text-black placeholder-slate-400 focus:ring-0 focus:border-purple-500 focus:shadow-[4px_4px_0px_0px_#a855f7] outline-none transition-all"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full text-lg mt-2" 
              isLoading={isLoading}
              disabled={cooldown > 0}
              icon={<Wand2 className="w-5 h-5" />}
            >
              {cooldown > 0 ? `技能冷却中 (${cooldown}s)` : '一键生成神仙绰号'}
            </Button>
          </form>

          {/* History List for Desktop */}
          <div className="hidden lg:block">
            <HistoryList history={history} onClear={clearHistory} onCopy={handleCopy} />
          </div>
        </div>

        {/* Right Column: Result Display */}
        <div className="flex flex-col gap-6">
          
          {error && (
            <div className="bg-red-100 border-2 border-black text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-hard animate-fade-in">
              <Info className="w-6 h-6 flex-shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white border-2 border-dashed border-black rounded-3xl text-slate-500">
              <div className="bg-yellow-200 p-4 rounded-full border-2 border-black mb-4 animate-bounce">
                <Smile className="w-10 h-10 text-black" />
              </div>
              <p className="text-xl font-bold text-black">虚位以待</p>
              <p className="text-sm font-medium mt-2 max-w-xs">
                在左边填好信息，点击生成，见证奇迹的时刻！
              </p>
            </div>
          )}

          {isLoading && !result && (
             <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-white border-2 border-black rounded-3xl shadow-hard">
                <div className="animate-spin text-4xl mb-4">🔮</div>
                <p className="text-black font-bold text-lg animate-pulse">AI 正在疯狂头脑风暴...</p>
                <p className="text-slate-500 text-sm mt-2">正在检索幽默细胞库</p>
             </div>
          )}

          {result && (
            <div className="bg-blue-50 border-2 border-black rounded-3xl overflow-hidden shadow-hard animate-fade-in-up relative">
               {/* Pattern overlay */}
               <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

              {/* Card Header */}
              <div className="bg-white p-4 border-b-2 border-black flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                   <span className="text-xs font-black px-3 py-1 rounded-full bg-black text-white transform -rotate-2">
                     #{result.style}
                   </span>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={handleGenerate}
                    disabled={cooldown > 0}
                    className="p-2 text-black bg-white border-2 border-black hover:bg-slate-100 rounded-lg transition-all active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="再来一个"
                   >
                     <RotateCcw size={18} />
                   </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="p-8 sm:p-12 text-center relative z-10">
                
                <div className="text-7xl sm:text-8xl mb-6 filter drop-shadow-md transform hover:scale-110 transition-transform cursor-pointer select-none">
                  {result.emoji}
                </div>
                
                <div className="relative inline-block mb-6">
                  <div className="absolute -inset-2 bg-yellow-300 transform -skew-y-2 border-2 border-black rounded-lg"></div>
                  <h2 className="relative text-5xl sm:text-6xl font-black text-black tracking-tight px-4 py-1">
                    {result.nickname}
                  </h2>
                </div>
                
                <p className="text-slate-800 text-lg font-medium leading-relaxed mb-8 max-w-md mx-auto bg-white/50 p-4 rounded-xl border-2 border-black/10">
                  “{result.explanation}”
                </p>

                <div className="flex justify-center">
                  <Button 
                    variant="primary" 
                    onClick={() => handleCopy(result.nickname)}
                    className="min-w-[160px] text-lg"
                    icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  >
                    {copied ? '已复制！' : '复制带走'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* History for Mobile */}
          <div className="lg:hidden">
             <HistoryList history={history} onClear={clearHistory} onCopy={handleCopy} />
          </div>

        </div>
      </main>
      
      <footer className="mt-16 text-slate-500 text-sm font-bold text-center">
        <p>&copy; {new Date().getFullYear()} 起名鬼才 AI. 搞怪我们是认真的 😜.</p>
      </footer>
    </div>
  );
};

export default App;