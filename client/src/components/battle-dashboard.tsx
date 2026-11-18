import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MonacoEditor } from "@/components/monaco-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Swords, Users, Clock, Trophy, Play, Copy, AlertTriangle, RefreshCw, History, ChevronRight } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BattleDashboardProps {
  onArenaStateChange?: (isArena: boolean) => void;
}

export function BattleDashboard({ onArenaStateChange }: BattleDashboardProps) {
  const { user } = useAuth();
  const [view, setView] = useState<'home' | 'lobby' | 'arena' | 'results'>('home');
  const [battleId, setBattleId] = useState("");
  
  // Create Battle Form State
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(30);
  
  // Arena State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Poll for battle updates
  const { data: battleData, refetch } = useQuery({
    queryKey: ["/api/battles", battleId],
    queryFn: async () => {
      if (!battleId) return null;
      const res = await apiRequest("GET", `/api/battles/${battleId}`);
      return await res.json();
    },
    enabled: !!battleId,
    refetchInterval: (view === 'lobby' || view === 'arena' || view === 'results') ? 2000 : false
  });

  // Fetch history
  const { data: historyData } = useQuery({
    queryKey: ["/api/battles/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/battles/history");
      return await res.json();
    }
  });

  useEffect(() => {
    if (battleData) {
      if (battleData.battle.status === 'active' && view === 'lobby') {
        setView('arena');
        // Use AI generated starting code if available, otherwise fallback
        const aiTemplates = battleData.battle.startingCode || {};
        const defaultTemplates: Record<string, string> = {
          javascript: 'class Solution {\n    solve() {\n        // Write your code here\n    }\n}',
          typescript: 'class Solution {\n    solve(): void {\n        // Write your code here\n    }\n}',
          python: 'class Solution:\n    def solve(self):\n        pass',
          java: 'class Solution {\n    public void solve() {\n        // Write your code here\n    }\n}',
          cpp: 'class Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};',
          c: 'void solve() {\n    // Write your code here\n}'
        };
        let rawCode = aiTemplates[language] || defaultTemplates[language] || defaultTemplates['javascript'];
        if (typeof rawCode === 'string') {
          rawCode = rawCode.replace(/\\n/g, '\n');
        }
        setCode(rawCode);

        // Calculate remaining time
        const start = new Date(battleData.battle.startedAt).getTime();
        const end = start + (battleData.battle.durationMinutes * 60 * 1000);
        setTimeRemaining(Math.max(0, Math.floor((end - Date.now()) / 1000)));
      } else if ((battleData.battle.status === 'finished' || battleData.battle.status === 'evaluating') && view === 'arena') {
        setView('results');
      }
    }
  }, [battleData, view, language]);

  // Handle hiding the sidebar
  useEffect(() => {
    if (onArenaStateChange) {
      onArenaStateChange(view === 'arena');
    }
  }, [view, onArenaStateChange]);



  const [errorMsg, setErrorMsg] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg("");
      const res = await apiRequest("POST", "/api/battles/create", { prompt, durationMinutes: duration });
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Battle created successfully:", data);
      if (!data || !data.id) {
        setErrorMsg("Server returned invalid data: " + JSON.stringify(data));
        return;
      }
      setBattleId(data.id);
      setView('lobby');
    },
    onError: (error) => {
      console.error("Create battle error:", error);
      setErrorMsg(error instanceof Error ? error.message : String(error));
    }
  });

  const joinMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/battles/${id}/join`);
      return id;
    },
    onSuccess: (id) => {
      setBattleId(id);
      setView('lobby');
    }
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/battles/${battleId}/start`);
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { code: string; language: string }) => {
      await apiRequest("POST", `/api/battles/${battleId}/submit`, data);
    },
    onSuccess: () => {
      setView('results');
    }
  });

  const handleForceSubmit = useCallback(() => {
    if (!submitMutation.isPending && view === 'arena') {
      submitMutation.mutate({ code, language });
    }
  }, [code, language, submitMutation, view]);

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (view === 'arena' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleForceSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, timeRemaining, handleForceSubmit]);

  // Anti-cheat
  useEffect(() => {
    if (view === 'arena') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          alert("Anti-cheat triggered: You switched tabs! Your solution has been submitted automatically.");
          handleForceSubmit();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [view, handleForceSubmit]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    alert("Anti-cheat: Pasting code is not allowed in Battle Mode!");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (view === 'home') {
    return (
      <div className="flex h-full w-full bg-background overflow-hidden">
        {/* History Sidebar */}
        <div className="w-80 border-r border-border bg-card flex flex-col h-full flex-shrink-0">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Past Battles
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!historyData || historyData.length === 0 ? (
              <div className="text-center text-muted-foreground p-4 text-sm">
                No past battles found.
              </div>
            ) : (
              historyData.map((item: any) => (
                <div key={item.battle.id} className="bg-background border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors"
                     onClick={() => {
                       setBattleId(item.battle.id);
                       setView('results');
                     }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm truncate pr-2" title={item.battle.problemPrompt}>
                      {item.battle.problemPrompt}
                    </span>
                    <Badge variant={item.battle.status === 'finished' ? 'secondary' : 'default'} className="text-[10px] uppercase">
                      {item.battle.status}
                    </Badge>
                  </div>
                  
                  {item.battle.status === 'finished' && (
                    <div className="text-xs text-muted-foreground mt-2 space-y-1 bg-muted/30 p-2 rounded">
                      <div className="font-semibold text-foreground/80 mb-1">Leaderboard:</div>
                      {item.submissions?.sort((a: any, b: any) => (a.rank || 99) - (b.rank || 99)).slice(0,3).map((sub: any) => {
                        const p = item.participants?.find((p:any) => p.userId === sub.userId);
                        return (
                          <div key={sub.id} className="flex justify-between">
                            <span>#{sub.rank || '-'} {p?.username || 'Unknown'}</span>
                            <span className="text-green-400">{sub.aiScore || 0} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 relative">
          <div className="max-w-4xl mx-auto space-y-8 mt-4">
            <div className="flex items-center space-x-4 border-b border-border pb-4">
              <Swords className="w-10 h-10 text-red-500" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Battle Mode</h1>
                <p className="text-muted-foreground">Compete against friends in AI-judged coding challenges with anti-cheat protection.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card p-6 rounded-lg border border-border space-y-4 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:border-red-500/50 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Play className="w-24 h-24 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold flex items-center gap-2 relative z-10"><Play className="w-6 h-6 text-red-500"/> Create a Battle</h2>
                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-1 block">Topic or Prompt</label>
                    <Input 
                      className="bg-background border-border focus:border-red-500 transition-colors"
                      placeholder="e.g. Find the shortest path in a maze..." 
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-1 block">Duration (minutes)</label>
                    <Input 
                      className="bg-background border-border focus:border-red-500 transition-colors"
                      type="number" 
                      value={duration}
                      onChange={e => setDuration(parseInt(e.target.value) || 30)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 py-6 text-lg"
                    onClick={() => {
                      createMutation.mutateAsync().then((data) => {
                        if (data && data.id) {
                          setBattleId(data.id);
                          setView('lobby');
                        }
                      }).catch(console.error);
                    }}
                    disabled={createMutation.isPending || !prompt}
                  >
                    {createMutation.isPending ? "Generating Problem..." : "Create Battle"}
                  </Button>
                  {errorMsg && (
                    <p className="text-red-500 text-sm mt-2 font-medium">{errorMsg}</p>
                  )}
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border space-y-4 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:border-blue-500/50 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Users className="w-24 h-24 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold flex items-center gap-2 relative z-10"><Users className="w-6 h-6 text-blue-500"/> Join a Battle</h2>
                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-1 block">Battle ID</label>
                    <Input 
                      className="bg-background border-border focus:border-blue-500 transition-colors"
                      placeholder="Enter Battle ID here" 
                      value={battleId}
                      onChange={e => setBattleId(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full mt-6 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white shadow-lg shadow-blue-500/10 py-6 text-lg"
                    variant="outline"
                    onClick={() => {
                      joinMutation.mutateAsync(battleId).then((id) => {
                        if (id) {
                          setBattleId(id);
                          setView('lobby');
                        }
                      }).catch(console.error);
                    }}
                    disabled={joinMutation.isPending || !battleId}
                  >
                    Join Battle
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'lobby') {
    return (
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="max-w-2xl mx-auto text-center space-y-8 mt-12">
          <h1 className="text-4xl font-bold">Battle Lobby</h1>
          
          <div className="bg-card p-6 rounded-lg border border-border inline-block text-left min-w-[300px]">
            <p className="text-sm text-muted-foreground mb-2">Invite friends with this ID:</p>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-4 py-2 rounded text-lg font-mono tracking-wider text-primary">{battleId}</code>
              <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(battleId)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border text-left shadow-lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5"/> Participants ({battleData?.participants?.length || 0})</h3>
            <ul className="space-y-2">
              {battleData?.participants?.map((p: any) => (
                <li key={p.userId} className="flex items-center gap-2 text-foreground font-medium bg-muted/50 p-2 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {p.username} {p.userId === user?.id ? "(You)" : ""}
                </li>
              ))}
            </ul>
          </div>

          {battleData?.battle?.creatorId === user?.id ? (
            <Button 
              size="lg" 
              className="w-full bg-red-600 hover:bg-red-700 text-white text-lg h-14 shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-transform"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              Start Battle!
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse p-4 bg-muted/20 rounded">
              <Clock className="w-5 h-5" /> Waiting for creator to start...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'arena') {
    return (
      <div className="flex flex-col h-screen w-full relative overflow-hidden bg-background">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Swords className="text-red-500 w-6 h-6 animate-pulse" />
            <h1 className="text-lg font-semibold text-red-500">BATTLE ACTIVE</h1>
          </div>
          <div className="flex items-center gap-6">
            <Select value={language} onValueChange={(v) => {
              setLanguage(v);
              const aiTemplates = battleData?.battle?.startingCode || {};
              const defaultTemplates: Record<string, string> = {
                javascript: 'class Solution {\n    solve() {\n        // Write your code here\n    }\n}',
                typescript: 'class Solution {\n    solve(): void {\n        // Write your code here\n    }\n}',
                python: 'class Solution:\n    def solve(self):\n        pass',
                java: 'class Solution {\n    public void solve() {\n        // Write your code here\n    }\n}',
                cpp: 'class Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};',
                c: 'void solve() {\n    // Write your code here\n}'
              };
              let rawCode = aiTemplates[v] || defaultTemplates[v] || defaultTemplates['javascript'];
              // Fix literal \n strings that might come from AI JSON parsing
              if (typeof rawCode === 'string') {
                rawCode = rawCode.replace(/\\n/g, '\n');
              }
              setCode(rawCode);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="c">C</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 text-xl font-mono font-bold text-red-400">
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
            <Button variant="destructive" onClick={() => handleForceSubmit()} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Submit Solution"}
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={35} minSize={20}>
              <div className="h-full bg-card p-6 overflow-y-auto prose prose-invert max-w-none">
                <div className="flex items-center gap-2 text-amber-500 mb-6 bg-amber-500/10 p-3 rounded border border-amber-500/20 shadow">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium m-0">Anti-cheat is active. Switching tabs or pasting code will instantly submit your current progress and lock you out.</p>
                </div>
                {/* Display Markdown */}
                <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-border/50 text-gray-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {battleData?.battle?.generatedProblem || ''}
                  </ReactMarkdown>
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/50 transition-colors cursor-col-resize flex items-center justify-center">
              <div className="h-8 w-1 rounded-full bg-muted-foreground/30" />
            </PanelResizeHandle>
            <Panel defaultSize={65} minSize={30}>
              <div className="h-full relative" onPaste={handlePaste} onCopyCapture={(e) => e.preventDefault()}>
                <MonacoEditor
                  code={code}
                  language={language}
                  onChange={setCode}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 16
                  }}
                />
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    );
  }

  if (view === 'results') {
    return (
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="max-w-4xl mx-auto text-center space-y-8 mt-12">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto" />
          <h1 className="text-4xl font-bold">Battle Results</h1>
          
          {battleData?.battle?.status === 'evaluating' ? (
            <div className="text-lg text-muted-foreground py-12">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
              AI is currently judging all submissions...
            </div>
          ) : (
            <div className="space-y-4">
              {[...(battleData?.submissions || [])].sort((a: any, b: any) => (a.rank || 99) - (b.rank || 99)).map((sub: any) => {
                const participant = battleData.participants?.find((p: any) => p.userId === sub.userId);
                return (
                  <div key={sub.id} className="bg-card p-6 rounded-lg border border-border text-left flex gap-6 items-start shadow-lg hover:shadow-xl transition-shadow">
                    <div className="text-4xl font-black text-primary/30 w-12 text-center">
                      #{sub.rank || '-'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold">{participant?.username || 'Unknown User'}</h3>
                        <span className="text-lg font-bold text-green-400">Score: {sub.aiScore || 0}/100</span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{sub.aiFeedback}</p>
                      
                      <div className="bg-black/50 p-4 rounded text-sm font-mono overflow-x-auto border border-white/5">
                        <pre className="text-gray-300">{sub.code || "No code submitted."}</pre>
                      </div>
                    </div>
                  </div>
                );
              })}
              {battleData?.battle?.optimalSolution && (
                <div className="mt-12 bg-card p-8 rounded-xl border border-primary/30 text-left shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
                    <Trophy className="w-64 h-64" />
                  </div>
                  <h2 className="text-2xl font-bold flex items-center gap-3 mb-4 text-primary relative z-10">
                    <Trophy className="w-7 h-7 text-yellow-500" />
                    Optimal Solution (AI Generated)
                  </h2>
                  <p className="text-muted-foreground mb-6 relative z-10 text-lg">
                    Review the most efficient approach to solve this problem for your learning and reference.
                  </p>
                  <div className="bg-black/80 p-6 rounded-lg text-sm font-mono overflow-x-auto border border-white/10 relative z-10 shadow-inner">
                    <pre className="text-green-400 leading-relaxed">{battleData.battle.optimalSolution}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button variant="outline" className="mt-12 w-full max-w-sm text-lg py-6" onClick={() => setView('home')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
