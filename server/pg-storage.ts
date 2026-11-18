import { IStorage } from "./storage";
import { User, InsertUser, CodeSubmission, InsertCodeSubmission, UserProgress, InsertUserProgress, ExecutionHistory, InsertExecutionHistory, LearningAnalytics, InsertLearningAnalytics, Battle, InsertBattle, BattleParticipant, InsertBattleParticipant, BattleSubmission, InsertBattleSubmission } from "@shared/schema";
import { db } from "./db";
import { users, codeSubmissions, executionHistory, userProgress, learningAnalytics, battles, battleParticipants, battleSubmissions } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import pg from "pg";

const PostgresqlStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    this.sessionStore = new PostgresqlStore({
      pool,
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 24, // 24 hours
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({ ...insertUser }).returning();
    
    await this.createUserProgress({
      userId: user.id,
      problemsSolved: 0,
      bugsFixed: 0,
      languagesUsed: {},
      achievements: [],
      lastActive: new Date()
    });
    
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async createCodeSubmission(submission: InsertCodeSubmission): Promise<CodeSubmission> {
    const [result] = await db.insert(codeSubmissions).values(submission as any).returning();
    return result;
  }

  async getCodeSubmissionsByUser(userId: string): Promise<CodeSubmission[]> {
    return await db.select().from(codeSubmissions).where(eq(codeSubmissions.userId, userId));
  }

  async getCodeSubmission(id: string): Promise<CodeSubmission | undefined> {
    const [submission] = await db.select().from(codeSubmissions).where(eq(codeSubmissions.id, id));
    return submission;
  }

  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    return progress;
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [result] = await db.insert(userProgress).values(progress as any).returning();
    return result;
  }

  async updateUserProgress(userId: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const [progress] = await db.update(userProgress).set(updates).where(eq(userProgress.userId, userId)).returning();
    return progress;
  }

  async createExecutionHistory(history: InsertExecutionHistory): Promise<ExecutionHistory> {
    const [result] = await db.insert(executionHistory).values(history).returning();
    return result;
  }

  async getExecutionHistoryByUser(userId: string, limit: number = 50): Promise<ExecutionHistory[]> {
    return await db.select().from(executionHistory)
      .where(eq(executionHistory.userId, userId))
      .orderBy(desc(executionHistory.createdAt))
      .limit(limit);
  }

  async getExecutionHistory(id: string): Promise<ExecutionHistory | undefined> {
    const [history] = await db.select().from(executionHistory).where(eq(executionHistory.id, id));
    return history;
  }

  async deleteExecutionHistory(id: string): Promise<boolean> {
    const [deleted] = await db.delete(executionHistory).where(eq(executionHistory.id, id)).returning();
    return !!deleted;
  }

  async createLearningAnalytics(analytics: InsertLearningAnalytics): Promise<LearningAnalytics> {
    const [result] = await db.insert(learningAnalytics).values(analytics as any).returning();
    return result;
  }

  async getLearningAnalyticsByUser(userId: string, days: number = 30): Promise<LearningAnalytics[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db.select().from(learningAnalytics)
      .where(
        and(
          eq(learningAnalytics.userId, userId),
          gte(learningAnalytics.date, cutoffDate)
        )
      )
      .orderBy(desc(learningAnalytics.date));
  }

  async updateLearningAnalytics(userId: string, language: string, data: Partial<LearningAnalytics>): Promise<LearningAnalytics> {
    // For simplicity, we create a new one instead of trying to find the one for "today"
    // (since in Drizzle finding by date string is tricky without raw sql).
    // The previous mongodb code did find/update for "today".
    
    const [result] = await db.insert(learningAnalytics).values({
      userId,
      language,
      executionsCount: data.executionsCount || 1,
      successRate: data.successRate || 0,
      averageTime: data.averageTime || 0,
      complexityScore: data.complexityScore || 0,
      conceptsLearned: (data.conceptsLearned || []) as any
    }).returning();
    
    return result;
  }

  // Battle Methods
  async createBattle(battle: InsertBattle): Promise<Battle> {
    const [result] = await db.insert(battles).values(battle).returning();
    return result;
  }

  async getBattle(id: string): Promise<Battle | undefined> {
    const [result] = await db.select().from(battles).where(eq(battles.id, id));
    return result;
  }

  async updateBattle(id: string, updates: Partial<Battle>): Promise<Battle | undefined> {
    const [result] = await db.update(battles).set(updates).where(eq(battles.id, id)).returning();
    return result;
  }

  async getBattles(): Promise<Battle[]> {
    return await db.select().from(battles).orderBy(desc(battles.createdAt));
  }

  async getUserBattles(userId: string): Promise<Battle[]> {
    const userBattles = await db.select({
      battle: battles
    })
    .from(battles)
    .innerJoin(battleParticipants, eq(battles.id, battleParticipants.battleId))
    .where(eq(battleParticipants.userId, userId))
    .orderBy(desc(battles.createdAt));
    
    return userBattles.map(row => row.battle);
  }

  async createBattleParticipant(participant: InsertBattleParticipant): Promise<BattleParticipant> {
    const [result] = await db.insert(battleParticipants).values(participant).returning();
    return result;
  }

  async getBattleParticipants(battleId: string): Promise<BattleParticipant[]> {
    return await db.select().from(battleParticipants).where(eq(battleParticipants.battleId, battleId));
  }

  async createBattleSubmission(submission: InsertBattleSubmission): Promise<BattleSubmission> {
    const [result] = await db.insert(battleSubmissions).values(submission).returning();
    return result;
  }

  async getBattleSubmissions(battleId: string): Promise<BattleSubmission[]> {
    return await db.select().from(battleSubmissions).where(eq(battleSubmissions.battleId, battleId));
  }

  async updateBattleSubmission(id: string, updates: Partial<BattleSubmission>): Promise<BattleSubmission | undefined> {
    const [result] = await db.update(battleSubmissions).set(updates).where(eq(battleSubmissions.id, id)).returning();
    return result;
  }
}
