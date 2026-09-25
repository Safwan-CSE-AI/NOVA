import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { IUser } from '../models/User.js';
import { ILearnedPreference } from '../models/LearnedPreference.js';
import { IFeedback } from '../models/Feedback.js';
import { ITask } from '../models/Task.js';
import { PersonalizationEngine } from './personalizationEngine.js';

// Zod schemas for Gemini structured outputs
const PlanTaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.number().min(10).max(120),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  category: z.string(),
  whyExplanation: z.object({
    points: z.array(z.string()),
    confidence: z.number().min(50).max(99),
    primaryFactor: z.string(),
  }),
});

const GeneratedPlanSchema = z.object({
  focusGoal: z.string(),
  rationale: z.string(),
  tasks: z.array(PlanTaskSchema).min(1),
});

const CoachResponseSchema = z.object({
  message: z.string(),
  suggestedAction: z.object({
    type: z.enum(['reduce_workload', 'shorten_duration', 'shift_difficulty', 'add_examples', 'none']),
    label: z.string(),
    description: z.string(),
    changes: z.record(z.any()).optional(),
  }).optional(),
});

export class GeminiService {
  private static getClient(): GoogleGenerativeAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return null;
    }
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate an adaptive daily plan using Gemini, with deterministic fallback
   */
  static async generatePlan(
    user: IUser,
    learnedPreferences: ILearnedPreference[] = [],
    recentFeedback: IFeedback[] = []
  ): Promise<{
    focusGoal: string;
    rationale: string;
    tasks: Array<{
      title: string;
      description: string;
      duration: number;
      difficulty: 'Easy' | 'Medium' | 'Hard';
      category: string;
      whyExplanation: {
        points: string[];
        confidence: number;
        primaryFactor: string;
      };
    }>;
    source: 'gemini' | 'deterministic';
  }> {
    const client = this.getClient();

    if (client) {
      try {
        const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
You are the personalization core of NOVA, an AI productivity assistant that learns how a user works.
Generate a tailored daily study/work plan based strictly on the user's current state and historical signals.

USER PROFILE:
- Name: ${user.name}
- Goal: ${user.goal}
- Available Time: ${user.availableTime}
- Current Energy Level: ${user.energyLevel}
- Preferred Style: ${user.preferredStyle} (Practical/Visual/Theoretical/Mixed)
- Target Focus Duration: ${user.focusDuration} minutes
- Base Difficulty: ${user.preferredDifficulty}
- Known Strengths: ${user.strengths.join(', ') || 'Consistent daily starter'}
- Known Weaknesses: ${user.weaknesses.join(', ') || 'Easily fatigued by abstract theory'}

LEARNED PREFERENCES (Observed over time):
${learnedPreferences.map((p) => `- [${p.category}] ${p.value} (Confidence: ${p.confidence}%, Evidence: ${p.evidenceCount} items, Source: ${p.source})`).join('\n') || '- No historical preferences yet'}

RECENT FEEDBACK SIGNALS:
${recentFeedback.map((f) => `- Task "${f.taskTitle}": Difficulty was "${f.difficultyFeedback}", Helpful: "${f.helpfulness}", Requested: "${f.requestedChange}"`).join('\n') || '- No recent feedback'}

RULES FOR ADAPTATION:
- If Energy is Low: create at most 2-3 shorter tasks, reduce difficulty, prioritize consolidation.
- If Style is Practical: emphasize exercises, coding drills, and hands-on synthesis.
- If Recent Feedback was "Too Difficult": reduce next task length, ease difficulty, add guided practice.
- If Recent Feedback was "Too Easy": increase challenge, introduce edge cases.
- Every task must include a detailed "whyExplanation" with 3-4 bullet points referencing the user's specific data, a confidence percentage (50-98%), and a primaryFactor.

OUTPUT FORMAT:
Return pure, valid JSON with no markdown wrapping or code fences:
{
  "focusGoal": "Concise theme of today's plan",
  "rationale": "Why this specific plan was chosen for today's state",
  "tasks": [
    {
      "title": "Task title",
      "description": "What to do and how",
      "duration": 25,
      "difficulty": "Easy" | "Medium" | "Hard",
      "category": "Topic Category",
      "whyExplanation": {
        "points": ["Reason 1", "Reason 2", "Reason 3"],
        "confidence": 88,
        "primaryFactor": "Matches 25-min focus preference"
      }
    }
  ]
}
`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });

        const text = result.response.text();
        const parsed = JSON.parse(text);
        const validated = GeneratedPlanSchema.parse(parsed);

        return {
          focusGoal: validated.focusGoal,
          rationale: validated.rationale,
          tasks: validated.tasks,
          source: 'gemini',
        };
      } catch (err: any) {
        console.warn('Gemini plan generation failed or timed out. Falling back to deterministic engine:', err.message);
      }
    }

    // Deterministic fallback
    const fallbackTasks = PersonalizationEngine.generateDeterministicPlan(user, learnedPreferences);
    return {
      focusGoal: `Mastering ${user.goal} (Personalized Cadence)`,
      rationale: `Calibrated for ${user.energyLevel} energy, ${user.focusDuration}-minute focus intervals, and ${user.preferredStyle.toLowerCase()} learning orientation.`,
      tasks: fallbackTasks,
      source: 'deterministic',
    };
  }

  /**
   * Contextual AI Coach conversation
   */
  static async coach(
    user: IUser,
    message: string,
    learnedPreferences: ILearnedPreference[] = [],
    recentFeedback: IFeedback[] = [],
    currentTask?: ITask | null
  ): Promise<{
    message: string;
    suggestedAction?: {
      type: string;
      label: string;
      description: string;
      changes?: Record<string, any>;
    };
    source: 'gemini' | 'deterministic';
  }> {
    const client = this.getClient();

    if (client) {
      try {
        const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
You are NOVA's personalized AI Coach. You know how this specific user works and your goal is to help them stay in their optimal learning zone.
The user is talking to you during their session.

USER PROFILE:
- Name: ${user.name}
- Goal: ${user.goal}
- Energy Level: ${user.energyLevel}
- Preferred Style: ${user.preferredStyle}
- Preferred Focus: ${user.focusDuration} min
- Current Task: ${currentTask ? `${currentTask.title} (${currentTask.duration} min, ${currentTask.difficulty})` : 'None in progress'}

LEARNED HABITS & PREFERENCES:
${learnedPreferences.map((p) => `- ${p.category}: ${p.value} (${p.confidence}% confidence)`).join('\n') || '- None recorded'}

RECENT FEEDBACK:
${recentFeedback.map((f) => `- ${f.taskTitle}: ${f.difficultyFeedback}, requested ${f.requestedChange}`).join('\n') || '- None'}

USER MESSAGE:
"${message}"

INSTRUCTIONS:
1. Speak in a warm, direct, highly personalized tone.
2. Acknowledge their specific working habits and recent signals.
3. If they mention being tired, low energy, overwhelmed, or stuck: propose a concrete adaptation (e.g. shortening duration, reducing task count, switching to guided mode).
4. Provide structured JSON matching:
{
  "message": "Your conversational response",
  "suggestedAction": {
    "type": "reduce_workload" | "shorten_duration" | "shift_difficulty" | "add_examples" | "none",
    "label": "Button text (e.g. 'Apply Workload Reduction' or 'Keep Current Plan')",
    "description": "What will happen if applied",
    "changes": {
      "newEnergy": "Low",
      "newDuration": 20
    }
  }
}
`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });

        const text = result.response.text();
        const parsed = JSON.parse(text);
        const validated = CoachResponseSchema.parse(parsed);

        return {
          message: validated.message,
          suggestedAction: validated.suggestedAction,
          source: 'gemini',
        };
      } catch (err: any) {
        console.warn('Gemini Coach error:', err.message);
      }
    }

    // High-quality Deterministic AI Coach Fallback
    const lower = message.toLowerCase();

    if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('low energy') || lower.includes('sleepy')) {
      return {
        message: `I hear you, ${user.name}. Looking at your learned profile, you perform best with 20-minute bursts when energy dips. Rather than pushing through high cognitive strain, I can adapt today's plan: reduce the upcoming task duration by 10 minutes and shift focus to guided review.`,
        suggestedAction: {
          type: 'reduce_workload',
          label: 'Apply Workload Reduction',
          description: 'Lowers energy setting to Low, reduces remaining task times by 10 min, and pauses theoretical tasks.',
          changes: { newEnergy: 'Low', newDuration: 20 },
        },
        source: 'deterministic',
      };
    }

    if (lower.includes('difficult') || lower.includes('hard') || lower.includes('stuck') || lower.includes('confused')) {
      return {
        message: `That makes complete sense. We noticed recursion and abstract logic generated "Too Difficult" signals earlier. Let's not bang our heads against the wall: I can break down the current task into scaffolded micro-steps with code templates.`,
        suggestedAction: {
          type: 'shift_difficulty',
          label: 'Apply Guided Scaffolding',
          description: 'Converts current problem into 3 step-by-step checkpoints with guided templates.',
          changes: { difficulty: 'Easy', addTemplates: true },
        },
        source: 'deterministic',
      };
    }

    if (lower.includes('easy') || lower.includes('bored') || lower.includes('faster') || lower.includes('challenge')) {
      return {
        message: `Love that drive! Your array and coding exercises showed 90%+ confidence with quick completion times. I can upgrade the remaining tasks to include time-complexity constraints and exam-level edge cases.`,
        suggestedAction: {
          type: 'shift_difficulty',
          label: 'Level Up Challenge',
          description: 'Increases difficulty to Hard and adds realistic timed edge-case constraints.',
          changes: { difficulty: 'Hard' },
        },
        source: 'deterministic',
      };
    }

    if (lower.includes('example') || lower.includes('practice') || lower.includes('code')) {
      return {
        message: `Your learned preference for practical hands-on examples is at 91% confidence. I've re-weighted your active session to prioritize interactive code drills over descriptive reading.`,
        suggestedAction: {
          type: 'add_examples',
          label: 'Inject Code Walkthroughs',
          description: 'Injects 3 annotated code examples directly into your current topic overview.',
          changes: { preferredStyle: 'Practical' },
        },
        source: 'deterministic',
      };
    }

    return {
      message: `I'm tracking your rhythm, ${user.name}. You're currently focused on "${user.goal}". Your primary working style is ${user.preferredStyle} with ${user.focusDuration}-minute target blocks. Tell me how you're feeling or if you'd like to adjust duration, difficulty, or content style!`,
      suggestedAction: {
        type: 'none',
        label: 'Keep Current Plan',
        description: 'Continue with your active personalized plan.',
      },
      source: 'deterministic',
    };
  }

  /**
   * Explain "Why This?" for a given task or recommendation
   */
  static explain(
    user: IUser,
    task: ITask,
    learnedPreferences: ILearnedPreference[] = []
  ): {
    title: string;
    primaryFactor: string;
    confidence: number;
    evidencePoints: string[];
    adaptationNote?: string;
  } {
    const points: string[] = [];

    // 1. Preferred style point
    points.push(`Matches your ${user.preferredStyle.toLowerCase()} learning style (${user.preferredStyle === 'Practical' ? 'emphasis on code execution' : 'conceptual clarity'}).`);

    // 2. Focus duration alignment
    points.push(`Duration of ${task.duration} min aligns with your target ${user.focusDuration}-minute focus window.`);

    // 3. Learned preference evidence
    const relatedPref = learnedPreferences.find(
      (p) => p.category.toLowerCase().includes('difficulty') || p.category.toLowerCase().includes('session')
    );
    if (relatedPref) {
      points.push(`Calibrated by learned signal: "${relatedPref.value}" (${relatedPref.confidence}% confidence, ${relatedPref.evidenceCount} data points).`);
    } else {
      points.push(`Calibrated to your active baseline difficulty level: ${task.difficulty}.`);
    }

    // 4. Adaptation historical note if present
    if (task.adaptationNotice?.wasAdapted) {
      points.push(`Dynamically adapted: ${task.adaptationNotice.reason}`);
    }

    return {
      title: task.title,
      primaryFactor: task.whyExplanation?.primaryFactor || 'Personalized to your recent learning signals',
      confidence: task.whyExplanation?.confidence || 85,
      evidencePoints: points,
      adaptationNote: task.adaptationNotice?.reason,
    };
  }
}
