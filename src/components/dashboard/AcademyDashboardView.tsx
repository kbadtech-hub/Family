'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocale } from 'next-intl';
import {
  GraduationCap,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  FileText,
  BarChart2,
  Award,
  X,
  Clock,
  Lock,
  Sparkles,
  MessageCircle,
  Send,
  Star,
} from 'lucide-react';
import FeatureGate from '@/components/dashboard/FeatureGate';

/* ─── Static fallback course data ─────────────────────────────────── */
const STATIC_COURSES = [
  {
    id: 'c1',
    title: 'Pre-Marriage Foundations',
    title_am: 'የቅድመ-ጋብቻ መሰረቶች',
    description: 'Build the core values, expectations, and communication skills needed before getting married.',
    description_am: 'ከጋብቻ በፊት የሚያስፈልጉ ዋና ዋና እሴቶችን፣ የቀን ሂደቶችን እና የመግባቢያ ክህሎቶችን ይገንቡ።',
    category: 'Pre-Marriage',
    lessons: [
      { id: 'l1', title: 'Understanding Commitment', title_am: 'ቁርጠኝነትን መረዳት', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 15 },
      { id: 'l2', title: 'Family Values & Traditions', title_am: 'የቤተሰብ እሴቶች እና ወጎች', video_url: '', duration: 12 },
      { id: 'l3', title: 'Communication Basics', title_am: 'የመግባቢያ መሰረቶች', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 18 },
    ],
    exam: {
      id: 'e1',
      title: 'Pre-Marriage Foundations Exam',
      passing_score: 70,
      questions: [
        { id: 'q1', question_text: 'What is the most important foundation for a successful marriage?', question_text_am: 'ለተሳካ ጋብቻ በጣም አስፈላጊው መሰረት ምንድን ነው?', options: ['Money', 'Trust & Communication', 'Physical Attraction', 'Status'], correct_option: 1 },
        { id: 'q2', question_text: 'What does commitment in marriage mean?', question_text_am: 'በጋብቻ ውስጥ ቁርጠኝነት ምን ማለት ነው?', options: ['Financial security only', 'A legal contract only', 'Dedicated partnership through all seasons', 'Living together'], correct_option: 2 },
        { id: 'q3', question_text: 'Ethiopian family values primarily emphasize:', question_text_am: 'የኢትዮጵያ የቤተሰብ እሴቶች ዋና ዋናዎቹ ምን ናቸው?', options: ['Individual ambitions', 'Community, respect & intergenerational bonds', 'Wealth accumulation', 'Career success'], correct_option: 1 },
      ]
    }
  },
  {
    id: 'c2',
    title: 'Marriage Communication Mastery',
    title_am: 'የጋብቻ ግንኙነት ብቃት',
    description: 'Learn advanced techniques to communicate effectively, resolve conflicts, and grow stronger together.',
    description_am: 'ውጤታማ ለመግባባት፣ ግጭቶችን ለመፍታት እና አብረው ለማደግ የሚረዱ የላቁ ቴክኒኮችን ይወቁ።',
    category: 'Communication',
    lessons: [
      { id: 'l4', title: 'Active Listening Skills', title_am: 'ንቁ የማዳመጥ ክህሎቶች', video_url: '', duration: 20 },
      { id: 'l5', title: 'Conflict Resolution Frameworks', title_am: 'ግጭት የመፍቻ ስርዓቶች', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 22 },
      { id: 'l6', title: 'Emotional Intelligence for Couples', title_am: 'ለጥንዶች ስሜታዊ ብቃት', video_url: '', duration: 17 },
    ],
    exam: {
      id: 'e2',
      title: 'Communication Mastery Exam',
      passing_score: 70,
      questions: [
        { id: 'q4', question_text: 'Active listening involves:', question_text_am: 'ንቁ ማዳመጥ ምን ይይዛል?', options: ['Waiting for your turn to speak', 'Fully focusing and understanding the speaker', 'Preparing your response while listening', 'Avoiding eye contact'], correct_option: 1 },
        { id: 'q5', question_text: 'The best approach to conflict resolution is:', question_text_am: 'ለግጭት ችግር ምርጥ አቀራረብ ምንድን ነው?', options: ['Ignoring the problem', 'Win-win collaborative problem solving', 'One partner always yielding', 'Involving family members immediately'], correct_option: 1 },
      ]
    }
  },
  {
    id: 'c3',
    title: 'Parenting & Family Management',
    title_am: 'የወላጅነት እና የቤተሰብ አስተዳደር',
    description: 'Holistic guidance on raising children with Ethiopian values, managing finances, and building a strong household.',
    description_am: 'ልጆችን በኢትዮጵያ እሴቶች ለማሳደግ፣ ፋይናንስ ለማስተዳደር እና ጠንካራ ቤተሰብ ለመገንባት የሚረዳ ሁሉ-አቀፍ መምሪያ።',
    category: 'Parenting',
    lessons: [
      { id: 'l7', title: 'Ethiopian Parenting Principles', title_am: 'የኢትዮጵያ የወላጅነት መርሆዎች', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 25 },
      { id: 'l8', title: 'Family Finance Foundations', title_am: 'የቤተሰብ ፋይናንስ መሰረቶች', video_url: '', duration: 19 },
      { id: 'l9', title: 'Building Household Rituals', title_am: 'የቤት ሥርዓቶችን መገንባት', video_url: '', duration: 14 },
    ],
    exam: {
      id: 'e3',
      title: 'Parenting & Family Exam',
      passing_score: 70,
      questions: [
        { id: 'q6', question_text: 'A key Ethiopian parenting value is:', question_text_am: 'ዋና የኢትዮጵያ የወላጅነት እሴት ምንድን ነው?', options: ['Strict discipline only', 'Respect for elders and communal support', 'Isolation from community', 'Material provision only'], correct_option: 1 },
        { id: 'q7', question_text: 'Family financial planning helps:', question_text_am: 'የቤተሰብ የፋይናንስ እቅድ ምን ይረዳል?', options: ['Only the husband', 'Reduce stress and achieve shared goals', 'Avoid family discussions', 'None of the above'], correct_option: 1 },
      ]
    }
  }
];

/* ─── YouTube ID extractor ─────────────────────────────────────────── */
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([^#&?]{11})/);
  return m ? m[1] : null;
}

/* ─── Category badge colours ─────────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, string> = {
  'Pre-Marriage': 'bg-rose-50 text-rose-700 border-rose-200',
  'Communication': 'bg-blue-50 text-blue-700 border-blue-200',
  'Parenting': 'bg-green-50 text-green-700 border-green-200',
  'Finance': 'bg-amber-50 text-amber-700 border-amber-200',
  'Wellbeing': 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function AcademyDashboardView() {
  const locale = useLocale();

  const [courses, setCourses] = useState<any[]>(STATIC_COURSES);
  const [activeCourse, setActiveCourse] = useState<any | null>(null);
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [showExam, setShowExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examResult, setExamResult] = useState<{ passed: boolean; score: number } | null>(null);
  const [showCert, setShowCert] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['c1']));

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  /* ── Helpers ─────────────────────────────────── */
  const t = (am: string, en: string) => (locale === 'am' || locale === 'ti' || locale === 'om') ? am : en;
  const courseProgress = (course: any) => {
    const total = course.lessons.length;
    if (!total) return 0;
    const done = course.lessons.filter((l: any) => completedLessons.has(l.id)).length;
    return Math.round((done / total) * 100);
  };

  const markLessonDone = (lessonId: string) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
  };

  const submitExam = () => {
    if (!activeCourse?.exam) return;
    const qs = activeCourse.exam.questions;
    const correct = qs.filter((q: any) => examAnswers[q.id] === q.correct_option).length;
    const score = Math.round((correct / qs.length) * 100);
    const passed = score >= activeCourse.exam.passing_score;
    setExamResult({ passed, score });
    if (passed) {
      qs.forEach((q: any) => markLessonDone(q.id)); // mark as done
    }
  };

  /* ── If a course is open ─────────────────────── */
  if (activeCourse) {
    return (
      <FeatureGate featureKey="academy" featureTitle={t('ቤተሰብ አካዳሚ', 'Beteseb Academy')} locale={locale}>
        <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-300">
          {/* Back + title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setActiveCourse(null); setActiveLesson(null); setShowExam(false); setExamResult(null); setExamAnswers({}); }}
              className="p-3 rounded-2xl bg-white border border-border hover:bg-muted/40 transition-all text-gray-500 hover:text-primary"
            >
              <ChevronRight size={18} className="rotate-180" />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                {t('ቤተሰብ አካዳሚ', 'Beteseb Academy')}
              </p>
              <h2 className="text-xl font-black text-accent tracking-tight">
                {t(activeCourse.title_am, activeCourse.title)}
              </h2>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-[2rem] border border-border p-6 flex items-center gap-6 shadow-sm">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('ስኬት', 'Progress')}</span>
                <span className="text-[10px] font-black text-primary">{courseProgress(activeCourse)}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${courseProgress(activeCourse)}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-accent">{completedLessons.size}/{activeCourse.lessons.length}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{t('ትምህርቶች', 'Lessons')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lesson List */}
            <div className="bg-white rounded-[2.5rem] border border-border shadow-sm p-6 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                {t('ትምህርቶች', 'Lessons')}
              </h3>
              {activeCourse.lessons.map((lesson: any, idx: number) => (
                <button
                  key={lesson.id}
                  onClick={() => { setActiveLesson(lesson); setShowExam(false); setExamResult(null); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${activeLesson?.id === lesson.id ? 'bg-primary/10 border border-primary/30 text-primary' : 'hover:bg-muted/40 border border-transparent'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black ${completedLessons.has(lesson.id) ? 'bg-green-500 text-white' : 'bg-muted text-gray-400'}`}>
                    {completedLessons.has(lesson.id) ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-accent truncate">{t(lesson.title_am, lesson.title)}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><Clock size={10} />{lesson.duration} {t('ደቂቃ', 'min')}</p>
                  </div>
                  {lesson.video_url && <PlayCircle size={16} className="text-primary shrink-0" />}
                </button>
              ))}
              {/* Exam button */}
              <button
                onClick={() => { setShowExam(true); setActiveLesson(null); setExamResult(null); setExamAnswers({}); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all mt-2"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Star size={14} />
                </div>
                <span className="text-xs font-black">{t('የፍጻሜ ፈተና', 'Final Exam')}</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Exam Mode */}
              {showExam && activeCourse.exam && (
                <div className="bg-white rounded-[2.5rem] border border-border shadow-sm p-8 space-y-6">
                  <h3 className="text-lg font-black text-accent">{t('የፍጻሜ ፈተና', 'Final Exam')}</h3>
                  {examResult ? (
                    <div className={`p-8 rounded-[2rem] text-center space-y-4 ${examResult.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className={`text-5xl font-black ${examResult.passed ? 'text-green-600' : 'text-red-600'}`}>{examResult.score}%</div>
                      <p className="font-black text-lg">{examResult.passed ? (t('እንኳን ደስ አለህ! ፈተናውን አልፈሃል! 🎉', 'Congratulations! You passed! 🎉')) : t('አልፈሽም። ድጋሚ ሞክር።', 'Did not pass. Please try again.')}</p>
                      {examResult.passed && (
                        <button onClick={() => setShowCert(true)} className="btn-primary px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">
                          🏆 {t('የምስክር ወረቀት ይውሰዱ', 'Get Certificate')}
                        </button>
                      )}
                      {!examResult.passed && (
                        <button onClick={() => { setExamResult(null); setExamAnswers({}); }} className="px-8 py-3 rounded-2xl border-2 border-red-300 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all">
                          {t('ድጋሚ ሞክር', 'Try Again')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {activeCourse.exam.questions.map((q: any, qi: number) => (
                        <div key={q.id} className="space-y-3">
                          <p className="font-black text-sm text-accent">{qi + 1}. {t(q.question_text_am, q.question_text)}</p>
                          <div className="space-y-2">
                            {q.options.map((opt: string, oi: number) => (
                              <label key={oi} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${examAnswers[q.id] === oi ? 'bg-primary/10 border-primary/40' : 'border-muted hover:bg-muted/30'}`}>
                                <input type="radio" name={q.id} onChange={() => setExamAnswers(prev => ({ ...prev, [q.id]: oi }))} className="accent-primary" />
                                <span className="text-sm font-medium text-accent">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={submitExam}
                        disabled={Object.keys(examAnswers).length < activeCourse.exam.questions.length}
                        className="w-full btn-primary py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-40"
                      >
                        {t('ፈተናውን አስገባ', 'Submit Exam')}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Video / Lesson Content */}
              {activeLesson && !showExam && (
                <>
                  <div className="bg-white rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
                    {activeLesson.video_url && getYouTubeId(activeLesson.video_url) ? (
                      <div className="relative w-full aspect-video">
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${getYouTubeId(activeLesson.video_url)}?rel=0&modestbranding=1`}
                          title={t(activeLesson.title_am, activeLesson.title)}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center bg-muted/30 text-gray-400 gap-4">
                        <BookOpen size={40} />
                        <p className="text-sm font-black uppercase tracking-widest">{t('ጽሑፍ ትምህርት', 'Text Lesson')}</p>
                      </div>
                    )}
                    <div className="p-8">
                      <h3 className="text-xl font-black text-accent mb-3">{t(activeLesson.title_am, activeLesson.title)}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest mb-6">
                        <Clock size={12} /> {activeLesson.duration} {t('ደቂቃ', 'minutes')}
                      </div>
                      {!completedLessons.has(activeLesson.id) && (
                        <button onClick={() => markLessonDone(activeLesson.id)} className="btn-primary px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={16} /> {t('ትምህርቱን አጠናቀቅሁ', 'Mark as Complete')}
                        </button>
                      )}
                      {completedLessons.has(activeLesson.id) && (
                        <div className="flex items-center gap-2 text-green-600 font-black text-xs uppercase tracking-widest">
                          <CheckCircle2 size={16} /> {t('ተጠናቅቋል ✓', 'Completed ✓')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Discussion */}
                  <div className="bg-white rounded-[2.5rem] border border-border shadow-sm p-8">
                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                      <MessageCircle size={16} /> {t('ጥያቄዎች እና ውይይቶች', 'Questions & Discussion')}
                    </h4>
                    <div className="flex gap-3">
                      <input
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder={t('ጥያቄ ይጻፉ...', 'Ask a question...')}
                        className="flex-1 px-5 py-3.5 rounded-2xl border border-border text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        onClick={() => { if (newComment.trim()) { setComments(prev => [{ id: Date.now(), text: newComment, time: 'Now' }, ...prev]); setNewComment(''); } }}
                        className="p-3.5 bg-primary text-white rounded-2xl hover:bg-primary/90 active:scale-95 transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                    {comments.length > 0 && (
                      <div className="mt-6 space-y-3">
                        {comments.map((c: any) => (
                          <div key={c.id} className="bg-muted/20 rounded-2xl p-4 text-sm text-gray-600">{c.text}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Empty state */}
              {!activeLesson && !showExam && (
                <div className="bg-white rounded-[2.5rem] border border-border shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                    <BookOpen size={28} className="text-primary" />
                  </div>
                  <p className="font-black text-accent">{t('ትምህርት ምረጥ', 'Select a Lesson')}</p>
                  <p className="text-sm text-gray-400">{t('ከዝርዝሩ ትምህርት ምረጥ ለመጀመር', 'Pick a lesson from the list to begin')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Modal */}
        {showCert && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setShowCert(false)}>
            <div className="bg-white max-w-lg w-full p-10 rounded-[3rem] border-4 border-primary text-center space-y-6 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <div className="text-5xl">🏆</div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('ቤተሰብ አካዳሚ', 'Beteseb Academy')}</p>
              <h3 className="text-2xl font-black italic text-accent">{t('ኮርሱን አጠናቀቁ!', 'Course Completed!')}</h3>
              <p className="text-sm text-gray-500">{t(activeCourse.title_am, activeCourse.title)}</p>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => setShowCert(false)} className="btn-primary px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">
                  {t('ዝጋ', 'Close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </FeatureGate>
    );
  }

  /* ─── Course Catalog ─────────────────────────────────────────────── */
  return (
    <FeatureGate featureKey="academy" featureTitle={t('ቤተሰብ አካዳሚ', 'Beteseb Academy')} locale={locale}>
      <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-300">

        {/* Hero Section — identical design pattern to WorkshopsView */}
        <div className="bg-accent rounded-[3.5rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full -ml-32 -mb-32 blur-[60px]" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <GraduationCap size={14} /> {t('ቤተሰብ አካዳሚ', 'Beteseb Academy')}
              </div>
              <h2 className="text-4xl md:text-6xl font-black italic mb-6 leading-tight tracking-[calc(-0.04em)]">
                {t('ቤተሰብዎን ያጠናክሩ።', 'Strengthen Your')} <br />
                {t('', 'Family Bond.')}
              </h2>
              <p className="text-white/60 text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
                {t(
                  'ለቅድመ ጋብቻ፣ ለቤተሰብ ሕይወት እና ለጥንዶች ዕድገት የተዘጋጁ ሙያዊ ኮርሶች።',
                  'Expert-crafted courses for pre-marriage preparation, family life, and couples growth.'
                )}
              </p>
            </div>
            <div className="w-full md:w-auto grid grid-cols-2 gap-4">
              {[
                { icon: GraduationCap, label: t('የተረጋገጡ ኮርሶች', 'Certified Courses') },
                { icon: Award, label: t('ሰርተፊኬቶች', 'Certificates') },
                { icon: BarChart2, label: t('ስኬት ክትትል', 'Progress Tracking') },
                { icon: CheckCircle2, label: t('መስተጋብር', 'Interactive') },
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-3">
                  <item.icon className="text-primary" size={24} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course Cards */}
        <section>
          <h3 className="text-3xl font-black text-accent mb-8 uppercase italic tracking-tighter">
            {t('ሁሉም ኮርሶች', 'All Courses')}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {courses.map((course) => {
              const progress = courseProgress(course);
              return (
                <div
                  key={course.id}
                  onClick={() => { setActiveCourse(course); setActiveLesson(course.lessons[0] || null); }}
                  className="bg-white p-10 rounded-[3rem] border border-muted shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-primary/5 rounded-2xl">
                      <BookOpen size={32} className="text-primary" />
                    </div>
                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${CATEGORY_COLORS[course.category] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {course.category}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-accent italic tracking-tight mb-3">
                    {t(course.title_am, course.title)}
                  </h4>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    {t(course.description_am, course.description)}
                  </p>
                  {/* Progress bar */}
                  {progress > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('ስኬት', 'Progress')}</span>
                        <span className="text-[10px] font-black text-primary">{progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      <span className="flex items-center gap-1"><PlayCircle size={12} /> {course.lessons.length} {t('ትምህርቶች', 'Lessons')}</span>
                      <span className="flex items-center gap-1"><Star size={12} /> {t('ፈተና', 'Exam')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                      {progress === 0 ? t('ጀምር', 'Start') : t('ቀጥል', 'Continue')}
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </FeatureGate>
  );
}
