import React, { useState } from 'react';
import {
  Users,
  Trophy,
  Flame,
  MessageSquare,
  Heart,
  Plus,
  Share2,
  Tag,
  Target,
  Send,
  Sparkles,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { CommunityPost, FitnessGoal } from '../types';

interface CommunityForumProps {
  posts: CommunityPost[];
  goals: FitnessGoal[];
  onAddPost: (post: CommunityPost) => void;
  onLikePost: (postId: string) => void;
  onCheerPost: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onAddGoal: (goal: FitnessGoal) => void;
  onUpdateGoalProgress: (goalId: string, delta: number) => void;
}

export const CommunityForum: React.FC<CommunityForumProps> = ({
  posts,
  goals,
  onAddPost,
  onLikePost,
  onCheerPost,
  onAddComment,
  onAddGoal,
  onUpdateGoalProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'goals'>('feed');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // New post state
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<CommunityPost['category']>('achievement');
  const [newBadgeTitle, setNewBadgeTitle] = useState('');
  const [newMetricLabel, setNewMetricLabel] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [newTags, setNewTags] = useState('');

  // Comment input state per post
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // New goal state
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'strength' | 'cardio' | 'nutrition' | 'habit'>('strength');
  const [newGoalCurrent, setNewGoalCurrent] = useState(0);
  const [newGoalTarget, setNewGoalTarget] = useState(100);
  const [newGoalUnit, setNewGoalUnit] = useState('kg');
  const [newGoalDeadline, setNewGoalDeadline] = useState('In 4 weeks');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const tagsArray = newTags
      .split(/[\s,]+/)
      .map((t) => (t.startsWith('#') ? t : `#${t}`))
      .filter((t) => t.length > 1);

    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: 'Alex Mercer (You)',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      authorHandle: '@alex_m',
      timeAgo: 'Just now',
      category: newCategory,
      content: newContent.trim(),
      badgeTitle: newBadgeTitle.trim() || undefined,
      metricsHighlight:
        newMetricLabel.trim() && newMetricValue.trim()
          ? { label: newMetricLabel.trim(), value: newMetricValue.trim() }
          : undefined,
      tags: tagsArray.length > 0 ? tagsArray : ['#ApexPulse', '#FitnessJourney'],
      likes: 1,
      cheers: 1,
      userLiked: true,
      comments: [],
    };

    onAddPost(post);
    setShowCreateModal(false);
    setNewContent('');
    setNewBadgeTitle('');
    setNewMetricLabel('');
    setNewMetricValue('');
    setNewTags('');
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const goal: FitnessGoal = {
      id: `g-${Date.now()}`,
      title: newGoalTitle.trim(),
      category: newGoalCategory,
      currentValue: Number(newGoalCurrent) || 0,
      targetValue: Number(newGoalTarget) || 1,
      unit: newGoalUnit.trim(),
      deadline: newGoalDeadline.trim(),
    };

    onAddGoal(goal);
    setShowGoalModal(false);
    setNewGoalTitle('');
  };

  const handleSendComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    onAddComment(postId, text.trim());
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = posts.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

  return (
    <div className="space-y-6" id="community-forum-container">
      {/* Header & Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
              Apex Athlete Community Forum
            </h3>
            <p className="text-xs text-slate-500">
              Share PR breakthroughs, workout milestones, nutrition victories, and cheer on fellow athletes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-white text-slate-800 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Activity Feed
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'goals'
                  ? 'bg-white text-slate-800 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Fitness Goals ({goals.length})
            </button>
          </div>

          {activeTab === 'feed' ? (
            <button
              id="create-community-post-btn"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Share Achievement
            </button>
          ) : (
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Set New Goal
            </button>
          )}
        </div>
      </div>

      {activeTab === 'feed' ? (
        <>
          {/* Categories Pill Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Updates' },
              { id: 'achievement', label: '🏆 PR Achievements' },
              { id: 'workout', label: '⚡ Workouts & Runs' },
              { id: 'nutrition', label: '🥗 Nutrition & Meals' },
              { id: 'goal', label: '🎯 Goals & Milestones' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4"
              >
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">{post.authorName}</h4>
                        <span className="text-xs text-slate-400">{post.authorHandle}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{post.timeAgo}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      post.category === 'achievement'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : post.category === 'workout'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {post.category}
                  </span>
                </div>

                {/* Badge title if present */}
                {post.badgeTitle && (
                  <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                      <Trophy className="w-4 h-4 text-amber-600" />
                      {post.badgeTitle}
                    </div>
                    {post.metricsHighlight && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-amber-600 block">
                          {post.metricsHighlight.label}
                        </span>
                        <span className="text-xs font-black text-amber-950">
                          {post.metricsHighlight.value}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Post body */}
                <p className="text-xs text-slate-700 leading-relaxed">{post.content}</p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions: Likes, Cheers, Comments */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onLikePost(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        post.userLiked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.userLiked ? 'fill-rose-500' : ''}`} />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      onClick={() => onCheerPost(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        post.userCheered ? 'text-orange-600' : 'text-slate-500 hover:text-orange-600'
                      }`}
                    >
                      <Flame className={`w-4 h-4 ${post.userCheered ? 'fill-orange-500' : ''}`} />
                      <span>{post.cheers} Kudos</span>
                    </button>

                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments.length}</span>
                    </span>
                  </div>

                  <button className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>

                {/* Comments Thread */}
                {post.comments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 bg-[#F8FAFC] p-3 rounded-xl">
                    {post.comments.map((cm) => (
                      <div key={cm.id} className="flex items-start gap-2.5 text-xs">
                        <img
                          src={cm.authorAvatar}
                          alt={cm.authorName}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-slate-800 mr-1.5">{cm.authorName}</span>
                          <span className="text-slate-600">{cm.content}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{cm.timeAgo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendComment(post.id);
                    }}
                    placeholder="Cheer on this achievement or drop a tip..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    onClick={() => handleSendComment(post.id)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Goals & Milestones View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const progressPct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
              const isCompleted = progressPct >= 100;

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {goal.category}
                      </span>
                      <span className="text-xs text-slate-400">{goal.deadline}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-800 mt-2">{goal.title}</h4>

                    <div className="mt-4 flex items-baseline justify-between">
                      <span className="text-2xl font-bold font-sans text-slate-800">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                      <span className="text-xs font-bold text-slate-600">{progressPct}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Update progress</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateGoalProgress(goal.id, 1)}
                        className="px-2 py-1 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
                      >
                        +1 {goal.unit}
                      </button>
                      <button
                        onClick={() => onUpdateGoalProgress(goal.id, 5)}
                        className="px-2 py-1 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
                      >
                        +5 {goal.unit}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Community Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Share with Fitness Community</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Post Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="achievement">🏆 PR & Milestone Achievement</option>
                  <option value="workout">⚡ Workout Completion</option>
                  <option value="nutrition">🥗 Clean Meal Prep</option>
                  <option value="goal">🎯 Goal Progress</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Achievement Headline / Trophy Title
                </label>
                <input
                  type="text"
                  value={newBadgeTitle}
                  onChange={(e) => setNewBadgeTitle(e.target.value)}
                  placeholder="e.g. 🏆 New PR: 100kg Bench Press!"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Metric Label</label>
                  <input
                    type="text"
                    value={newMetricLabel}
                    onChange={(e) => setNewMetricLabel(e.target.value)}
                    placeholder="e.g. 1RM or Pace"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Metric Value</label>
                  <input
                    type="text"
                    value={newMetricValue}
                    onChange={(e) => setNewMetricValue(e.target.value)}
                    placeholder="e.g. 100 kg or 4:30/km"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Post Story</label>
                <textarea
                  rows={3}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share what worked, mindset cues, or advice for fellow athletes..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tags (space or comma separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="#PRBreakthrough #BenchPress #CleanEating"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Publish to Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Set Fitness Target</h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Barbell Deadlift 150 kg"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="habit">Habit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newGoalUnit}
                    onChange={(e) => setNewGoalUnit(e.target.value)}
                    placeholder="kg, km, reps, %"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current</label>
                  <input
                    type="number"
                    value={newGoalCurrent}
                    onChange={(e) => setNewGoalCurrent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target</label>
                  <input
                    type="number"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deadline / Target Date</label>
                <input
                  type="text"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  placeholder="e.g. End of Month, In 6 Weeks"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
