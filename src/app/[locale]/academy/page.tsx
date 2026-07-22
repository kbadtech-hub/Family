'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import FeatureGate from '@/components/dashboard/FeatureGate';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import { 
  GraduationCap, BookOpen, Play, CheckCircle2, Award, 
  MessageSquare, FileText, Download, Sparkles, ChevronRight, 
  Clock, Lock, Check, RefreshCw, Star, Filter, Send, X, ShieldCheck
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string | null;
  modules?: Module[];
  exams?: Exam[];
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  sequence_order: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  content_text: string | null;
  duration: number;
  pdf_url: string | null;
}

interface Exam {
  id: string;
  course_id: string;
  title: string;
  passing_score: number;
  questions?: Question[];
}

interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  options: string[];
  correct_option: number;
}

interface StudentProgress {
  lesson_id?: string;
  is_completed: boolean;
  exam_score?: number;
}

interface Discussion {
  id: string;
  lesson_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string };
}

// Fallback initial course data if DB is empty
const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Pre-Marital Foundation & Ethiopian Family Pillars',
    description: 'A comprehensive pre-marriage course covering relationship values, communication skills, cultural expectations, and conflict resolution.',
    category: 'Pre-Marriage',
    thumbnail_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600',
    modules: [
      {
        id: 'mod-1',
        course_id: 'course-1',
        title: 'Module 1: Pillars of a Lasting Marriage',
        sequence_order: 1,
        lessons: [
          {
            id: 'les-1',
            module_id: 'mod-1',
            title: 'Lesson 1.1: Core Values & Emotional Readiness',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            content_text: 'Understanding emotional maturity and core spiritual/cultural alignment before marriage in Ethiopian households.',
            duration: 15,
            pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          },
          {
            id: 'les-2',
            module_id: 'mod-1',
            title: 'Lesson 1.2: Effective Communication & Active Listening',
            video_url: '',
            content_text: 'Learn methods to express feelings without escalation and practice active empathetic listening.',
            duration: 20,
            pdf_url: null
          }
        ]
      },
      {
        id: 'mod-2',
        course_id: 'course-1',
        title: 'Module 2: Family Financial Planning & Conflict Resolution',
        sequence_order: 2,
        lessons: [
          {
            id: 'les-3',
            module_id: 'mod-2',
            title: 'Lesson 2.1: Managing Household Finances & Budgeting',
            video_url: '',
            content_text: 'Strategies for managing joint savings, family expenses, and long-term financial stability.',
            duration: 25,
            pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          }
        ]
      }
    ],
    exams: [
      {
        id: 'exam-1',
        course_id: 'course-1',
        title: 'Final Pre-Marital Readiness Exam',
        passing_score: 70,
        questions: [
          {
            id: 'q-1',
            exam_id: 'exam-1',
            question_text: 'What is the primary key to resolving marital conflict effectively?',
            options: ['Active empathetic listening', 'Ignoring the issue', 'Blaming partner', 'Involving neighbors immediately'],
            correct_option: 0
          },
          {
            id: 'q-2',
            exam_id: 'exam-1',
            question_text: 'Which strategy supports financial harmony in a new household?',
            options: ['Keeping all income hidden', 'Joint budgeting and transparent goals', 'Impulse spending', 'Relying solely on loans'],
            correct_option: 1
          }
        ]
      }
    ]
  },
  {
    id: 'course-2',
    title: 'Parenting & Child Development in Modern Society',
    description: 'Essential guidance for raising resilient, respectful, and well-balanced children within Ethiopian family dynamics.',
    category: 'Parenting',
    thumbnail_url: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&q=80&w=600',
    modules: [],
    exams: []
  }
];

export default function AcademyPage() {
  const t = useTranslations('Classes');
  const locale = useLocale();
  const am = locale === 'am';

  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  // Student Progress
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [examScores, setExamScores] = useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Discussions
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Exam Active Answers State
  const [userExamAnswers, setUserExamAnswers] = useState<Record<number, number>>({});
  const [examSubmittedResult, setExamSubmittedResult] = useState<{ score: number; passed: boolean } | null>(null);

  // Certificate Modal State
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Fetch Courses & User Progress from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch Courses with nested modules, lessons, exams, questions
      const { data: coursesData } = await supabase
        .from('academy_courses')
        .select(`
          *,
          modules:academy_modules(
            *,
            lessons:academy_lessons(*)
          ),
          exams:academy_exams(
            *,
            questions:academy_questions(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (coursesData && coursesData.length > 0) {
        setCourses(coursesData);
      }

      // Fetch User Progress
      if (user) {
        const { data: progressData } = await supabase
          .from('academy_student_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressData) {
          const completedSet = new Set<string>();
          const scoresMap: Record<string, number> = {};

          progressData.forEach((row: any) => {
            if (row.lesson_id && row.is_completed) completedSet.add(row.lesson_id);
            if (row.course_id && row.exam_score !== null) scoresMap[row.course_id] = row.exam_score;
          });

          setCompletedLessonIds(completedSet);
          setExamScores(scoresMap);
        }
      }
    };

    fetchData();
  }, []);

  // Fetch Discussion Comments when Active Lesson Changes
  useEffect(() => {
    if (!activeLesson) return;

    const fetchDiscussions = async () => {
      const { data } = await supabase
        .from('academy_lesson_discussions')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('lesson_id', activeLesson.id)
        .order('created_at', { ascending: true });

      if (data) setDiscussions(data);
    };

    fetchDiscussions();
  }, [activeLesson]);

  // Toggle Lesson Completion
  const handleToggleLessonComplete = async (lessonId: string) => {
    const newCompleted = new Set(completedLessonIds);
    const isDone = !completedLessonIds.has(lessonId);

    if (isDone) completedSetAdd(lessonId, newCompleted);
    else completedSetDelete(lessonId, newCompleted);

    setCompletedLessonIds(newCompleted);

    if (currentUser) {
      await supabase.from('academy_student_progress').upsert({
        user_id: currentUser.id,
        lesson_id: lessonId,
        is_completed: isDone
      });
    }
  };

  const completedSetAdd = (id: string, set: Set<string>) => set.add(id);
  const completedSetDelete = (id: string, set: Set<string>) => set.delete(id);

  // Submit Discussion Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeLesson || !currentUser) return;

    setIsSubmittingComment(true);

    const { data, error } = await supabase
      .from('academy_lesson_discussions')
      .insert({
        lesson_id: activeLesson.id,
        user_id: currentUser.id,
        comment_text: newComment
      })
      .select('*, profiles:user_id(full_name, avatar_url)')
      .single();

    if (!error && data) {
      setDiscussions(prev => [...prev, data]);
      setNewComment('');
    }
    setIsSubmittingComment(false);
  };

  // Submit Exam
  const handleExamSubmit = async () => {
    if (!activeExam || !activeExam.questions || activeExam.questions.length === 0) return;

    let correctCount = 0;
    activeExam.questions.forEach((q, idx) => {
      if (userExamAnswers[idx] === q.correct_option) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / activeExam.questions.length) * 100);
    const passed = scorePercentage >= activeExam.passing_score;

    setExamSubmittedResult({ score: scorePercentage, passed });
    setExamScores(prev => ({ ...prev, [activeExam.course_id]: scorePercentage }));

    if (currentUser) {
      await supabase.from('academy_student_progress').upsert({
        user_id: currentUser.id,
        course_id: activeExam.course_id,
        is_completed: passed,
        exam_score: scorePercentage
      });
    }
  };

  // Calculate course completion progress percentage
  const getCourseProgress = (course: Course) => {
    const allLessons: Lesson[] = [];
    course.modules?.forEach(m => m.lessons?.forEach(l => allLessons.push(l)));
    if (allLessons.length === 0) return 0;

    const completed = allLessons.filter(l => completedLessonIds.has(l.id)).length;
    return Math.round((completed / allLessons.length) * 100);
  };

  const categories = ['All', 'Pre-Marriage', 'Communication', 'Culture', 'Parenting', 'Conflict Resolution', 'Finance', 'Wellbeing', 'Spirituality'];
  const filteredCourses = selectedCategory === 'All' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

  return (
    <FeatureGate featureKey="academy" featureTitle="Beteseb Academy (ቤተሰብ አካዳሚ)" locale={locale}>
      <div className="min-h-screen bg-[#FDFBF9] text-accent p-4 md:p-10" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Header Banner */}
          <header className="bg-gradient-to-r from-accent to-[#1E293B] text-white rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-black uppercase tracking-widest">
                <GraduationCap size={16} /> Beteseb Academy LMS
              </div>
              <h1 className="text-3xl md:text-5xl font-black italic tracking-tight uppercase">
                {am ? 'ቤተሰብ አካዳሚ — የቤተሰብ እና የጋብቻ ትምህርቶች' : 'Beteseb Academy — Family & Marriage Education'}
              </h1>
              <p className="text-gray-300 text-sm font-medium leading-relaxed italic">
                {am 
                  ? 'የተሟላ የጋብቻ፣ የልጅ አስተዳደግ እና የቤተሰብ መሪነት ትምህርቶች። በምስክር ወረቀት የታገዘ የትምህርት ጉዞ።'
                  : 'Enterprise LMS for pre-marital preparation, marriage enrichment, and family management.'}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="relative z-10 flex gap-4 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 shrink-0">
              <div className="text-center px-3">
                <p className="text-2xl font-black text-primary">{courses.length}</p>
                <p className="text-[10px] uppercase font-bold text-white/70">{am ? 'ኮርሶች' : 'Courses'}</p>
              </div>
              <div className="w-[1px] bg-white/20" />
              <div className="text-center px-3">
                <p className="text-2xl font-black text-emerald-400">{completedLessonIds.size}</p>
                <p className="text-[10px] uppercase font-bold text-white/70">{am ? 'የተጠናቀቁ' : 'Completed'}</p>
              </div>
            </div>
          </header>

          {/* Active Course Learning View */}
          {activeCourse ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              <button 
                onClick={() => { setActiveCourse(null); setActiveLesson(null); setActiveExam(null); }}
                className="inline-flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:underline"
              >
                ← {am ? 'ወደ ኮርሶች ዝርዝር ተመለስ' : 'Back to All Courses'}
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Course Sidebar & Modules List */}
                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
                  <div>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-wider">
                      {activeCourse.category}
                    </span>
                    <h2 className="text-2xl font-black text-accent italic mt-2">{activeCourse.title}</h2>
                    <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{activeCourse.description}</p>
                  </div>

                  {/* Overall Progress */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase">
                      <span>{am ? 'የኮርሱ ሂደት' : 'Course Progress'}</span>
                      <span className="text-primary">{getCourseProgress(activeCourse)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${getCourseProgress(activeCourse)}%` }} />
                    </div>
                    {getCourseProgress(activeCourse) === 100 && (
                      <button
                        onClick={() => setShowCertificateModal(true)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all mt-2"
                      >
                        <Award size={16} /> {am ? 'የምስክር ወረቀት ይመልከቱ' : 'View Certificate'}
                      </button>
                    )}
                  </div>

                  {/* Modules Accordion */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{am ? 'ሞጁሎች እና ትምህርቶች' : 'Modules & Lessons'}</h3>
                    {activeCourse.modules?.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">{am ? 'ምንም ሞጁሎች አልተጨመሩም።' : 'No modules published yet.'}</p>
                    ) : (
                      activeCourse.modules?.map((mod, idx) => (
                        <div key={mod.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                          <div className="p-4 bg-gray-100/70 font-black text-xs uppercase tracking-wider text-accent border-b border-gray-200">
                            {mod.title}
                          </div>
                          <div className="divide-y divide-gray-100">
                            {mod.lessons?.map(les => {
                              const isDone = completedLessonIds.has(les.id);
                              const isSelected = activeLesson?.id === les.id;
                              return (
                                <button
                                  key={les.id}
                                  onClick={() => { setActiveLesson(les); setActiveExam(null); }}
                                  className={`w-full p-4 text-left flex items-center justify-between hover:bg-primary/5 transition-all ${isSelected ? 'bg-primary/10 border-l-4 border-primary' : ''}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                      {isDone ? <Check size={14} /> : <Play size={10} />}
                                    </div>
                                    <span className="text-xs font-bold text-accent">{les.title}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-bold">{les.duration}m</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}

                    {/* Course Exam Button */}
                    {activeCourse.exams && activeCourse.exams.length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        {activeCourse.exams.map(exam => {
                          const score = examScores[activeCourse.id];
                          const passed = score !== undefined && score >= exam.passing_score;
                          return (
                            <button
                              key={exam.id}
                              onClick={() => { setActiveExam(exam); setActiveLesson(null); setExamSubmittedResult(null); setUserExamAnswers({}); }}
                              className={`w-full p-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-between border-2 transition-all ${passed ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-primary/10 border-primary/30 text-primary'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Award size={18} />
                                <span>{exam.title}</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border font-bold">
                                {score !== undefined ? `${score}% (${passed ? 'PASSED' : 'FAILED'})` : 'TAKE EXAM'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Content Area (Lesson Player or Exam View) */}
                <div className="lg:col-span-2 space-y-8">
                  {activeLesson ? (
                    <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Lesson</span>
                          <h2 className="text-2xl font-black text-accent italic">{activeLesson.title}</h2>
                        </div>
                        <button
                          onClick={() => handleToggleLessonComplete(activeLesson.id)}
                          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${completedLessonIds.has(activeLesson.id) ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary border border-primary/20'}`}
                        >
                          <CheckCircle2 size={16} />
                          {completedLessonIds.has(activeLesson.id) ? (am ? 'ተጠናቋል' : 'Completed') : (am ? 'እንደተጠናቀቀ ምልክት ያድርጉ' : 'Mark as Complete')}
                        </button>
                      </div>

                      {/* Video Player */}
                      {activeLesson.video_url ? (
                        <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-200">
                          <YouTubeEmbed url={activeLesson.video_url} title={activeLesson.title} />
                        </div>
                      ) : (
                        <div className="p-8 bg-gray-100 rounded-3xl text-center text-gray-500 italic text-sm font-medium">
                          🎥 {am ? 'ለዚህ ትምህርት የቪዲዮ ሊንክ አልተያያዘም።' : 'No video player linked for this text lesson.'}
                        </div>
                      )}

                      {/* Lesson Text Content */}
                      {activeLesson.content_text && (
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200 space-y-3">
                          <h3 className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-2">
                            <BookOpen size={16} className="text-primary" /> {am ? 'የትምህርቱ ማጠቃለያ' : 'Lesson Content & Notes'}
                          </h3>
                          <p className="text-sm font-medium text-gray-700 leading-relaxed italic">
                            {activeLesson.content_text}
                          </p>
                        </div>
                      )}

                      {/* Attached Study Guide PDF */}
                      {activeLesson.pdf_url && (
                        <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-3xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500 text-white rounded-2xl">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-accent uppercase">{am ? 'የትምህርቱ ማጥኛ PDF ሰነድ' : 'Attached Study Guide PDF'}</p>
                              <p className="text-[10px] text-gray-500 font-bold">{am ? 'ለተጨማሪ ንባብ የሚሆን ማጣቀሻ' : 'Download supplementary study notes'}</p>
                            </div>
                          </div>
                          <a
                            href={activeLesson.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <Download size={14} /> {am ? 'አውርድ (PDF)' : 'Download PDF'}
                          </a>
                        </div>
                      )}

                      {/* Discussion Forum Q&A Section */}
                      <div className="pt-8 border-t border-gray-200 space-y-6">
                        <h3 className="text-lg font-black text-accent flex items-center gap-2 italic">
                          <MessageSquare size={20} className="text-primary" />
                          {am ? 'የትምህርቱ ውይይት እና ጥያቄዎች (Q&A Forum)' : 'Lesson Discussion & Q&A Forum'}
                        </h3>

                        {/* Comment Input */}
                        <form onSubmit={handleAddComment} className="flex gap-3">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={am ? 'ጥያቄ ወይም አስተያየትዎን እዚህ ይጻፉ...' : 'Write your comment or question...'}
                            className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary text-accent"
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingComment || !newComment.trim()}
                            className="px-6 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                          >
                            <Send size={14} /> {am ? 'ላክ' : 'Post'}
                          </button>
                        </form>

                        {/* Comments List */}
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                          {discussions.length === 0 ? (
                            <p className="text-xs text-gray-400 italic text-center py-4">{am ? 'እስካሁን ምንም አስተያየት አልተሰጠም። የመጀመሪያው ይሁኑ!' : 'No discussion comments yet. Be the first to comment!'}</p>
                          ) : (
                            discussions.map(disc => (
                              <div key={disc.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-black text-accent">{disc.profiles?.full_name || 'Beteseb Student'}</span>
                                  <span className="text-[10px] text-gray-400 font-bold">{new Date(disc.created_at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-xs font-medium text-gray-600">{disc.comment_text}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : activeExam ? (
                    /* Exam Quiz View */
                    <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center border-b pb-6">
                        <div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">End of Course Assessment</span>
                          <h2 className="text-2xl font-black text-accent italic">{activeExam.title}</h2>
                          <p className="text-xs text-gray-500 font-bold mt-1">Passing Threshold: {activeExam.passing_score}%</p>
                        </div>
                      </div>

                      {examSubmittedResult ? (
                        /* Exam Results Card */
                        <div className={`p-8 rounded-3xl border-2 text-center space-y-4 ${examSubmittedResult.passed ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white shadow-xl ${examSubmittedResult.passed ? 'bg-emerald-500' : 'bg-red-500'}`}>
                            {examSubmittedResult.passed ? <Award size={40} /> : <X size={40} />}
                          </div>
                          <h3 className="text-3xl font-black uppercase italic text-accent">
                            {examSubmittedResult.passed ? (am ? 'እንኳን ደስ አለዎት! ፈተናውን አልፈዋል!' : 'Congratulations! You Passed!') : (am ? 'አልተሳካም። እባክዎ እንደገና ይሞክሩ።' : 'Exam Not Passed')}
                          </h3>
                          <p className="text-xl font-bold">
                            {am ? 'ያገኙት ውጤት' : 'Your Score'}: <span className="font-black underline">{examSubmittedResult.score}%</span>
                          </p>

                          {examSubmittedResult.passed && (
                            <button
                              onClick={() => setShowCertificateModal(true)}
                              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl inline-flex items-center gap-2"
                            >
                              <Award size={18} /> {am ? 'የኮርስ ማጠናቀቂያ ምስክር ወረቀት አውርድ' : 'Download Course Certificate'}
                            </button>
                          )}

                          {!examSubmittedResult.passed && (
                            <button
                              onClick={() => { setExamSubmittedResult(null); setUserExamAnswers({}); }}
                              className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl inline-flex items-center gap-2"
                            >
                              <RefreshCw size={18} /> {am ? 'ፈተናውን እንደገና ይውሰዱ' : 'Retake Exam'}
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Questions List */
                        <div className="space-y-6">
                          {activeExam.questions?.map((q, qIdx) => (
                            <div key={q.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-200 space-y-4">
                              <h4 className="font-black text-sm text-accent">
                                {qIdx + 1}. {q.question_text}
                              </h4>
                              <div className="space-y-2">
                                {q.options.map((opt, optIdx) => (
                                  <label
                                    key={optIdx}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${userExamAnswers[qIdx] === optIdx ? 'bg-primary/10 border-primary font-black text-primary' : 'bg-white border-gray-200 hover:border-primary/50'}`}
                                  >
                                    <input
                                      type="radio"
                                      name={`q-${qIdx}`}
                                      checked={userExamAnswers[qIdx] === optIdx}
                                      onChange={() => setUserExamAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                                      className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${userExamAnswers[qIdx] === optIdx ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                                      {userExamAnswers[qIdx] === optIdx && <Check size={12} />}
                                    </div>
                                    <span className="text-xs font-bold">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={handleExamSubmit}
                            disabled={Object.keys(userExamAnswers).length < (activeExam.questions?.length || 0)}
                            className="w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
                          >
                            {am ? 'ፈተናውን አስገባ (Submit Exam)' : 'Submit Exam & Grade'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Default Select Lesson Placeholder */
                    <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 text-center space-y-4 flex flex-col items-center justify-center min-h-[400px]">
                      <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center">
                        <BookOpen size={36} />
                      </div>
                      <h3 className="text-xl font-black text-accent uppercase italic">{am ? 'ትምህርት ይምረጡ' : 'Select a Lesson to Begin'}</h3>
                      <p className="text-xs text-gray-400 font-medium max-w-sm">
                        {am ? 'ከግራ በኩል የሚፈልጉትን ሞጁል እና ትምህርት በመምረጥ ቪዲዮዎችን እና የጥናት ጽሁፎችን ይከታተሉ።' : 'Click on any lesson from the module list on the left to watch video classes and read study notes.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Course Catalog View */
            <div className="space-y-8">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Course Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map(course => {
                  const progress = getCourseProgress(course);
                  return (
                    <div key={course.id} className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group">
                      <div className="relative h-48 bg-gray-200 overflow-hidden">
                        <img
                          src={course.thumbnail_url || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600'}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-accent/80 backdrop-blur-md text-white text-[9px] font-black uppercase rounded-full tracking-widest border border-white/20">
                            {course.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-accent tracking-tight italic uppercase group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed italic line-clamp-2">
                            {course.description}
                          </p>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          {/* Progress Indicator */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase">
                              <span>{am ? 'ሂደት' : 'Progress'}</span>
                              <span className="text-primary">{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setActiveCourse(course);
                              if (course.modules && course.modules[0]?.lessons && course.modules[0].lessons[0]) {
                                setActiveLesson(course.modules[0].lessons[0]);
                              }
                            }}
                            className="w-full py-4 bg-accent hover:bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Play size={16} className="fill-current" />
                            {am ? 'ኮርሱን ጀምር / ቀጥል' : 'Start / Continue Course'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Certificate Download Modal */}
          {showCertificateModal && activeCourse && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white max-w-2xl w-full rounded-[3rem] p-10 border-4 border-primary/30 shadow-2xl text-center space-y-6 relative">
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-accent p-2 rounded-full"
                >
                  <X size={24} />
                </button>

                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto border-2 border-primary/30">
                  <Award size={44} />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-black text-primary uppercase tracking-[0.3em]">Official Certification of Completion</p>
                  <h2 className="text-3xl font-black text-accent italic uppercase">BETESEB ACADEMY</h2>
                  <p className="text-xs text-gray-500 font-bold">This certifies that</p>
                  <p className="text-2xl font-black text-primary underline italic">{currentUser?.email || 'Beteseb Academy Graduate'}</p>
                  <p className="text-xs text-gray-500 font-bold">has successfully completed the enterprise course</p>
                  <p className="text-lg font-black text-accent uppercase">"{activeCourse.title}"</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl text-[10px] text-gray-400 font-mono border">
                  Certificate Verification Hash: BTC-ACADEMY-{activeCourse.id.substring(0, 8)}-{Date.now()}
                </div>

                <button
                  onClick={() => window.print()}
                  className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Print / Save PDF Certificate
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </FeatureGate>
  );
}
