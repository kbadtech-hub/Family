-- =========================================================================
-- BETESEB PLATFORM — MODULE 18: ACADEMY (LMS) & COUNSELING (TELE-CONSULTATION)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. BETESEB ACADEMY (ENTERPRISE LMS) TABLES
-- -------------------------------------------------------------------------

-- 1.1 Courses Table
CREATE TABLE IF NOT EXISTS public.academy_courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT DEFAULT 'General' CHECK (category IN ('Pre-Marriage', 'Communication', 'Culture', 'Parenting', 'Conflict Resolution', 'Finance', 'Wellbeing', 'Spirituality', 'General')),
  thumbnail_url TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 1.2 Modules Table
CREATE TABLE IF NOT EXISTS public.academy_modules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      UUID REFERENCES public.academy_courses(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  sequence_order INTEGER DEFAULT 1 NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 1.3 Lessons Table
CREATE TABLE IF NOT EXISTS public.academy_lessons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id    UUID REFERENCES public.academy_modules(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  video_url    TEXT,
  content_text TEXT,
  duration     INTEGER DEFAULT 10 NOT NULL, -- duration in minutes
  pdf_url      TEXT, -- Attached study guide PDF
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 1.4 Exams Table
CREATE TABLE IF NOT EXISTS public.academy_exams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID REFERENCES public.academy_courses(id) ON DELETE CASCADE NOT NULL,
  title         TEXT NOT NULL,
  passing_score INTEGER DEFAULT 70 NOT NULL, -- Pass threshold percentage
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 1.5 Exam Questions Table
CREATE TABLE IF NOT EXISTS public.academy_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id        UUID REFERENCES public.academy_exams(id) ON DELETE CASCADE NOT NULL,
  question_text  TEXT NOT NULL,
  options        JSONB NOT NULL, -- Array of string options ["Option A", "Option B", ...]
  correct_option INTEGER NOT NULL -- Index of correct option (0-indexed)
);

-- 1.6 Student Progress & Exam Scores Table
CREATE TABLE IF NOT EXISTS public.academy_student_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id    UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  course_id    UUID REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  exam_score   NUMERIC(5,2) DEFAULT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- 1.7 Lesson Discussion Q&A Forum
CREATE TABLE IF NOT EXISTS public.academy_lesson_discussions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- -------------------------------------------------------------------------
-- 2. COUNSELING SESSIONS (TELE-CONSULTATION HUB) TABLES
-- -------------------------------------------------------------------------

-- 2.1 Counselor Directory Table
CREATE TABLE IF NOT EXISTS public.counselors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bio             TEXT,
  specialization  TEXT DEFAULT 'Pre-Marriage' CHECK (specialization IN ('Pre-Marriage', 'Conflict Resolution', 'Finance', 'Parenting', 'Psychology', 'General')),
  hourly_rate     NUMERIC(10,2) DEFAULT 50.00 NOT NULL,
  verified_status VARCHAR(20) DEFAULT 'verified' CHECK (verified_status IN ('pending', 'verified', 'rejected')),
  rating          NUMERIC(3,2) DEFAULT 5.00,
  languages       JSONB DEFAULT '["Amharic", "English"]'::jsonb,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2.2 Counselor Availability Slots Table
CREATE TABLE IF NOT EXISTS public.counselor_availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID REFERENCES public.counselors(id) ON DELETE CASCADE NOT NULL,
  day_of_week  INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday...
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2.3 Counseling Appointments Table
CREATE TABLE IF NOT EXISTS public.counseling_appointments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  counselor_id  UUID REFERENCES public.counselors(id) ON DELETE CASCADE NOT NULL,
  scheduled_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  status        VARCHAR(20) DEFAULT 'booked' CHECK (status IN ('booked', 'active', 'completed', 'canceled')),
  video_room_id TEXT DEFAULT gen_random_uuid()::text NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2.4 Counseling Private Session Chat Messages Table
CREATE TABLE IF NOT EXISTS public.counseling_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.counseling_appointments(id) ON DELETE CASCADE NOT NULL,
  sender_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message        TEXT NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- -------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) & POLICIES
-- -------------------------------------------------------------------------

ALTER TABLE public.academy_courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_modules            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_exams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_questions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_student_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_discussions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.counselors                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_availability     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_messages        ENABLE ROW LEVEL SECURITY;

-- Public read for courses, modules, lessons, exams, questions, counselors, availability
CREATE POLICY "Public read academy courses"            ON public.academy_courses            FOR SELECT USING (true);
CREATE POLICY "Public read academy modules"            ON public.academy_modules            FOR SELECT USING (true);
CREATE POLICY "Public read academy lessons"            ON public.academy_lessons            FOR SELECT USING (true);
CREATE POLICY "Public read academy exams"              ON public.academy_exams              FOR SELECT USING (true);
CREATE POLICY "Public read academy questions"          ON public.academy_questions          FOR SELECT USING (true);
CREATE POLICY "Public read counselors"                 ON public.counselors                 FOR SELECT USING (true);
CREATE POLICY "Public read counselor availability"     ON public.counselor_availability     FOR SELECT USING (true);
CREATE POLICY "Public read academy discussions"        ON public.academy_lesson_discussions FOR SELECT USING (true);

-- Student Progress: Users read/write own progress
CREATE POLICY "Users read own academy progress" ON public.academy_student_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert/update own academy progress" ON public.academy_student_progress FOR ALL USING (auth.uid() = user_id);

-- Lesson Discussions: Authenticated users insert comments
CREATE POLICY "Users insert academy discussions" ON public.academy_lesson_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Counseling Appointments: Client or Counselor read/write
CREATE POLICY "Users access own counseling appointments" ON public.counseling_appointments 
  FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Counseling Messages: Participants read/write
CREATE POLICY "Participants access counseling messages" ON public.counseling_messages 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.counseling_appointments a 
      WHERE a.id = appointment_id 
        AND (a.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = a.counselor_id AND c.user_id = auth.uid()))
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Admin Full Access Policies
CREATE POLICY "Admin full access academy_courses"            ON public.academy_courses            FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admin full access academy_modules"            ON public.academy_modules            FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admin full access academy_lessons"            ON public.academy_lessons            FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admin full access academy_exams"              ON public.academy_exams              FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admin full access academy_questions"          ON public.academy_questions          FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admin full access counselors"                 ON public.counselors                 FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admin full access counselor_availability"     ON public.counselor_availability     FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Grants
GRANT ALL ON public.academy_courses TO authenticated, anon, service_role;
GRANT ALL ON public.academy_modules TO authenticated, anon, service_role;
GRANT ALL ON public.academy_lessons TO authenticated, anon, service_role;
GRANT ALL ON public.academy_exams TO authenticated, anon, service_role;
GRANT ALL ON public.academy_questions TO authenticated, anon, service_role;
GRANT ALL ON public.academy_student_progress TO authenticated, anon, service_role;
GRANT ALL ON public.academy_lesson_discussions TO authenticated, anon, service_role;
GRANT ALL ON public.counselors TO authenticated, anon, service_role;
GRANT ALL ON public.counselor_availability TO authenticated, anon, service_role;
GRANT ALL ON public.counseling_appointments TO authenticated, anon, service_role;
GRANT ALL ON public.counseling_messages TO authenticated, anon, service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_academy_modules_course_id       ON public.academy_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_module_id       ON public.academy_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_academy_exams_course_id         ON public.academy_exams(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_questions_exam_id       ON public.academy_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_academy_progress_user_id       ON public.academy_student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_discussions_lesson_id   ON public.academy_lesson_discussions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_counselors_user_id              ON public.counselors(user_id);
CREATE INDEX IF NOT EXISTS idx_counselors_specialization       ON public.counselors(specialization);
CREATE INDEX IF NOT EXISTS idx_counselor_availability_counselor ON public.counselor_availability(counselor_id);
CREATE INDEX IF NOT EXISTS idx_counseling_appointments_user_id ON public.counseling_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_counseling_appointments_status  ON public.counseling_appointments(status);
CREATE INDEX IF NOT EXISTS idx_counseling_messages_app_id      ON public.counseling_messages(appointment_id);
