import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface InteractiveTerminalProps {
  code: string;
  language: string;
  isExecuting: boolean;
  onExecutionComplete: (exitCode: number) => void;
  triggerRun: number;
}

export function InteractiveTerminal({ code, language, isExecuting, onExecutionComplete, triggerRun }: InteractiveTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;
    if (term.current) return;

    term.current = new Terminal({
      theme: {
        background: '#0d0d12',
        foreground: '#e2e2e2',
        cursor: '#f8f8f2',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
      convertEol: true // Automatically converts \n to \r\n for xterm
    });
    
    fitAddon.current = new FitAddon();
    term.current.loadAddon(fitAddon.current);
    term.current.open(terminalRef.current);
    fitAddon.current.fit();

    term.current.writeln("\x1b[38;5;244mReady. Click 'Run' to execute code interactively...\x1b[0m");

    const handleResize = () => {
      fitAddon.current?.fit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.current?.dispose();
    };
  }, []);

  useEffect(() => {
    // When triggerRun changes and > 0, we start a new execution
    if (triggerRun === 0 || !term.current) return;
    
    // Clear previous output
    term.current.reset();
    term.current.writeln("\x1b[38;5;14m> Starting execution...\x1b[0m\r\n");

    // Close existing ws if any
    if (ws.current) {
      ws.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws.current = new WebSocket(`${protocol}//${window.location.host}/api/execute-ws`);

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({
        type: "init",
        code,
        language
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "output") {
          term.current?.write(msg.data);
        } else if (msg.type === "error") {
          term.current?.write(`\x1b[31m${msg.data}\x1b[0m`);
        } else if (msg.type === "exit") {
          term.current?.writeln(`\r\n\x1b[38;5;244m[Process exited with code ${msg.code}]\x1b[0m`);
          onExecutionComplete(msg.code);
        }
      } catch (e) {
        console.error(e);
      }
    };

    ws.current.onerror = () => {
      term.current?.writeln("\x1b[31m\r\n[WebSocket Connection Error]\x1b[0m");
      onExecutionComplete(1);
    };

    ws.current.onclose = () => {
      // closed
    };

    // Capture terminal keystrokes and send them to the server
    const dataListener = term.current.onData((data) => {
      // Handle local echo properly for Enter and Backspace
      if (data === '\r') {
        term.current?.write('\r\n');
      } else if (data === '\x7f') {
        term.current?.write('\b \b');
      } else {
        term.current?.write(data);
      }
      
      if (ws.current?.readyState === WebSocket.OPEN) {
        // Send \r\n when Enter is pressed so the backend process detects the newline
        ws.current.send(JSON.stringify({ type: "input", data: data === '\r' ? '\r\n' : data }));
      }
    });

    return () => {
      dataListener.dispose();
      ws.current?.close();
    };
  }, [triggerRun]);

  return (
    <div className="w-full h-full flex flex-col relative bg-[hsl(240,10%,5%)]">
      <div className="flex-1 w-full h-full overflow-hidden p-2" ref={terminalRef}></div>
    </div>
  );
}
