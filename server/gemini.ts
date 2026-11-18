import "dotenv/config";
import Groq from "groq-sdk";

function getGroqClient(): { client: Groq; model: string } {
  const apiKey = process.env.GROQ_API_KEY || "";
  const model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

  if (!apiKey) {
    throw new Error("Groq API key is not configured. Set GROQ_API_KEY in your environment for AI features.");
  }

  return { client: new Groq({ apiKey }), model };
}

export type DebugResponse = {
  correctedCode: string;
  explanation: string;
  suggestions: string[];
};

export type ComplexityResponse = {
  timeComplexity: string;
  spaceComplexity: string;
  analysis: string;
};

export type ConceptResponse = {
  concepts: string[];
  recommendations: string[];
};

export type ComprehensiveAnalysisResponse = {
  debug: DebugResponse;
  complexity: ComplexityResponse;
  concepts: ConceptResponse;
};

function parseJsonPayload<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch {
        // Fall through
      }
    }
    throw new Error(`Model responded with non-JSON payload: ${cleaned.substring(0, 120)}...`);
  }
}

async function callGroqWithRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes("Rate limit");
      if (isRateLimit && attempt < maxRetries) {
        const match = error?.message?.match(/try again in ([0-9.]+)s/i);
        const waitSec = match ? Math.min(Math.ceil(parseFloat(match[1])), 5) : 3;
        console.warn(`[Groq] Rate limit hit. Waiting ${waitSec}s before retrying (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Groq API request failed.");
}

async function generateJsonResponse<T>(
  prompt: string,
  systemPrompt = "You are an expert programming mentor. You always respond with perfectly formatted JSON.",
  maxTokens = 1500,
  temperature = 0.2
): Promise<T> {
  const { client, model } = getGroqClient();

  return await callGroqWithRetry(async () => {
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    return parseJsonPayload<T>(text);
  });
}

export async function debugCode(
  code: string,
  language: string,
  error?: string,
): Promise<DebugResponse> {
  const prompt = `Analyze the following ${language} code and provide debugging assistance. ${
    error ? `The error message is: ${error}` : "Look for potential bugs, errors, or improvements."
  }

Code:
\`\`\`${language}
${code}
\`\`\`

Respond strictly with JSON using this exact shape:
{
  "correctedCode": "the fixed version of the code",
  "explanation": "detailed explanation of what was wrong and how it was fixed",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

  const response = await generateJsonResponse<DebugResponse>(prompt, undefined, 1200);

  return {
    correctedCode: response.correctedCode || code,
    explanation: response.explanation || "No issues found.",
    suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
  };
}

export async function analyzeComplexity(
  code: string,
  language: string,
): Promise<ComplexityResponse> {
  const prompt = `Analyze the time and space complexity of the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Respond strictly with JSON using this exact shape:
{
  "timeComplexity": "Big-O notation for time complexity",
  "spaceComplexity": "Big-O notation for space complexity",
  "analysis": "detailed explanation of the complexity analysis"
}`;

  const response = await generateJsonResponse<ComplexityResponse>(prompt, undefined, 1000);

  return {
    timeComplexity: response.timeComplexity || "O(1)",
    spaceComplexity: response.spaceComplexity || "O(1)",
    analysis: response.analysis || "Analysis not available.",
  };
}

export async function detectConcepts(
  code: string,
  language: string,
): Promise<ConceptResponse> {
  const prompt = `Analyze the following ${language} code and identify the programming concepts, algorithms, and data structures being used:

\`\`\`${language}
${code}
\`\`\`

Respond strictly with JSON using this exact shape:
{
  "concepts": ["concept1", "concept2", "concept3"],
  "recommendations": ["practice problem 1", "practice problem 2", "practice problem 3"]
}`;

  const response = await generateJsonResponse<ConceptResponse>(prompt, undefined, 1000);

  return {
    concepts: Array.isArray(response.concepts) ? response.concepts : [],
    recommendations: Array.isArray(response.recommendations)
      ? response.recommendations
      : [],
  };
}

/**
 * Combined single-request analysis to avoid burning rate limits
 * with 3 separate calls.
 */
export async function analyzeAll(
  code: string,
  language: string,
): Promise<ComprehensiveAnalysisResponse> {
  const prompt = `Analyze the following ${language} code thoroughly.
Code:
\`\`\`${language}
${code}
\`\`\`

Respond strictly with JSON using this exact shape:
{
  "debug": {
    "correctedCode": "fixed version of the code, or original if already correct",
    "explanation": "concise explanation of bugs or improvements",
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  "complexity": {
    "timeComplexity": "Big-O notation for time complexity (e.g. O(n))",
    "spaceComplexity": "Big-O notation for space complexity (e.g. O(1))",
    "analysis": "concise explanation of time and space complexity"
  },
  "concepts": {
    "concepts": ["concept1", "concept2"],
    "recommendations": ["practice problem 1", "practice problem 2"]
  }
}`;

  const response = await generateJsonResponse<ComprehensiveAnalysisResponse>(
    prompt,
    "You are an expert programming mentor. You always respond with perfectly formatted JSON.",
    1500,
    0.2
  );

  return {
    debug: {
      correctedCode: response.debug?.correctedCode || code,
      explanation: response.debug?.explanation || "No issues found.",
      suggestions: Array.isArray(response.debug?.suggestions) ? response.debug.suggestions : [],
    },
    complexity: {
      timeComplexity: response.complexity?.timeComplexity || "O(1)",
      spaceComplexity: response.complexity?.spaceComplexity || "O(1)",
      analysis: response.complexity?.analysis || "Analysis not available.",
    },
    concepts: {
      concepts: Array.isArray(response.concepts?.concepts) ? response.concepts.concepts : [],
      recommendations: Array.isArray(response.concepts?.recommendations) ? response.concepts.recommendations : [],
    },
  };
}

const FALLBACK_BATTLE_PROBLEMS = [
  {
    problem: `### Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Example 1:**
**Input:** nums = [2,7,11,15], target = 9
**Output:** [0,1]
**Explanation:** Because nums[0] + nums[1] == 9, we return [0, 1].

**Example 2:**
**Input:** nums = [3,2,4], target = 6
**Output:** [1,2]

**Constraints:**
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\``,
    functionName: "twoSum",
    params: ["nums", "target"]
  },
  {
    problem: `### Valid Parentheses

Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example 1:**
**Input:** s = "()"
**Output:** true

**Example 2:**
**Input:** s = "()[]{}"
**Output:** true

**Example 3:**
**Input:** s = "(]"
**Output:** false

**Constraints:**
- \`1 <= s.length <= 10^4\`
- \`s\` consists of parentheses only \`'()[]{}'\`.`,
    functionName: "isValid",
    params: ["s"]
  },
  {
    problem: `### Longest Substring Without Repeating Characters

Given a string \`s\`, find the length of the longest substring without repeating characters.

**Example 1:**
**Input:** s = "abcabcbb"
**Output:** 3
**Explanation:** The answer is "abc", with the length of 3.

**Example 2:**
**Input:** s = "bbbbb"
**Output:** 1
**Explanation:** The answer is "b", with the length of 1.

**Constraints:**
- \`0 <= s.length <= 5 * 10^4\`
- \`s\` consists of English letters, digits, symbols and spaces.`,
    functionName: "lengthOfLongestSubstring",
    params: ["s"]
  }
];

function buildStarterCode(
  functionName = "solve",
  params: string[] = [],
  customTemplates: Record<string, string> = {}
): Record<string, string> {
  const fn = functionName.trim() || "solve";
  const paramList = params.length > 0 ? params.join(", ") : "";

  return {
    javascript: customTemplates.javascript || `class Solution {\n    ${fn}(${paramList}) {\n        // Write your code here\n    }\n}`,
    typescript: customTemplates.typescript || `class Solution {\n    ${fn}(${paramList}): any {\n        // Write your code here\n    }\n}`,
    python: customTemplates.python || `class Solution:\n    def ${fn}(self${paramList ? ", " + paramList : ""}):\n        # Write your code here\n        pass`,
    java: customTemplates.java || `class Solution {\n    public Object ${fn}(${params.map(p => `Object ${p}`).join(", ")}) {\n        // Write your code here\n        return null;\n    }\n}`,
    cpp: customTemplates.cpp || `class Solution {\npublic:\n    void ${fn}(${paramList}) {\n        // Write your code here\n    }\n};`,
    c: customTemplates.c || `void ${fn}(${paramList}) {\n    // Write your code here\n}`,
  };
}

export async function generateBattleProblem(prompt: string): Promise<{ problem: string; startingCode: Record<string, string> }> {
  const { client, model } = getGroqClient();

  const systemPrompt = `You are an expert algorithm problem creator.
The user will provide a problem idea (e.g. "${prompt}").
Create a concise, direct LeetCode-style problem description.
DO NOT add fictional stories or flavor text.
Include:
- Direct objective
- Input constraints
- 2 concise Example cases (Input, Output, Explanation)

Respond STRICTLY with JSON in this format:
{
  "problem": "markdown string of the problem description",
  "functionName": "methodNameInCamelCase",
  "params": ["param1", "param2"]
}`;

  try {
    const response = await callGroqWithRetry(async () => {
      const chatCompletion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        model,
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      const text = chatCompletion.choices[0]?.message?.content || "{}";
      return parseJsonPayload<{
        problem?: string;
        functionName?: string;
        params?: string[];
        startingCode?: Record<string, string>;
      }>(text);
    }, 1);

    const fnName = response.functionName || "solve";
    const params = Array.isArray(response.params) ? response.params : [];
    const startingCode = buildStarterCode(fnName, params, response.startingCode || {});

    return {
      problem: response.problem || "Could not generate problem.",
      startingCode,
    };
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.message?.includes("Rate limit");
    console.warn(`[BattleProblem] Groq generation failed (rate limit: ${isRateLimit}):`, error.message);

    // Fall back to a verified algorithm challenge so the battle session does not break
    const fallback = FALLBACK_BATTLE_PROBLEMS[Math.floor(Math.random() * FALLBACK_BATTLE_PROBLEMS.length)];
    return {
      problem: fallback.problem,
      startingCode: buildStarterCode(fallback.functionName, fallback.params),
    };
  }
}

export type BattleEvaluation = {
  optimalSolution: string;
  rankings: {
    userId: string;
    rank: number;
    score: number;
    feedback: string;
  }[];
};

export async function evaluateBattleSubmissions(
  problem: string,
  submissions: { userId: string; code: string; language: string }[]
): Promise<BattleEvaluation> {
  const prompt = `You are an expert programming contest judge.
Here is the problem:
---
${problem}
---
Submissions:
${submissions.map(s => `User ${s.userId} (${s.language}):\n\`\`\`${s.language}\n${s.code}\n\`\`\``).join('\n')}

Evaluate each submission based on correctness, time/space complexity, and code quality.
Rank them from 1 to N. Score 0-100. Provide concise feedback for each.
Provide an optimal solution in Python or C++.
Respond strictly with JSON:
{
  "optimalSolution": "complete clean code",
  "rankings": [
    {
      "userId": "exact user id",
      "rank": 1,
      "score": 95,
      "feedback": "short feedback"
    }
  ]
}`;

  return await generateJsonResponse<BattleEvaluation>(
    prompt,
    "You are an expert programming judge. Always respond with valid JSON.",
    1500,
    0.2
  );
}
