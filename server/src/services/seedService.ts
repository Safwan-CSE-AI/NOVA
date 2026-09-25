import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Task, ITask } from '../models/Task.js';
import { Feedback } from '../models/Feedback.js';
import { LearnedPreference } from '../models/LearnedPreference.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { Interaction } from '../models/Interaction.js';

export const DEMO_USER_EMAIL = 'alex@demo.nova.ai';
export const DEMO_USER_PASSWORD = 'demopassword123';

export class SeedService {
  /**
   * Initializes or resets the demo account for Alex
   */
  static async seedDemoAccount(): Promise<{ user: IUser; token: string }> {
    // Clean up existing demo data if any
    const existingUser = await User.findOne({ email: DEMO_USER_EMAIL });
    if (existingUser) {
      await this.cleanupUser(existingUser._id);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, salt);

    // 1. Create User
    const user = await User.create({
      name: 'Alex',
      email: DEMO_USER_EMAIL,
      passwordHash,
      goal: 'Prepare for programming exam',
      availableTime: '3 hours',
      energyLevel: 'Medium',
      preferredStyle: 'Practical',
      focusDuration: 25,
      preferredDifficulty: 'Medium',
      preferences: ['Code exercises', 'Visual stack diagrams', 'Short sessions'],
      strengths: ['Array manipulation', 'Iterative logic', 'Clean variable naming'],
      weaknesses: ['Deep recursion trees', 'Dynamic programming memoization'],
      isOnboarded: true,
      isDemoUser: true,
    });

    // 2. Create Profile
    await Profile.create({
      user: user._id,
      learningBio: 'CS major studying for algorithms and data structures exam. Prefers hands-on exercises and 25-minute Pomodoro bursts.',
      preferredWorkHours: 'Morning / Afternoon',
      cognitivePacing: 'Active bursts with quick validation',
      adaptabilityScore: 92,
      totalTasksCompleted: 3,
      totalMinutesLearned: 65,
      streakDays: 4,
    });

    // 3. Create Seeded Feedback and Completed Tasks
    const completedTask1 = await Task.create({
      user: user._id,
      title: 'Recursive Tree Traversal & Call Stack Tracing',
      description: 'Analyze tree recursion and trace multi-branch call stack depth with return value propagation.',
      duration: 30,
      difficulty: 'Hard',
      category: 'Algorithms',
      status: 'completed',
      completedAt: new Date(Date.now() - 3600000 * 5),
      whyExplanation: {
        points: ['Core exam syllabus topic', 'Tests call stack mental models', 'High exam point weight'],
        confidence: 78,
        primaryFactor: 'Exam priority',
      },
      order: 1,
    });

    await Feedback.create({
      user: user._id,
      task: completedTask1._id,
      taskTitle: completedTask1.title,
      difficultyFeedback: 'Too Difficult',
      helpfulness: 'Somewhat',
      requestedChange: 'Easier',
      comment: 'Got overwhelmed tracing 3-level branching without visual step-by-step scaffolds.',
      timestamp: new Date(Date.now() - 3600000 * 5),
    });

    const completedTask2 = await Task.create({
      user: user._id,
      title: 'Array Slicing & Two-Pointer Implementation',
      description: 'Implement fast in-place two-pointer technique to solve subarray sum and window expansion.',
      duration: 25,
      difficulty: 'Medium',
      category: 'Data Structures',
      status: 'completed',
      completedAt: new Date(Date.now() - 3600000 * 3),
      whyExplanation: {
        points: ['Matches 25-min focus preference', 'Practical code drill', 'Reinforces array strengths'],
        confidence: 89,
        primaryFactor: 'Matches practical learning style',
      },
      order: 2,
    });

    await Feedback.create({
      user: user._id,
      task: completedTask2._id,
      taskTitle: completedTask2.title,
      difficultyFeedback: 'Just Right',
      helpfulness: 'Yes',
      requestedChange: 'More examples',
      comment: 'Pacing was great. The 25-minute window felt very natural and engaging.',
      timestamp: new Date(Date.now() - 3600000 * 3),
    });

    const completedTask3 = await Task.create({
      user: user._id,
      title: 'Practical Array Filtering & Sorting Exercise',
      description: 'Write custom comparator lambdas and filter predicates for exam questions.',
      duration: 20,
      difficulty: 'Easy',
      category: 'Data Structures',
      status: 'completed',
      completedAt: new Date(Date.now() - 3600000 * 1),
      whyExplanation: {
        points: ['Quick consolidation', 'High completion rate history', 'Targeted syntax mastery'],
        confidence: 93,
        primaryFactor: 'Reinforcement drill',
      },
      order: 3,
    });

    await Feedback.create({
      user: user._id,
      task: completedTask3._id,
      taskTitle: completedTask3.title,
      difficultyFeedback: 'Too Easy',
      helpfulness: 'Yes',
      requestedChange: 'Harder',
      comment: 'Finished quickly in 12 minutes! Ready for harder algorithmic problems next time.',
      timestamp: new Date(Date.now() - 3600000 * 1),
    });

    // 4. Create Learned Preferences from actual signals
    await LearnedPreference.create([
      {
        user: user._id,
        key: 'session_length',
        category: 'Session Duration',
        value: 'Short sessions (20-25 min)',
        confidence: 85,
        evidenceCount: 3,
        source: 'Consistently completes 20-25m tasks with 95% finish rate; flagged 30m+ sessions as fatiguing.',
        history: [
          { date: new Date(Date.now() - 3600000 * 5), note: '30m session marked Too Difficult', deltaConfidence: -2 },
          { date: new Date(Date.now() - 3600000 * 3), note: '25m session marked Just Right', deltaConfidence: 4 },
          { date: new Date(Date.now() - 3600000 * 1), note: '20m session marked Too Easy', deltaConfidence: 3 },
        ],
      },
      {
        user: user._id,
        key: 'learning_modality',
        category: 'Working Style',
        value: 'Practical code-first drills with examples',
        confidence: 90,
        evidenceCount: 4,
        source: 'Consistently selects hands-on coding exercises over descriptive theory text.',
        history: [
          { date: new Date(Date.now() - 3600000 * 4), note: 'Requested "More examples" in feedback', deltaConfidence: 5 },
          { date: new Date(Date.now() - 3600000 * 2), note: 'Preferred coding practice over reading', deltaConfidence: 5 },
        ],
      },
      {
        user: user._id,
        key: 'difficulty_tolerance',
        category: 'Preferred Difficulty',
        value: 'Medium (with guided scaffolding for recursion)',
        confidence: 84,
        evidenceCount: 3,
        source: 'Recursion flagged as Too Difficult; arrays marked Just Right / Too Easy.',
        history: [
          { date: new Date(Date.now() - 3600000 * 5), note: 'Lowered difficulty baseline after recursion feedback', deltaConfidence: 4 },
        ],
      },
      {
        user: user._id,
        key: 'pacing_preference',
        category: 'Cognitive Load',
        value: 'Step-by-step progressive difficulty',
        confidence: 88,
        evidenceCount: 3,
        source: 'High retention when tasks are scaffolded from simple to challenging.',
        history: [
          { date: new Date(Date.now() - 3600000 * 3), note: 'Succeeded on step-by-step array problem', deltaConfidence: 3 },
        ],
      },
    ]);

    // 5. Create Active Daily Plan with Upcoming Adapted Tasks
    const upcomingTask1 = await Task.create({
      user: user._id,
      title: 'Guided Practice: Recursion Base-Cases & Scaffolding',
      description: 'Step-by-step guided breakdown of recursive termination conditions with visual call stack templates.',
      duration: 20,
      difficulty: 'Medium',
      category: 'Algorithms',
      status: 'pending',
      order: 1,
      whyExplanation: {
        points: [
          'Adapted down from 30 min Hard to 20 min Medium with guided scaffolding',
          'Directly addresses past "Too Difficult" feedback on recursion',
          'Includes step-by-step call stack templates per your practical preference',
        ],
        confidence: 88,
        primaryFactor: 'Calibrated to recent "Too Difficult" feedback',
      },
      adaptationNotice: {
        wasAdapted: true,
        reason: 'Your previous task was too difficult, so I reduced the next task from 30 minutes to 20 minutes, lowered difficulty from Hard to Medium, and added guided practice.',
        before: {
          duration: 30,
          difficulty: 'Hard',
          category: 'Algorithms',
        },
      },
    });

    const upcomingTask2 = await Task.create({
      user: user._id,
      title: 'Hands-on Matrix Traversal & Dynamic Programming',
      description: 'Implement 2D grid memoization with annotated test cases and visual state tables.',
      duration: 25,
      difficulty: 'Medium',
      category: 'Dynamic Programming',
      status: 'pending',
      order: 2,
      whyExplanation: {
        points: [
          'Matches your preferred 25-minute focus window',
          'Practical interactive coding exercises',
          'Connects array strengths with DP foundations',
        ],
        confidence: 86,
        primaryFactor: 'Matches 25-minute focus & practical style',
      },
      adaptationNotice: {
        wasAdapted: false,
      },
    });

    const upcomingTask3 = await Task.create({
      user: user._id,
      title: 'Exam Simulation: Timed Problem Solving & Edge Cases',
      description: 'Solve 2 exam-style algorithmic problems within 25 minutes with edge-case validation.',
      duration: 25,
      difficulty: 'Hard',
      category: 'Exam Simulation',
      status: 'pending',
      order: 3,
      whyExplanation: {
        points: [
          'Simulation calibrated to your exam goal',
          'Builds stamina following successful short drills',
          'Incorporates harder edge cases per previous array feedback',
        ],
        confidence: 82,
        primaryFactor: 'Goal milestone verification',
      },
      adaptationNotice: {
        wasAdapted: false,
      },
    });

    const todayDate = new Date().toISOString().split('T')[0];

    const dailyPlan = await DailyPlan.create({
      user: user._id,
      date: todayDate,
      focusGoal: 'Programming Exam: Recursion & Dynamic Programming Mastery',
      totalDuration: 70,
      energyLevel: 'Medium',
      preferredStyle: 'Practical',
      tasks: [upcomingTask1._id, upcomingTask2._id, upcomingTask3._id],
      adaptationHistory: [
        {
          reason: 'Your previous task was too difficult, so I reduced the next task from 30 minutes to 20 minutes and added guided practice.',
          trigger: 'Feedback on Recursive Tree Traversal (Too Difficult)',
          beforeSummary: '30 min | Hard | Recursive Tree Traversal',
          afterSummary: '20 min | Medium | Guided Practice: Recursion Base-Cases',
          timestamp: new Date(Date.now() - 3600000 * 4),
        },
      ],
      active: true,
    });

    upcomingTask1.planId = dailyPlan._id;
    await upcomingTask1.save();
    upcomingTask2.planId = dailyPlan._id;
    await upcomingTask2.save();
    upcomingTask3.planId = dailyPlan._id;
    await upcomingTask3.save();

    // 6. Record Interactions
    await Interaction.create([
      {
        user: user._id,
        type: 'onboarding_completed',
        metadata: { goal: user.goal, style: user.preferredStyle, focus: user.focusDuration },
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        user: user._id,
        type: 'task_completed',
        metadata: { taskId: completedTask1._id, title: completedTask1.title },
        timestamp: new Date(Date.now() - 3600000 * 5),
      },
      {
        user: user._id,
        type: 'feedback_submitted',
        metadata: { difficulty: 'Too Difficult', taskId: completedTask1._id },
        timestamp: new Date(Date.now() - 3600000 * 5),
      },
      {
        user: user._id,
        type: 'plan_adapted',
        metadata: { reason: 'Previous task was too difficult; reduced next task to 20m and added guided practice' },
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
    ]);

    // Return user with signed JWT
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'nova_default_jwt_secret_personalization';
    const token = jwt.default.sign({ userId: user._id.toString() }, secret, { expiresIn: '7d' });

    return { user, token };
  }

  /**
   * Cleans up all data for a specific user ID
   */
  static async cleanupUser(userId: mongoose.Types.ObjectId): Promise<void> {
    await Task.deleteMany({ user: userId });
    await Feedback.deleteMany({ user: userId });
    await LearnedPreference.deleteMany({ user: userId });
    await DailyPlan.deleteMany({ user: userId });
    await Profile.deleteMany({ user: userId });
    await Interaction.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);
  }
}
