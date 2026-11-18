import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Code, 
  Terminal,
  Calendar,
  TrendingUp,
  Activity,
  History
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ExecutionHistory {
  id: string;
  userId: string;
  code: string;
  language: string;
  stdin: string;
  output: string;
  error: string;
  exitCode: number;
  executionTime: number;
  memoryUsage?: number;
  success: boolean;
  createdAt: string;
}

interface ExecutionHistoryProps {
  onReplay: (code: string, language: string, stdin: string) => void;
}

export function ExecutionHistory({ onReplay }: ExecutionHistoryProps) {
  const [selectedHistory, setSelectedHistory] = useState<ExecutionHistory | null>(null);
  const queryClient = useQueryClient();

  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ["/api/execution-history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/execution-history");
      return await res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/execution-history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/execution-history"] });
      if (selectedHistory && !history.find((h: ExecutionHistory) => h.id === selectedHistory.id)) {
        setSelectedHistory(null);
      }
    },
  });

  const handleReplay = (historyItem: ExecutionHistory) => {
    onReplay(historyItem.code, historyItem.language, historyItem.stdin);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this execution history?")) {
      deleteMutation.mutate(id);
    }
  };

  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      javascript: "🟨",
      typescript: "🔷",
      python: "🐍",
      java: "☕",
      cpp: "⚙️",
      c: "⚪"
    };
    return icons[language] || "📄";
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center text-destructive bg-destructive/10 p-8 rounded-xl border border-destructive/20 backdrop-blur-sm">
          <Terminal className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Failed to load history</h2>
          <p className="text-sm opacity-80">{error.message}</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center text-muted-foreground max-w-md p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md shadow-2xl">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">No History Yet</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your execution history is empty. Go write some code and run it, then come back here to review your past executions!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col pt-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Execution Timeline
          </h1>
          <p className="text-muted-foreground mt-1">Review and replay your past code executions</p>
        </div>
        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium rounded-full shadow-inner bg-secondary/50 backdrop-blur-md border border-secondary">
          {history.length} {history.length === 1 ? 'Run' : 'Runs'}
        </Badge>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Column: List */}
        <div className="w-1/3 flex flex-col bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          
          <div className="p-4 border-b border-border/50 bg-card/60 backdrop-blur-md z-10 flex-shrink-0">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Recent Runs
            </h2>
          </div>

          <ScrollArea className="flex-1 z-10">
            <div className="p-3 space-y-3">
              {history.map((item: ExecutionHistory, index: number) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedHistory(item)}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                    selectedHistory?.id === item.id 
                      ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.15)] scale-[1.02]' 
                      : 'bg-card/50 border-transparent hover:border-border hover:bg-card hover:scale-[1.01]'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl bg-background/50 w-10 h-10 rounded-lg flex items-center justify-center shadow-inner">
                        {getLanguageIcon(item.language)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm capitalize flex items-center gap-2">
                          {item.language}
                          {item.success ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs font-mono bg-background/60 p-2 rounded-lg text-muted-foreground truncate border border-border/30 group-hover:border-border/60 transition-colors">
                    {item.code.split('\n')[0].substring(0, 50) || '// Empty code'}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Column: Details */}
        <div className="flex-1 flex flex-col bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden relative">
          {selectedHistory ? (
            <>
              {/* Details Header */}
              <div className="p-6 border-b border-border/50 bg-card/60 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="text-4xl bg-background/50 w-14 h-14 rounded-xl flex items-center justify-center shadow-inner">
                    {getLanguageIcon(selectedHistory.language)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold capitalize flex items-center gap-2">
                      {selectedHistory.language} Execution
                      {selectedHistory.success ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Success</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20">Failed</Badge>
                      )}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedHistory.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
                    onClick={() => handleReplay(selectedHistory)}
                  >
                    <Play className="w-4 h-4 mr-2" /> Replay Code
                  </Button>
                  <Button
                    variant="destructive"
                    className="shadow-sm opacity-90 hover:opacity-100"
                    onClick={() => handleDelete(selectedHistory.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>

              {/* Details Content */}
              <ScrollArea className="flex-1 z-10 p-6">
                <div className="space-y-6 max-w-4xl mx-auto pb-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-background/50 border border-border/50 rounded-xl p-4 flex flex-col gap-1 items-center justify-center shadow-inner">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Exit Code</span>
                      <span className={`text-2xl font-bold ${selectedHistory.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {selectedHistory.exitCode}
                      </span>
                    </div>
                    <div className="bg-background/50 border border-border/50 rounded-xl p-4 flex flex-col gap-1 items-center justify-center shadow-inner">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Execution Time</span>
                      <span className="text-2xl font-bold text-blue-400">
                        {selectedHistory.executionTime}ms
                      </span>
                    </div>
                    <div className="bg-background/50 border border-border/50 rounded-xl p-4 flex flex-col gap-1 items-center justify-center shadow-inner">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Memory</span>
                      <span className="text-2xl font-bold text-amber-400">
                        {selectedHistory.memoryUsage || 'N/A'} <span className="text-sm">KB</span>
                      </span>
                    </div>
                  </div>

                  {/* Code Block */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Code className="w-4 h-4" /> Source Code
                    </h3>
                    <div className="rounded-xl overflow-hidden border border-border/50 shadow-lg relative group">
                      <pre className="p-4 bg-[#1e1e1e] text-gray-300 text-sm font-mono overflow-x-auto">
                        <code>{selectedHistory.code}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Input Block (if exists) */}
                  {selectedHistory.stdin && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Standard Input
                      </h3>
                      <pre className="p-4 bg-background/50 border border-border/50 rounded-xl text-sm font-mono text-gray-300 whitespace-pre-wrap shadow-inner">
                        {selectedHistory.stdin}
                      </pre>
                    </div>
                  )}

                  {/* Output Block */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Standard Output
                    </h3>
                    <pre className="p-4 bg-[#0d1117] border border-border/50 rounded-xl text-sm font-mono text-green-400 whitespace-pre-wrap shadow-inner min-h-[100px]">
                      {selectedHistory.output || 'No output produced.'}
                    </pre>
                  </div>

                  {/* Error Block */}
                  {selectedHistory.error && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-rose-500 uppercase tracking-wider">
                        Standard Error
                      </h3>
                      <pre className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl text-sm font-mono text-rose-400 whitespace-pre-wrap shadow-inner overflow-x-auto">
                        {selectedHistory.error}
                      </pre>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 opacity-60">
              <History className="w-24 h-24 mb-6 text-primary/30" />
              <h3 className="text-2xl font-bold mb-2">Select a Run</h3>
              <p className="text-center max-w-sm">
                Click on any execution item from the list on the left to view its detailed metrics, source code, and output.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
