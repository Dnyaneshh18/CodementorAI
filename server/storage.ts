import { type User, type InsertUser, type CodeSubmission, type InsertCodeSubmission, type UserProgress, type InsertUserProgress, type ExecutionHistory, type InsertExecutionHistory, type LearningAnalytics, type InsertLearningAnalytics, type Battle, type InsertBattle, type BattleParticipant, type InsertBattleParticipant, type BattleSubmission, type InsertBattleSubmission } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { DatabaseStorage } from "./pg-storage";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  createCodeSubmission(submission: InsertCodeSubmission): Promise<CodeSubmission>;
  getCodeSubmissionsByUser(userId: string): Promise<CodeSubmission[]>;
  getCodeSubmission(id: string): Promise<CodeSubmission | undefined>;
  
  getUserProgress(userId: string): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(userId: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined>;
  
  // Execution History methods
  createExecutionHistory(history: InsertExecutionHistory): Promise<ExecutionHistory>;
  getExecutionHistoryByUser(userId: string, limit?: number): Promise<ExecutionHistory[]>;
  getExecutionHistory(id: string): Promise<ExecutionHistory | undefined>;
  deleteExecutionHistory(id: string): Promise<boolean>;
  
  // Learning Analytics methods
  createLearningAnalytics(analytics: InsertLearningAnalytics): Promise<LearningAnalytics>;
  getLearningAnalyticsByUser(userId: string, days?: number): Promise<LearningAnalytics[]>;
  updateLearningAnalytics(userId: string, language: string, data: Partial<LearningAnalytics>): Promise<LearningAnalytics>;
  
  // Battle methods
  createBattle(battle: InsertBattle): Promise<Battle>;
  getBattle(id: string): Promise<Battle | undefined>;
  updateBattle(id: string, updates: Partial<Battle>): Promise<Battle | undefined>;
  getBattles(): Promise<Battle[]>;
  getUserBattles(userId: string): Promise<Battle[]>;
  createBattleParticipant(participant: InsertBattleParticipant): Promise<BattleParticipant>;
  getBattleParticipants(battleId: string): Promise<BattleParticipant[]>;
  createBattleSubmission(submission: InsertBattleSubmission): Promise<BattleSubmission>;
  getBattleSubmissions(battleId: string): Promise<BattleSubmission[]>;
  updateBattleSubmission(id: string, updates: Partial<BattleSubmission>): Promise<BattleSubmission | undefined>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private codeSubmissions: Map<string, CodeSubmission>;
  private userProgress: Map<string, UserProgress>;
  private executionHistory: Map<string, ExecutionHistory>;
  private learningAnalytics: Map<string, LearningAnalytics>;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.codeSubmissions = new Map();
    this.userProgress = new Map();
    this.executionHistory = new Map();
    this.learningAnalytics = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      level: 1,
      xp: 0,
      streak: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    
    // Create initial progress record
    await this.createUserProgress({
      userId: id,
      problemsSolved: 0,
      bugsFixed: 0,
      languagesUsed: {},
      achievements: [],
      lastActive: new Date()
    });
    
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createCodeSubmission(submission: InsertCodeSubmission): Promise<CodeSubmission> {
    const id = randomUUID();
    const codeSubmission: CodeSubmission = {
      ...submission,
      id,
      createdAt: new Date(),
      timeComplexity: submission.timeComplexity || null,
      spaceComplexity: submission.spaceComplexity || null,
      concepts: (submission.concepts as string[]) || [],
      aiSuggestions: submission.aiSuggestions || null,
      debuggingResults: submission.debuggingResults || null
    };
    this.codeSubmissions.set(id, codeSubmission);
    return codeSubmission;
  }

  async getCodeSubmissionsByUser(userId: string): Promise<CodeSubmission[]> {
    return Array.from(this.codeSubmissions.values()).filter(
      (submission) => submission.userId === userId,
    );
  }

  async getCodeSubmission(id: string): Promise<CodeSubmission | undefined> {
    return this.codeSubmissions.get(id);
  }

  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values()).find(
      (progress) => progress.userId === userId,
    );
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const id = randomUUID();
    const userProgress: UserProgress = {
      ...progress,
      id,
      problemsSolved: progress.problemsSolved || 0,
      bugsFixed: progress.bugsFixed || 0,
      languagesUsed: progress.languagesUsed || {},
      achievements: (progress.achievements as string[]) || [],
      totalExecutions: progress.totalExecutions || 0,
      successfulExecutions: progress.successfulExecutions || 0,
      averageExecutionTime: progress.averageExecutionTime || 0,
      favoriteLanguage: progress.favoriteLanguage || null,
      lastActive: progress.lastActive || new Date()
    };
    this.userProgress.set(id, userProgress);
    return userProgress;
  }

  async updateUserProgress(userId: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const progress = Array.from(this.userProgress.values()).find(
      (p) => p.userId === userId,
    );
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...updates };
    this.userProgress.set(progress.id, updatedProgress);
    return updatedProgress;
  }

  // Execution History methods
  async createExecutionHistory(history: InsertExecutionHistory): Promise<ExecutionHistory> {
    const id = randomUUID();
    const executionHistory: ExecutionHistory = {
      ...history,
      id,
      stdin: history.stdin || null,
      error: history.error || null,
      memoryUsage: history.memoryUsage || null,
      success: history.success ?? true,
      createdAt: new Date()
    };
    this.executionHistory.set(id, executionHistory);
    return executionHistory;
  }

  async getExecutionHistoryByUser(userId: string, limit: number = 50): Promise<ExecutionHistory[]> {
    return Array.from(this.executionHistory.values())
      .filter((history) => history.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getExecutionHistory(id: string): Promise<ExecutionHistory | undefined> {
    return this.executionHistory.get(id);
  }

  async deleteExecutionHistory(id: string): Promise<boolean> {
    return this.executionHistory.delete(id);
  }

  // Learning Analytics methods
  async createLearningAnalytics(analytics: InsertLearningAnalytics): Promise<LearningAnalytics> {
    const id = randomUUID();
    const learningAnalytics: LearningAnalytics = {
      ...analytics,
      id,
      executionsCount: analytics.executionsCount || 1,
      successRate: analytics.successRate || 0,
      averageTime: analytics.averageTime || 0,
      complexityScore: analytics.complexityScore || 0,
      conceptsLearned: (analytics.conceptsLearned as string[]) || [],
      date: (analytics as any).date || new Date()
    };
    this.learningAnalytics.set(id, learningAnalytics);
    return learningAnalytics;
  }

  async getLearningAnalyticsByUser(userId: string, days: number = 30): Promise<LearningAnalytics[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.learningAnalytics.values())
      .filter((analytics) => analytics.userId === userId && analytics.date >= cutoffDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async updateLearningAnalytics(userId: string, language: string, data: Partial<LearningAnalytics>): Promise<LearningAnalytics> {
    // Find existing analytics for today and language
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = Array.from(this.learningAnalytics.values()).find(
      (analytics) => 
        analytics.userId === userId && 
        analytics.language === language && 
        analytics.date.toDateString() === today.toDateString()
    );

    if (existing) {
      const updated = { ...existing, ...data };
      this.learningAnalytics.set(existing.id, updated);
      return updated;
    } else {
      // Create new analytics entry
      const newAnalytics: LearningAnalytics = {
        id: randomUUID(),
        userId,
        date: today,
        language,
        executionsCount: data.executionsCount || 1,
        successRate: data.successRate || 0,
        averageTime: data.averageTime || 0,
        complexityScore: data.complexityScore || 0,
        conceptsLearned: data.conceptsLearned || []
      };
      this.learningAnalytics.set(newAnalytics.id, newAnalytics);
      return newAnalytics;
    }
  }

  // Battle Methods (Memory implementation)
  async createBattle(battle: InsertBattle): Promise<Battle> {
    const id = randomUUID();
    const newBattle: Battle = {
      ...battle,
      id,
      durationMinutes: battle.durationMinutes ?? 30,
      teamSize: battle.teamSize ?? 1,
      startedAt: null,
      endedAt: null,
      status: "waiting",
      createdAt: new Date(),
      startingCode: (battle.startingCode as Record<string, string>) || null,
      optimalSolution: battle.optimalSolution || null
    };
    return newBattle;
  }

  async getBattle(id: string): Promise<Battle | undefined> {
    return undefined; // MemStorage is a fallback, we won't fully implement it for battles
  }

  async getUserBattles(userId: string): Promise<Battle[]> {
    return [];
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<Battle | undefined> {
    return undefined;
  }

  async getBattles(): Promise<Battle[]> {
    return [];
  }

  async createBattleParticipant(participant: InsertBattleParticipant): Promise<BattleParticipant> {
    return { ...participant, id: randomUUID(), joinedAt: new Date() };
  }

  async getBattleParticipants(battleId: string): Promise<BattleParticipant[]> {
    return [];
  }

  async createBattleSubmission(submission: InsertBattleSubmission): Promise<BattleSubmission> {
    return {
      ...submission,
      id: randomUUID(),
      isFinal: submission.isFinal ?? true,
      aiScore: submission.aiScore ?? null,
      aiFeedback: submission.aiFeedback ?? null,
      rank: submission.rank ?? null,
      submittedAt: new Date()
    };
  }

  async getBattleSubmissions(battleId: string): Promise<BattleSubmission[]> {
    return [];
  }

  async updateBattleSubmission(id: string, updates: Partial<BattleSubmission>): Promise<BattleSubmission | undefined> {
    return undefined;
  }
}

// Initialize PostgreSQL storage
let storage: IStorage;

// Initialize storage asynchronously
const initializeStorage = async (): Promise<IStorage> => {
  try {
    if (process.env.DATABASE_URL) {
      console.log("🔄 Initializing PostgreSQL connection...");
      storage = new DatabaseStorage();
      console.log("✅ PostgreSQL storage initialized successfully!");
      return storage;
    } else {
      throw new Error("DATABASE_URL is not set");
    }
  } catch (error) {
    console.warn("⚠️ PostgreSQL connection failed, falling back to memory storage:", error);
    storage = new MemStorage();
    return storage;
  }
};

// Export a promise that resolves to the initialized storage
export const storagePromise = initializeStorage();

// Export the storage instance (will be available after initialization)
export { storage };
