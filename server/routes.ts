import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storagePromise } from "./storage";
import { debugCode, analyzeComplexity, detectConcepts, analyzeAll } from "./gemini";
import { insertCodeSubmissionSchema, insertExecutionHistorySchema, insertLearningAnalyticsSchema } from "@shared/schema";
import { codeExecutionService, ExecutionResult } from "./code-execution";
import { WebSocketServer } from "ws";
import { parse } from "url";
import { spawn } from "child_process";
import { join } from "path";
import { writeFileSync, unlinkSync } from "fs";
import os from "os";
import { randomUUID } from "crypto";

export function registerRoutes(app: Express): Server {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Middleware to check authentication for protected routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Debug endpoint
  app.post("/api/debug", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const { code, language, error } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }

      const debugResult = await debugCode(code, language, error);
      
      // Save submission to database
      const submission = await storage.createCodeSubmission({
        userId: req.user!.id,
        code,
        language,
        debuggingResults: JSON.stringify(debugResult),
        timeComplexity: null,
        spaceComplexity: null,
        concepts: [],
        aiSuggestions: debugResult.explanation
      });

      // Update user progress
      const userProgress = await storage.getUserProgress(req.user!.id);
      if (userProgress) {
        await storage.updateUserProgress(req.user!.id, {
          bugsFixed: userProgress.bugsFixed + 1,
          lastActive: new Date()
        });
      }

      res.json(debugResult);
    } catch (error: any) {
      console.error("Debug error:", error);
      const isRateLimit = error?.status === 429 || error?.message?.includes("Rate limit");
      const status = isRateLimit ? 429 : 500;
      const message = isRateLimit
        ? "AI rate limit reached. Please wait a few seconds before retrying."
        : (error?.message || "Failed to debug code");
      res.status(status).json({ message });
    }
  });

  // Complexity analysis endpoint
  app.post("/api/complexity", requireAuth, async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }

      const complexityResult = await analyzeComplexity(code, language);
      
      // Save or update submission
      const storage = await storagePromise;
      const submission = await storage.createCodeSubmission({
        userId: req.user!.id,
        code,
        language,
        timeComplexity: complexityResult.timeComplexity,
        spaceComplexity: complexityResult.spaceComplexity,
        debuggingResults: null,
        concepts: [],
        aiSuggestions: complexityResult.analysis
      });

      res.json(complexityResult);
    } catch (error: any) {
      console.error("Complexity analysis error:", error);
      const isRateLimit = error?.status === 429 || error?.message?.includes("Rate limit");
      const status = isRateLimit ? 429 : 500;
      const message = isRateLimit
        ? "AI rate limit reached. Please wait a few seconds before retrying."
        : (error?.message || "Failed to analyze complexity");
      res.status(status).json({ message });
    }
  });

  // Recommendations endpoint
  app.post("/api/recommendations", requireAuth, async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }

      const conceptResult = await detectConcepts(code, language);
      
      // Save or update submission
      const storage = await storagePromise;
      const submission = await storage.createCodeSubmission({
        userId: req.user!.id,
        code,
        language,
        concepts: conceptResult.concepts,
        timeComplexity: null,
        spaceComplexity: null,
        debuggingResults: null,
        aiSuggestions: JSON.stringify(conceptResult.recommendations)
      });

      res.json(conceptResult);
    } catch (error: any) {
      console.error("Recommendations error:", error);
      const isRateLimit = error?.status === 429 || error?.message?.includes("Rate limit");
      const status = isRateLimit ? 429 : 500;
      const message = isRateLimit
        ? "AI rate limit reached. Please wait a few seconds before retrying."
        : (error?.message || "Failed to get recommendations");
      res.status(status).json({ message });
    }
  });

  // Get user progress
  app.get("/api/progress", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const userProgress = await storage.getUserProgress(req.user!.id);
      const submissions = await storage.getCodeSubmissionsByUser(req.user!.id);
      
      res.json({
        progress: userProgress,
        submissions: submissions.slice(-10), // Last 10 submissions
        user: req.user
      });
    } catch (error) {
      console.error("Progress error:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Get code submissions history
  app.get("/api/submissions", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const submissions = await storage.getCodeSubmissionsByUser(req.user!.id);
      res.json(submissions);
    } catch (error) {
      console.error("Submissions error:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Real-time code execution endpoint
  app.post("/api/execute", requireAuth, async (req, res) => {
    try {
      const { code, language, stdin } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }

      const executionResult = await codeExecutionService.executeCode(code, language, stdin);
      
      // Save execution to database
      const storage = await storagePromise;
      
      // Save to execution history
      const executionHistory = await storage.createExecutionHistory({
        userId: req.user!.id,
        code,
        language,
        stdin: stdin || "",
        output: executionResult.output || "",
        error: executionResult.error || "",
        exitCode: executionResult.exitCode > 2147483647 ? 1 : (executionResult.exitCode | 0),
        executionTime: executionResult.executionTime,
        memoryUsage: executionResult.memoryUsage,
        success: executionResult.exitCode === 0
      });

      // Save execution to code submissions (for legacy compatibility)
      const submission = await storage.createCodeSubmission({
        userId: req.user!.id,
        code,
        language,
        timeComplexity: null,
        spaceComplexity: null,
        concepts: [],
        aiSuggestions: `Execution time: ${executionResult.executionTime}ms`,
        debuggingResults: JSON.stringify(executionResult)
      });

      // Update user progress
      const userProgress = await storage.getUserProgress(req.user!.id);
      if (userProgress) {
        const languageUsed = { ...userProgress.languagesUsed };
        languageUsed[language] = (languageUsed[language] || 0) + 1;
        
        // Calculate new averages
        const totalExecutions = userProgress.totalExecutions + 1;
        const successfulExecutions = userProgress.successfulExecutions + (executionResult.exitCode === 0 ? 1 : 0);
        const averageExecutionTime = (userProgress.averageExecutionTime * userProgress.totalExecutions + executionResult.executionTime) / totalExecutions;
        
        await storage.updateUserProgress(req.user!.id, {
          problemsSolved: userProgress.problemsSolved + 1,
          languagesUsed: languageUsed,
          totalExecutions,
          successfulExecutions,
          averageExecutionTime,
          lastActive: new Date()
        });

        // Update learning analytics
        const successRate = (successfulExecutions / totalExecutions) * 100;
        await storage.updateLearningAnalytics(req.user!.id, language, {
          executionsCount: languageUsed[language],
          successRate,
          averageTime: executionResult.executionTime
        });
      }

      res.json({ ...executionResult, historyId: executionHistory.id });
    } catch (error) {
      console.error("Code execution error:", error);
      res.status(500).json({ message: "Failed to execute code" });
    }
  });

  // Get code template for a language
  app.get("/api/template/:language", requireAuth, async (req, res) => {
    try {
      const { language } = req.params;
      const template = codeExecutionService.getTemplate(language);
      res.json({ template, language });
    } catch (error) {
      console.error("Template error:", error);
      res.status(500).json({ message: "Failed to get template" });
    }
  });

  // Enhanced AI analysis endpoint (combines all AI features)
  app.post("/api/analyze", requireAuth, async (req, res) => {
    try {
      const { code, language, analysisType = "all" } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }

      const results: any = {};

      // Run single combined analysis for 'all' to minimize token usage, or individual if specific
      if (analysisType === "all") {
        const combined = await analyzeAll(code, language);
        results.debug = combined.debug;
        results.complexity = combined.complexity;
        results.concepts = combined.concepts;
      } else {
        if (analysisType === "debug") {
          results.debug = await debugCode(code, language);
        }
        if (analysisType === "complexity") {
          results.complexity = await analyzeComplexity(code, language);
        }
        if (analysisType === "concepts") {
          results.concepts = await detectConcepts(code, language);
        }
      }

      // Save comprehensive analysis to database
      const storage = await storagePromise;
      const submission = await storage.createCodeSubmission({
        userId: req.user!.id,
        code,
        language,
        timeComplexity: results.complexity?.timeComplexity || null,
        spaceComplexity: results.complexity?.spaceComplexity || null,
        concepts: results.concepts?.concepts || [],
        aiSuggestions: JSON.stringify({
          debug: results.debug?.suggestions || [],
          recommendations: results.concepts?.recommendations || []
        }),
        debuggingResults: JSON.stringify(results.debug || null)
      });

      // Update user progress
      const userProgress = await storage.getUserProgress(req.user!.id);
      if (userProgress) {
        await storage.updateUserProgress(req.user!.id, {
          bugsFixed: userProgress.bugsFixed + (results.debug ? 1 : 0),
          lastActive: new Date()
        });
      }

      res.json(results);
    } catch (error: any) {
      console.error("AI analysis error:", error);
      const isRateLimit = error?.status === 429 || error?.message?.includes("Rate limit");
      const status = isRateLimit ? 429 : 500;
      const message = isRateLimit
        ? "AI rate limit reached. Please wait a few moments before requesting another analysis."
        : (error?.message || "Failed to analyze code");
      res.status(status).json({ message });
    }
  });

  // Get execution history
  app.get("/api/execution-history", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getExecutionHistoryByUser(req.user!.id, limit);
      res.json(history);
    } catch (error) {
      console.error("Execution history error:", error);
      res.status(500).json({ message: "Failed to fetch execution history" });
    }
  });

  // Get specific execution history item
  app.get("/api/execution-history/:id", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const history = await storage.getExecutionHistory(req.params.id);
      
      if (!history || history.userId !== req.user!.id) {
        return res.status(404).json({ message: "Execution history not found" });
      }
      
      res.json(history);
    } catch (error) {
      console.error("Execution history item error:", error);
      res.status(500).json({ message: "Failed to fetch execution history item" });
    }
  });

  // Delete execution history item
  app.delete("/api/execution-history/:id", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const history = await storage.getExecutionHistory(req.params.id);
      
      if (!history || history.userId !== req.user!.id) {
        return res.status(404).json({ message: "Execution history not found" });
      }
      
      await storage.deleteExecutionHistory(req.params.id);
      res.json({ message: "Execution history deleted successfully" });
    } catch (error) {
      console.error("Delete execution history error:", error);
      res.status(500).json({ message: "Failed to delete execution history" });
    }
  });

  // Get learning analytics
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const days = parseInt(req.query.days as string) || 30;
      const analytics = await storage.getLearningAnalyticsByUser(req.user!.id, days);
      
      // Get user progress for additional stats
      const progress = await storage.getUserProgress(req.user!.id);
      
      res.json({ analytics, progress });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get dashboard data (combined analytics and history)
  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const days = parseInt(req.query.days as string) || 7;
      
      const [analytics, progress, recentHistory, user] = await Promise.all([
        storage.getLearningAnalyticsByUser(req.user!.id, days),
        storage.getUserProgress(req.user!.id),
        storage.getExecutionHistoryByUser(req.user!.id, 10),
        storage.getUser(req.user!.id)
      ]);
      
      // Calculate additional metrics
      const totalExecutions = progress?.totalExecutions || 0;
      const successRate = totalExecutions > 0 ? ((progress?.successfulExecutions || 0) / totalExecutions) * 100 : 0;
      const favoriteLanguage = progress?.favoriteLanguage || 
        Object.keys(progress?.languagesUsed || {}).reduce((a, b) => 
          (progress?.languagesUsed?.[a] || 0) > (progress?.languagesUsed?.[b] || 0) ? a : b, 'javascript');
      
      res.json({
        analytics,
        progress,
        recentHistory,
        metrics: {
          totalExecutions,
          successRate,
          favoriteLanguage,
          averageExecutionTime: progress?.averageExecutionTime || 0,
          streak: user?.streak || 0,
          level: user?.level || 1
        }
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // --- Battle Mode Endpoints ---
  
  app.post("/api/battles/create", requireAuth, async (req, res) => {
    try {
      const { prompt, durationMinutes, teamSize } = req.body;
      if (!prompt) return res.status(400).json({ message: "Problem prompt is required" });

      const { generateBattleProblem } = await import("./gemini");
      const generatedResult = await generateBattleProblem(prompt);

      const storage = await storagePromise;
      const battle = await storage.createBattle({
        creatorId: req.user!.id,
        problemPrompt: prompt,
        generatedProblem: generatedResult.problem,
        startingCode: generatedResult.startingCode,
        teamSize: teamSize || 1,
        durationMinutes: durationMinutes || 30
      });

      await storage.createBattleParticipant({
        battleId: battle.id,
        userId: req.user!.id
      });

      res.json(battle);
    } catch (error: any) {
      console.error("Battle creation error:", error);
      const isRateLimit = error?.status === 429 || error?.message?.includes("Rate limit");
      const status = isRateLimit ? 429 : 500;
      const message = isRateLimit
        ? "AI rate limit reached. Please wait a few moments before creating another battle."
        : (error?.message || "Failed to create battle");
      res.status(status).json({ message });
    }
  });

  app.post("/api/battles/:id/join", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const battle = await storage.getBattle(req.params.id);
      if (!battle) return res.status(404).json({ message: "Battle not found" });
      
      if (battle.status !== "waiting") {
        return res.status(400).json({ message: "Battle has already started or finished" });
      }

      const participants = await storage.getBattleParticipants(battle.id);
      if (participants.some(p => p.userId === req.user!.id)) {
        return res.json({ message: "Already joined" }); // Idempotent
      }

      await storage.createBattleParticipant({
        battleId: battle.id,
        userId: req.user!.id
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Battle join error:", error);
      res.status(500).json({ message: "Failed to join battle" });
    }
  });

  app.post("/api/battles/:id/start", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const battle = await storage.getBattle(req.params.id);
      if (!battle) return res.status(404).json({ message: "Battle not found" });

      if (battle.creatorId !== req.user!.id) {
        return res.status(403).json({ message: "Only the creator can start the battle" });
      }

      const updated = await storage.updateBattle(battle.id, {
        status: "active",
        startedAt: new Date()
      });

      res.json(updated);
    } catch (error) {
      console.error("Battle start error:", error);
      res.status(500).json({ message: "Failed to start battle" });
    }
  });

  app.get("/api/battles/history", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const battles = await storage.getUserBattles(req.user!.id);
      
      // We also want to return participants and submissions for each to show leaderboard info
      const historyData = await Promise.all(battles.map(async (b) => {
        const participants = await storage.getBattleParticipants(b.id);
        const submissions = await storage.getBattleSubmissions(b.id);
        const users = await Promise.all(participants.map(async (p) => {
          const user = await storage.getUser(p.userId);
          return { ...p, username: user?.username };
        }));
        return { battle: b, participants: users, submissions };
      }));
      
      res.json(historyData);
    } catch (error) {
      console.error("Battle history fetch error:", error);
      res.status(500).json({ message: "Failed to fetch battle history" });
    }
  });

  app.get("/api/battles/:id", requireAuth, async (req, res) => {
    try {
      const storage = await storagePromise;
      const battle = await storage.getBattle(req.params.id);
      if (!battle) return res.status(404).json({ message: "Battle not found" });

      const participants = await storage.getBattleParticipants(battle.id);
      
      // Get full user profiles for participants
      const users = await Promise.all(
        participants.map(async (p) => {
          const user = await storage.getUser(p.userId);
          return { ...p, username: user?.username };
        })
      );

      const submissions = await storage.getBattleSubmissions(battle.id);

      res.json({ battle, participants: users, submissions });
    } catch (error) {
      console.error("Battle fetch error:", error);
      res.status(500).json({ message: "Failed to fetch battle" });
    }
  });

  app.post("/api/battles/:id/submit", requireAuth, async (req, res) => {
    try {
      const { code, language } = req.body;
      const storage = await storagePromise;
      const battle = await storage.getBattle(req.params.id);
      
      if (!battle) return res.status(404).json({ message: "Battle not found" });
      if (battle.status !== "active" && battle.status !== "evaluating") {
        return res.status(400).json({ message: "Battle is not active" });
      }

      // Check if user already submitted
      const existingSubmissions = await storage.getBattleSubmissions(battle.id);
      let userSub = existingSubmissions.find(s => s.userId === req.user!.id);
      
      if (!userSub) {
        userSub = await storage.createBattleSubmission({
          battleId: battle.id,
          userId: req.user!.id,
          code,
          language,
          isFinal: true
        });
      } else {
        userSub = await storage.updateBattleSubmission(userSub.id, {
          code,
          language,
          isFinal: true
        });
      }

      // Check if everyone has submitted
      const participants = await storage.getBattleParticipants(battle.id);
      const allSubmissions = await storage.getBattleSubmissions(battle.id);
      
      const allSubmitted = participants.every(p => 
        allSubmissions.some(s => s.userId === p.userId && s.isFinal)
      );

      if (allSubmitted && battle.status === "active") {
        // Mark as evaluating to prevent double trigger
        await storage.updateBattle(battle.id, { status: "evaluating" });
        
        // Trigger async evaluation
        const { evaluateBattleSubmissions } = await import("./gemini");
        
        try {
          const evalResult = await evaluateBattleSubmissions(
            battle.generatedProblem, 
            allSubmissions.map(s => ({ userId: s.userId, code: s.code, language: s.language }))
          );

          // Update submissions with ranks
          for (const rankInfo of evalResult.rankings) {
            const sub = allSubmissions.find(s => s.userId === rankInfo.userId);
            if (sub) {
              await storage.updateBattleSubmission(sub.id, {
                aiScore: rankInfo.score,
                aiFeedback: rankInfo.feedback,
                rank: rankInfo.rank
              });
            }
          }

          // Finish battle
          await storage.updateBattle(battle.id, {
            status: "finished",
            optimalSolution: evalResult.optimalSolution,
            endedAt: new Date()
          });
        } catch (evalError) {
          console.error("Evaluation failed:", evalError);
          // Revert to active or handle failure
          await storage.updateBattle(battle.id, { status: "finished", endedAt: new Date() });
        }
      }

      res.json({ success: true, submission: userSub });
    } catch (error) {
      console.error("Battle submit error:", error);
      res.status(500).json({ message: "Failed to submit solution" });
    }
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ noServer: true });
  
  const tempDir = join(os.tmpdir(), "codementor");

  wss.on('connection', (ws) => {
    let currentProcess: any = null;
    let fileToClean: string | null = null;
    
    ws.on('message', async (message) => {
      try {
        const msg = JSON.parse(message.toString());
        if (msg.type === "init") {
          const { code, language } = msg;
          const id = randomUUID();
          
          let command = "";
          let args: string[] = [];
          
          if (language === "python" || language === "py") {
             const file = join(tempDir, `${id}.py`);
             writeFileSync(file, code);
             fileToClean = file;
             command = "python";
             args = [file];
          } else if (language === "javascript" || language === "js") {
             const file = join(tempDir, `${id}.js`);
             writeFileSync(file, code);
             fileToClean = file;
             command = "node";
             args = [file];
          } else if (language === "cpp" || language === "c++") {
             const srcFile = join(tempDir, `${id}.cpp`);
             const outFile = join(tempDir, process.platform === 'win32' ? `${id}.exe` : `${id}_a.out`);
             writeFileSync(srcFile, code);
             fileToClean = srcFile;
             
             // Compile first
             ws.send(JSON.stringify({ type: "output", data: "Compiling...\r\n" }));
             const compile = spawn("g++", ["-O2", "-static", srcFile, "-o", outFile]);
             await new Promise((resolve) => compile.on("close", resolve));
             
             command = outFile;
             args = [];
             // we should clean outfile too later
          } else {
             ws.send(JSON.stringify({ type: "error", data: `Language ${language} interactive mode not fully supported yet.\r\n` }));
             ws.close();
             return;
          }

          currentProcess = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });

          currentProcess.stdout.on("data", (data: any) => {
            // Send stdout back to xterm
            ws.send(JSON.stringify({ type: "output", data: data.toString() }));
          });

          currentProcess.stderr.on("data", (data: any) => {
            ws.send(JSON.stringify({ type: "output", data: data.toString() }));
          });

          currentProcess.on("close", (code: number) => {
            ws.send(JSON.stringify({ type: "exit", code }));
            if (fileToClean) {
              try { unlinkSync(fileToClean); } catch (e) {}
            }
          });
          
          currentProcess.on("error", (err: any) => {
             ws.send(JSON.stringify({ type: "error", data: err.message }));
          });

        } else if (msg.type === "input" && currentProcess && currentProcess.stdin) {
          currentProcess.stdin.write(msg.data);
        }
      } catch (err) {
        console.error("WS msg error", err);
      }
    });

    ws.on('close', () => {
      if (currentProcess) {
        currentProcess.kill();
      }
      if (fileToClean) {
        try { unlinkSync(fileToClean); } catch (e) {}
      }
    });
  });

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '');
    if (pathname === '/api/execute-ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  return httpServer;
}
