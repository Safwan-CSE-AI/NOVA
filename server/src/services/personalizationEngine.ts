import mongoose from 'mongoose';
import { IUser } from '../models/User.js';
import { Task, ITask } from '../models/Task.js';
import { Feedback, IFeedback } from '../models/Feedback.js';
import { LearnedPreference, ILearnedPreference } from '../models/LearnedPreference.js';
import { DailyPlan, IDailyPlan } from '../models/DailyPlan.js';
import { Interaction } from '../models/Interaction.js';

export interface AdaptationResult {
  adaptedTaskId?: string;
  before: {
    title: string;
    duration: number;
    difficulty: string;
    category?: string;
  };
  after: {
    title: string;
    duration: number;
    difficulty: string;
    category?: string;
  };
  reason: string;
  trigger: string;
  affectedTasksCount: number;
  newConfidence?: number;
}

export class PersonalizationEngine {
  /**
   * Process feedback from a completed task and adapt future tasks and learned preferences
   */
  static async processFeedback(
    user: IUser,
    task: ITask,
    feedback: IFeedback
  ): Promise<{
    adaptation: AdaptationResult | null;
    updatedPreferences: ILearnedPreference[];
    insight: string;
  }> {
    // 1. Record interaction
    await Interaction.create({
      user: user._id,
      type: 'feedback_submitted',
      metadata: {
        taskId: task._id,
        difficultyFeedback: feedback.difficultyFeedback,
        helpfulness: feedback.helpfulness,
        requestedChange: feedback.requestedChange,
        taskTitle: task.title,
      },
    });

    // 2. Update Learned Preferences based on feedback signals
    const updatedPreferences = await this.updatePreferencesFromFeedback(user, task, feedback);

    // 3. Find future pending tasks in active daily plan to adapt
    const activePlan: any = await DailyPlan.findOne({
      user: user._id,
      active: true,
    }).populate('tasks');

    let adaptationResult: AdaptationResult | null = null;
    let insight = '';

    if (activePlan && activePlan.tasks && activePlan.tasks.length > 0) {
      // Find the next pending task
      const pendingTasks = activePlan.tasks.filter(
        (t: any) => t.status === 'pending' && t._id.toString() !== task._id.toString()
      );

      if (pendingTasks.length > 0) {
        const nextTask = pendingTasks[0];
        const before = {
          title: nextTask.title,
          duration: nextTask.duration,
          difficulty: nextTask.difficulty,
          category: nextTask.category,
        };

        let newDuration = nextTask.duration;
        let newDifficulty = nextTask.difficulty;
        let newTitle = nextTask.title;
        let newDescription = nextTask.description;
        let adaptationReason = '';
        let whyPoints = [...nextTask.whyExplanation.points];

        if (feedback.difficultyFeedback === 'Too Difficult') {
          // Rule: Reduce difficulty, shorten next task, add guided practice
          newDifficulty = nextTask.difficulty === 'Hard' ? 'Medium' : 'Easy';
          newDuration = Math.max(15, Math.round(nextTask.duration * 0.75 / 5) * 5); // Reduce by ~25%
          newTitle = nextTask.title.includes('Guided:') ? nextTask.title : `Guided Practice: ${nextTask.title}`;
          newDescription = `[Adapted for scaffolding] We broke this down with step-by-step hints and guided templates. ${nextTask.description}`;
          adaptationReason = `Your previous task was too difficult, so I reduced the next task from ${before.duration} min to ${newDuration} min, lowered difficulty to ${newDifficulty}, and added guided scaffolding.`;
          whyPoints.unshift(`Adjusted down from ${before.difficulty} to ${newDifficulty} because previous task felt too difficult`);
          whyPoints.unshift(`Shortened to ${newDuration} min to prevent cognitive fatigue`);
          insight = `Adapted your workload: eased difficulty and shortened session to ensure steady progress without burnout.`;
        } else if (feedback.difficultyFeedback === 'Too Easy') {
          // Rule: Increase difficulty, provide challenge
          newDifficulty = nextTask.difficulty === 'Easy' ? 'Medium' : 'Hard';
          newTitle = nextTask.title.includes('Advanced:') ? nextTask.title : `Advanced Challenge: ${nextTask.title}`;
          newDescription = `[Upgraded Challenge] Includes edge cases, optimization criteria, and deeper implementation. ${nextTask.description}`;
          adaptationReason = `You marked the previous task as too easy! I increased the difficulty of the next task to ${newDifficulty} and added deeper optimization challenges.`;
          whyPoints.unshift(`Increased to ${newDifficulty} challenge because previous session was completed easily`);
          insight = `Leveling up! Increased task challenge to keep you engaged in the optimal flow state.`;
        } else {
          // Just Right
          insight = `Pacing is dialed in! The current ${nextTask.duration}-minute session aligns with your optimal rhythm.`;
        }

        // Apply requested change if specified
        if (feedback.requestedChange === 'Shorter' && newDuration > 15) {
          const prevDur = newDuration;
          newDuration = Math.max(15, newDuration - 10);
          adaptationReason += (adaptationReason ? ' Also ' : '') + `shortened duration from ${prevDur} to ${newDuration} min per your request.`;
        } else if (feedback.requestedChange === 'More examples') {
          newTitle = `${newTitle} (with Real-World Examples)`;
          newDescription += ' Includes 3 concrete real-world code walkthroughs.';
          adaptationReason += (adaptationReason ? ' ' : '') + `Added annotated code examples to match your practical preference.`;
          whyPoints.push('Enriched with real-world examples as requested');
        } else if (feedback.requestedChange === 'More explanation') {
          newDescription += ' Detailed architectural breakdown and mental model illustrations included.';
          adaptationReason += (adaptationReason ? ' ' : '') + `Added in-depth conceptual explanations.`;
          whyPoints.push('Expanded theoretical explanation based on your feedback');
        }

        // Apply modifications if changed
        if (
          newDuration !== before.duration ||
          newDifficulty !== before.difficulty ||
          newTitle !== before.title
        ) {
          nextTask.duration = newDuration;
          nextTask.difficulty = newDifficulty;
          nextTask.title = newTitle;
          nextTask.description = newDescription;
          nextTask.adaptationNotice = {
            wasAdapted: true,
            reason: adaptationReason,
            before,
          };
          nextTask.whyExplanation = {
            points: whyPoints.slice(0, 4),
            confidence: Math.min(95, nextTask.whyExplanation.confidence + 4),
            primaryFactor: `Calibrated to recent "${feedback.difficultyFeedback}" feedback`,
          };
          await nextTask.save();

          adaptationResult = {
            adaptedTaskId: nextTask._id.toString(),
            before,
            after: {
              title: newTitle,
              duration: newDuration,
              difficulty: newDifficulty,
              category: nextTask.category,
            },
            reason: adaptationReason,
            trigger: `Task "${task.title}" feedback: ${feedback.difficultyFeedback}`,
            affectedTasksCount: 1,
            newConfidence: nextTask.whyExplanation.confidence,
          };

          // Record in DailyPlan history
          activePlan.adaptationHistory.push({
            reason: adaptationReason,
            trigger: `Feedback on ${task.title}`,
            beforeSummary: `${before.duration} min | ${before.difficulty} | ${before.title}`,
            afterSummary: `${newDuration} min | ${newDifficulty} | ${newTitle}`,
            timestamp: new Date(),
          });
          await activePlan.save();
        }
      }
    }

    return {
      adaptation: adaptationResult,
      updatedPreferences,
      insight: insight || 'NOVA updated your learning model based on your feedback.',
    };
  }

  /**
   * Update Learned Preferences in MongoDB based on historical signals
   */
  static async updatePreferencesFromFeedback(
    user: IUser,
    task: ITask,
    feedback: IFeedback
  ): Promise<ILearnedPreference[]> {
    const updated: ILearnedPreference[] = [];

    // Signal 1: Session Length preference
    if (task.duration <= 25) {
      const pref = await this.upsertPreference(
        user._id,
        'session_length',
        'Session Duration',
        'Short focused sessions (20-25 min)',
        85,
        `Consistently completes short sessions with positive momentum (${task.title})`
      );
      updated.push(pref);
    }

    // Signal 2: Difficulty tolerance
    if (feedback.difficultyFeedback === 'Too Difficult') {
      const pref = await this.upsertPreference(
        user._id,
        'difficulty_tolerance',
        'Difficulty Tolerance',
        'Prefers progressive scaffolding before advanced topics',
        88,
        `Flagged "${task.title}" as too difficult; needs intermediate guided steps`
      );
      updated.push(pref);
    } else if (feedback.difficultyFeedback === 'Too Easy') {
      const pref = await this.upsertPreference(
        user._id,
        'difficulty_tolerance',
        'Difficulty Tolerance',
        'High appetite for rigorous challenges and edge cases',
        86,
        `Marked "${task.title}" as too easy; thrives on deeper complexity`
      );
      updated.push(pref);
    } else {
      const pref = await this.upsertPreference(
        user._id,
        'difficulty_tolerance',
        'Difficulty Tolerance',
        'Balanced medium pacing with steady progression',
        82,
        `Validated "${task.title}" difficulty as Just Right`
      );
      updated.push(pref);
    }

    // Signal 3: Learning Modality
    if (feedback.requestedChange === 'More examples' || user.preferredStyle === 'Practical') {
      const pref = await this.upsertPreference(
        user._id,
        'learning_modality',
        'Learning Modality',
        'Code-first practical examples over theoretical prose',
        91,
        `Requested more real-world examples and hands-on exercises`
      );
      updated.push(pref);
    }

    return updated;
  }

  /**
   * Upsert or adjust confidence for a learned preference
   */
  static async upsertPreference(
    userId: mongoose.Types.ObjectId,
    key: string,
    category: string,
    value: string,
    targetConfidence: number,
    evidenceNote: string
  ): Promise<ILearnedPreference> {
    const existing = await LearnedPreference.findOne({ user: userId, key });

    if (existing) {
      existing.evidenceCount += 1;
      // Adjust confidence gradually towards target
      existing.confidence = Math.min(98, Math.round(existing.confidence * 0.8 + targetConfidence * 0.2));
      existing.value = value;
      existing.source = evidenceNote;
      existing.lastUpdated = new Date();
      existing.history.push({
        date: new Date(),
        note: evidenceNote,
        deltaConfidence: existing.confidence - targetConfidence,
      });
      await existing.save();
      return existing;
    } else {
      const created = await LearnedPreference.create({
        user: userId,
        key,
        category,
        value,
        confidence: targetConfidence,
        evidenceCount: 1,
        source: evidenceNote,
        lastUpdated: new Date(),
        history: [{ date: new Date(), note: evidenceNote, deltaConfidence: 0 }],
      });
      return created;
    }
  }

  /**
   * Deterministic Plan Generator
   * Used when generating a plan locally or as a robust fallback if Gemini is offline
   */
  static generateDeterministicPlan(
    user: IUser,
    learnedPreferences: ILearnedPreference[] = []
  ): Array<{
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
  }> {
    const isLowEnergy = user.energyLevel === 'Low';
    const isHighEnergy = user.energyLevel === 'High';
    const isPractical = user.preferredStyle === 'Practical';
    const baseDuration = user.focusDuration || 25;

    // Check if user has learned preference for short sessions
    const shortSessionPref = learnedPreferences.find((p) => p.key === 'session_length');
    const effectiveDuration = shortSessionPref && isLowEnergy ? Math.min(baseDuration, 20) : baseDuration;

    // Goal contextualization
    const goalLower = (user.goal || 'programming exam').toLowerCase();

    if (goalLower.includes('exam') || goalLower.includes('program') || goalLower.includes('code') || goalLower.includes('developer')) {
      const tasks = [
        {
          title: isPractical
            ? 'Hands-on Array & Matrix Drills'
            : 'Core Data Structure Fundamentals',
          description: isPractical
            ? 'Interactive coding drills implementing array slicing, transformation, and 2-pointer patterns.'
            : 'Analytical breakdown of memory layout, contiguous allocations, and lookup complexities.',
          duration: effectiveDuration,
          difficulty: (isLowEnergy ? 'Easy' : 'Medium') as 'Easy' | 'Medium' | 'Hard',
          category: 'Data Structures',
          whyExplanation: {
            points: [
              `Calibrated to your preferred ${user.preferredStyle.toLowerCase()} learning style`,
              `Session length of ${effectiveDuration} min matches your optimal focus window`,
              isLowEnergy ? 'Downgraded cognitive intensity due to low energy status' : 'Aligned with active exam preparation goal',
            ],
            confidence: 88,
            primaryFactor: 'Matches focus duration & preferred style',
          },
        },
        {
          title: isLowEnergy
            ? 'Guided Recursion Patterns (Scaffolded)'
            : 'Recursion & Call Stack Problem Solving',
          description: isLowEnergy
            ? 'Step-by-step tracing of base cases with visual call stack templates to prevent confusion.'
            : 'Deconstruct divide-and-conquer recursion with depth analysis and memoization.',
          duration: isLowEnergy ? 20 : effectiveDuration,
          difficulty: (isLowEnergy ? 'Easy' : 'Medium') as 'Easy' | 'Medium' | 'Hard',
          category: 'Algorithms',
          whyExplanation: {
            points: [
              'Targeted practice on high-yield exam algorithms',
              isLowEnergy ? 'Kept under 20 minutes to maintain high retention while energy is low' : 'Built upon previous array fundamentals',
              'Supported by past feedback requesting structured examples',
            ],
            confidence: 84,
            primaryFactor: 'Targeted reinforcement based on previous feedback',
          },
        },
        {
          title: isHighEnergy
            ? 'Timed Exam Simulation & Edge Cases'
            : 'Practical Review & Synthesis Exercise',
          description: 'Apply learned patterns to 3 exam-style prompt challenges under realistic constraints.',
          duration: isLowEnergy ? 15 : effectiveDuration,
          difficulty: (isHighEnergy ? 'Hard' : isLowEnergy ? 'Easy' : 'Medium') as 'Easy' | 'Medium' | 'Hard',
          category: 'Review & Practice',
          whyExplanation: {
            points: [
              'Reinforces consolidation before moving to subsequent topics',
              `Difficulty tailored to ${user.preferredDifficulty} baseline`,
              'Short milestone format with high completion rate',
            ],
            confidence: 82,
            primaryFactor: 'Goal milestone verification',
          },
        },
      ];

      // If low energy, only return 2 tasks to avoid burnout
      return isLowEnergy ? tasks.slice(0, 2) : tasks;
    }

    // General Goal Fallback
    const genericTasks = [
      {
        title: `Foundations: Key Concepts in ${user.goal}`,
        description: `Deep-dive exploration structured around ${user.preferredStyle.toLowerCase()} exercises to establish strong baseline knowledge.`,
        duration: effectiveDuration,
        difficulty: (isLowEnergy ? 'Easy' : 'Medium') as 'Easy' | 'Medium' | 'Hard',
        category: 'Foundations',
        whyExplanation: {
          points: [
            `Tailored for your goal: "${user.goal}"`,
            `Paced for your ${effectiveDuration}-minute focus block`,
            `Style: ${user.preferredStyle}`,
          ],
          confidence: 85,
          primaryFactor: 'Goal foundation alignment',
        },
      },
      {
        title: `Applied Workshop: Active Building Session`,
        description: 'Hands-on practice applying today’s foundational concepts into a tangible project snippet.',
        duration: effectiveDuration,
        difficulty: (isLowEnergy ? 'Easy' : 'Medium') as 'Easy' | 'Medium' | 'Hard',
        category: 'Application',
        whyExplanation: {
          points: [
            'Applies knowledge immediately to maximize retention',
            `Matches ${user.energyLevel} energy envelope`,
            'High-signal feedback opportunity for NOVA learning engine',
          ],
          confidence: 83,
          primaryFactor: 'Immediate active recall',
        },
      },
      {
        title: `Reflection & Knowledge Synthesis`,
        description: 'Self-audit checklist and quick review to solidify key mental models and log progress.',
        duration: 15,
        difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
        category: 'Synthesis',
        whyExplanation: {
          points: [
            'Short 15-minute cool-down session',
            'Solidifies learned patterns before daily plan concludes',
            'Generates learning signals for tomorrow’s adaptation',
          ],
          confidence: 89,
          primaryFactor: 'Consolidation & signal gathering',
        },
      },
    ];

    return isLowEnergy ? genericTasks.slice(0, 2) : genericTasks;
  }
}
