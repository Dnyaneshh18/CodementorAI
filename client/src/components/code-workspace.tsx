import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MonacoEditor } from "@/components/monaco-editor";
import { AIAnalysisPanel } from "@/components/ai-analysis-panel";
import { ExecutionHistory } from "@/components/execution-history";
import { ProgressDashboard } from "@/components/progress-dashboard";
import { BattleDashboard } from "@/components/battle-dashboard";
import { InteractiveTerminal } from "@/components/interactive-terminal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Download, RefreshCw, CheckCircle, XCircle, Clock, PanelRightOpen, PanelRightClose, History } from "lucide-react";
import type { ViewType } from "@/pages/home-page";

interface ExecutionResult {
  output: string;
  error: string;
  exitCode: number;
  executionTime: number;
  memoryUsage?: number;
}

interface CodeWorkspaceProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  onSidebarVisibilityChange?: (hidden: boolean) => void;
}

export function CodeWorkspace({
  activeView,
  onNavigate,
  onSidebarVisibilityChange,
}: CodeWorkspaceProps) {
  // State for code editor and execution
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [triggerRun, setTriggerRun] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(300); // Default height in pixels
  const [isResizing, setIsResizing] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Handle mouse move for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    if (consoleRef.current) {
      const containerRect = consoleRef.current.getBoundingClientRect();
      const newHeight = window.innerHeight - e.clientY - 16; // 16px padding from bottom
      // Limit height between 200px and 80% of viewport
      setConsoleHeight(Math.min(Math.max(newHeight, 200), window.innerHeight * 0.8));
    }
  }, [isResizing]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Load template code when language changes
  const { data: templateData } = useQuery({
    queryKey: ["/api/template", language],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/template/${language}`);
      return await res.json();
    },
  });

  useEffect(() => {
    if (templateData?.template && !code.trim()) {
      setCode(templateData.template);
    }
  }, [templateData, code]);



  const handleRunCode = () => {
    if (!code.trim()) {
      return;
    }
    setIsExecuting(true);
    setTriggerRun(prev => prev + 1);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(""); // Clear code to load new template
    setExecutionResult(null);
  };

  const handleDownloadCode = () => {
    const extension = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      typescript: 'ts'
    }[language] || 'txt';
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  // Render different pages based on activeView
  if (activeView === 'debug-history') {
    return (
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="max-w-5xl mx-auto">
          <ExecutionHistory
            onReplay={(replayCode, replayLanguage, replayStdin) => {
              setCode(replayCode);
              setLanguage(replayLanguage);
              setExecutionResult(null);
              onNavigate('editor');
            }}
          />
        </div>
      </div>
    );
  }

  if (activeView === 'progress') {
    return (
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="max-w-5xl mx-auto">
          <ProgressDashboard />
        </div>
      </div>
    );
  }

  if (activeView === 'battle') {
    return <BattleDashboard onArenaStateChange={onSidebarVisibilityChange} />;
  }

  // Default Editor View
  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden bg-background">
      {/* Top Bar */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">Workspace</h1>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select language" />
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
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunCode}
            disabled={isExecuting}
            className="gap-2"
          >
            {isExecuting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCode}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={togglePanel}
            className="ml-2"
            title={isPanelOpen ? "Hide AI Panel" : "Show AI Panel"}
          >
            {isPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Editor and Console Container */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            width: isPanelOpen ? 'calc(100% - 400px)' : '100%',
            transition: 'width 0.2s ease-out',
          }}
        >
          {/* Editor - Upper Half */}
          <div className="flex-1 min-h-0 relative">
            <MonacoEditor
              code={code}
              language={language}
              onChange={setCode}
              options={{
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true
              }}
            />
          </div>

          {/* Console - Lower Half */}
          <div 
            ref={consoleRef}
            className="flex flex-col border-t border-border bg-card w-full overflow-hidden"
            style={{ 
              height: `${consoleHeight}px`,
              minHeight: '200px',
              maxHeight: '80vh',
              transition: isResizing ? 'none' : 'height 0.2s ease-out'
            }}
          >
            {/* Resize handle */}
            <div 
              className="h-2 w-full bg-transparent hover:h-3 hover:bg-primary/20 cursor-row-resize transition-all duration-100 flex items-center justify-center group"
              onMouseDown={() => setIsResizing(true)}
            >
              <div className="w-12 h-0.5 bg-muted-foreground/40 group-hover:bg-primary rounded-full" />
            </div>
            {/* Console Header */}
            <div className="h-10 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
              <span className="text-sm font-medium text-muted-foreground">Console</span>
              <div className="flex items-center space-x-2">
                {executionResult && (
                  <span className="text-xs text-muted-foreground">
                    {executionResult.exitCode === 0 ? '✓' : '✗'} 
                    {executionResult.executionTime}ms
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => {
                    setExecutionResult(null);
                    setTriggerRun(0);
                  }}
                >
                  <span className="text-xs">Clear</span>
                </Button>
              </div>
            </div>
            
            {/* Interactive Terminal Output */}
            <div className="flex-1 bg-[hsl(240,10%,5%)] text-sm overflow-hidden">
              <InteractiveTerminal
                code={code}
                language={language}
                isExecuting={isExecuting}
                onExecutionComplete={(code) => {
                  setIsExecuting(false);
                  setExecutionResult({ output: "", error: "", exitCode: code, executionTime: 0 });
                }}
                triggerRun={triggerRun}
              />
            </div>
          </div>
        </div>

        {/* AI Analysis Panel - Positioned absolutely on the right */}
        {isPanelOpen && (
          <div
            className="absolute right-0 top-0 bottom-0 bg-card border-l border-border overflow-hidden transition-all duration-200 ease-out flex flex-col"
            style={{ width: '400px' }}
          >
            <div className="h-full overflow-y-auto">
              <AIAnalysisPanel code={code} language={language} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

