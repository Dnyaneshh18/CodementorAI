import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MonacoEditor } from "@/components/monaco-editor";
import { AIAnalysisPanel } from "@/components/ai-analysis-panel";
import { ExecutionHistory } from "@/components/execution-history";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Download, RefreshCw, CheckCircle, XCircle, Clock, PanelRightOpen, PanelRightClose, History, BarChart3, Bug } from "lucide-react";

w
      setOutput(result.output || "No output");
      setIsExecuting(false);
    },
    onError: (error: any) => {
      setOutput(`Error: ${error.message}`);
      setIsExecuting(false);
    },
  });

  const handleRunCode = () => {
    if (!code.trim()) {
      setOutput("No code to execute");
      return;
    }
    executeMutation.mutate({ code, language, stdin });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode("");
    setOutput("");
    setExecutionResult(null);
  };

  const handleReplay = (replayCode: string, replayLanguage: string, replayStdin: string) => {
    console.log("Replay triggered:", { replayCode, replayLanguage, replayStdin });
    setCode(replayCode);
    setLanguage(replayLanguage);
    setStdin(replayStdin);
    setOutput("");
    setExecutionResult(null);
    
    // Switch to editor tab
    setActiveTab("editor");
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

  const togglePanel = () => setIsPanelOpen(!isPanelOpen);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', resizePanelWidth);
    document.addEventListener('mouseup', stopResizing);
  };

  const stopResizing = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', resizePanelWidth);
    document.removeEventListener('mouseup', stopResizing);
  };

  const resizePanelWidth = (e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      if (newWidth > 200 && newWidth < 800) {
        setPanelWidth(newWidth);
      }
    }
  };

  const startResizingPanel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingPanel(true);
    document.body.classList.add('select-none');
    document.body.style.cursor = 'row-resize';
    document.addEventListener('mousemove', resizePanel);
    document.addEventListener('mouseup', stopResizingPanel);
  };

  const startResizingOutput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingOutput(true);
    document.body.classList.add('select-none');
    document.body.style.cursor = 'row-resize';
    document.addEventListener('mousemove', resizeOutput);
    document.addEventListener('mouseup', stopResizingOutput);
  };

  const stopResizingPanel = () => {
    setIsResizingPanel(false);
    document.body.classList.remove('select-none');
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', resizePanel);
    document.removeEventListener('mouseup', stopResizingPanel);
  };

  const stopResizingOutput = () => {
    setIsResizingOutput(false);
    document.body.classList.remove('select-none');
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', resizeOutput);
    document.removeEventListener('mouseup', stopResizingOutput);
  };

  const resizePanel = (e: MouseEvent) => {
    if (isResizingPanel && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      setPanelHeight(Math.max(150, Math.min(containerRect.height - 100, newHeight)));
    }
  };

  const resizeOutput = (e: MouseEvent) => {
    if (isResizingOutput && containerRef.current) {
      const container = containerRef.current.querySelector('.terminal-panel');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
        setOutputHeight(`${Math.max(20, Math.min(80, newHeight))}%`);
      }
    }
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', resizePanel);
      document.removeEventListener('mouseup', stopResizingPanel);
      document.removeEventListener('mousemove', resizeOutput);
      document.removeEventListener('mouseup', stopResizingOutput);
      document.removeEventListener('mousemove', resizePanelWidth);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full" ref={containerRef}>
      {/* Top Bar */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">Code Editor</h1>
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
            variant={isDebugHistoryOpen ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleDebugHistory}
            className="ml-2 hover:bg-accent hover:text-accent-foreground transition-colors"
            title={isDebugHistoryOpen ? "Hide Debug History" : "Show Debug History"}
          >
            <History className="w-4 h-4 mr-2" />
            {isDebugHistoryOpen ? "Hide" : "Show"} History
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
      <div className="flex-1 flex overflow-hidden">
        {/* Editor and Terminal Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Main Editor Area */}
            <div className="flex-1 overflow-hidden">
              <MonacoEditor
                code={code}
                language={language}
                onChange={setCode}
              />
            </div>
            
            {/* Debug History Sidebar */}
            {isDebugHistoryOpen && (
              <div className="fixed right-0 top-12 bottom-0 w-80 bg-card border-l border-border flex flex-col z-50 shadow-lg">
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Debug History</h3>
                  <button
                    onClick={onToggleDebugHistory}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Close Debug History"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <ExecutionHistory onReplay={handleReplay} />
                </div>
              </div>
            )}
          </div>

          {/* Terminal Panel */}
          <div 
            className="terminal-panel bg-card border-t border-border flex flex-col flex-shrink-0 transition-[height] duration-200 ease-out relative"
            style={{ 
              height: `${panelHeight}px`,
              minHeight: '150px',
              maxHeight: '70%'
            }}
          >
            {/* Resize handle for terminal panel */}
            <div 
              className="h-2 w-full cursor-row-resize flex items-center justify-center group"
              onMouseDown={startResizingPanel}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setPanelHeight(200);
              }}
              title="Drag to resize terminal panel or double-click to reset"
            >
              <div className="w-16 h-1 bg-border rounded-full group-hover:bg-primary group-active:bg-primary transition-colors" />
            </div>
            
            {/* Output Console */}
            <div 
              className="overflow-auto p-4"
              style={{ height: outputHeight }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium text-foreground">Console Output</h3>
                  {executionResult && (
                    <div className="flex items-center space-x-2">
                      {executionResult.exitCode === 0 ? (
                        <Badge variant="default" className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Success</span>
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center space-x-1">
                          <XCircle className="w-3 h-3" />
                          <span>Error</span>
                        </Badge>
                      )}
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{executionResult.executionTime}ms</span>
                      </Badge>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1"
                  onClick={() => {
                    setOutput("");
                    setExecutionResult(null);
                  }}
                >
                  <span className="text-xs">✕</span>
                </Button>
              </div>
              <div className="font-mono text-sm">
                {isExecuting ? (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing code...</span>
                  </div>
                ) : executionResult?.error ? (
                  <pre className="text-red-400 whitespace-pre-wrap" data-testid="text-error">
                    {executionResult.error}
                  </pre>
                ) : (
                  <pre className="text-green-400 whitespace-pre-wrap" data-testid="text-output">
                    {output || "Run your code to see output here..."}
                  </pre>
                )}
              </div>
            </div>
            
            {/* Standard Input */}
            <div 
              className="p-3 flex flex-col overflow-hidden"
              style={{ 
                height: `calc(100% - ${outputHeight} - 2rem)`,
                minHeight: '120px'
              }}
            >
              <label className="block text-xs text-muted-foreground mb-2">
                Standard Input 
                <span className="text-xs text-blue-400 ml-2">
                  (Enter all inputs separated by newlines)
                </span>
              </label>
              <textarea
                className="w-full h-full bg-[hsl(240,10%,5%)] text-gray-300 font-mono text-sm p-3 rounded-md outline-none resize-none border border-border/20"
                placeholder="For menu-driven programs, enter all choices and values separated by newlines&#10;Example: 1&#10;10&#10;1&#10;20&#10;1&#10;5&#10;2&#10;3&#10;4"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
              />
              <div className="mt-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Simple program: Leave empty</span>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Single input: Enter value (e.g., "42")</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Menu program: Enter all inputs (e.g., "1&#10;10&#10;1&#10;20&#10;4")</span>
                </div>
              </div>
              <div className="mt-2 p-2 bg-[hsl(240,10%,8%)] rounded text-xs text-blue-300">
                <strong>BST Example:</strong> Insert 10, 20, 5 → Show inorder → Get height → Exit<br/>
                <code className="text-green-400">1&#10;10&#10;1&#10;20&#10;1&#10;5&#10;2&#10;3&#10;4</code>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Tools Panel */}
        {isPanelOpen && (
          <div 
            ref={panelRef}
            className="h-full bg-card/50 border-l border-border overflow-hidden transition-all duration-200 flex-shrink-0"
            style={{ width: `${panelWidth}px`, minWidth: '300px', maxWidth: '600px' }}
          >
            {/* Resize Handle */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 bg-border hover:bg-primary/50 cursor-col-resize z-10 group"
              onMouseDown={startResizing}
              title="Drag to resize panel or double-click to reset"
            >
              <div className="w-1 h-16 bg-border rounded-full group-hover:bg-primary/50 group-active:bg-primary transition-colors absolute top-1/2 -translate-y-1/2 left-0" />
            </div>
            
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Learning Tools</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPanelOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <PanelRightClose className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 m-2">
                  <TabsTrigger value="editor" className="text-xs">
                    <History className="w-3 h-3 mr-1" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="flex-1 overflow-hidden">
                  <AIAnalysisPanel code={code} language={language} />
                </TabsContent>
                
                <TabsContent value="history" className="flex-1 overflow-hidden">
                  <ExecutionHistory onReplay={handleReplay} />
                </TabsContent>
                
                <TabsContent value="analytics" className="flex-1 overflow-hidden">
                  <AnalyticsDashboard />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
