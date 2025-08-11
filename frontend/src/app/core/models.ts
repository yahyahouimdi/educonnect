// Types mirroring the backend API contracts (see the OpenAPI docs at /api/swagger-ui).

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProblemDetail {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string>;
}

// ---- Users & auth ------------------------------------------------------------------------------

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: User;
}

export interface UserRequest {
  fullName: string;
  email: string;
  password?: string | null;
  role: Role;
  enabled?: boolean;
}

// ---- Site --------------------------------------------------------------------------------------

export interface SiteInfo {
  name: string;
  shortName: string;
  tagline?: string;
  about?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  primaryColor: string;
  logoUrl?: string;
  social: { facebook?: string; linkedin?: string; x?: string; youtube?: string };
  features: { assistant: boolean };
}

export interface SiteSettingsRequest {
  name: string;
  shortName: string;
  tagline?: string | null;
  about?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  primaryColor: string;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  youtubeUrl?: string | null;
}

export interface PublicStats {
  students: number;
  teachers: number;
  courses: number;
  resources: number;
}

export interface DashboardStats {
  students: number;
  teachers: number;
  admins: number;
  courses: number;
  publishedCourses: number;
  resources: number;
  news: number;
  unreadMessages: number;
}

// ---- News & contact ----------------------------------------------------------------------------

export interface NewsSummary {
  id: number;
  title: string;
  summary?: string;
  published: boolean;
  publishedAt?: string;
  authorName?: string;
}

export interface NewsArticle extends NewsSummary {
  content?: string;
  updatedAt: string;
}

export interface NewsRequest {
  title: string;
  summary?: string | null;
  content?: string | null;
  published: boolean;
}

export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ---- Courses -----------------------------------------------------------------------------------

export interface CourseSummary {
  id: number;
  title: string;
  summary?: string;
  category?: string;
  teacherName?: string;
  chapterCount: number;
  exerciseCount: number;
}

export interface CourseOverview {
  id: number;
  title: string;
  summary?: string;
  description?: string;
  category?: string;
  teacherName?: string;
  chapterTitles: string[];
  exerciseCount: number;
}

export interface Progress {
  totalExercises: number;
  completedExercises: number;
  percent: number;
}

export interface LearningExercise {
  id: number;
  question: string;
  hint?: string;
  position: number;
  completed: boolean;
}

export interface LearningChapter {
  id: number;
  title: string;
  content?: string;
  position: number;
  exercises: LearningExercise[];
}

export interface LearningCourse {
  id: number;
  title: string;
  summary?: string;
  description?: string;
  category?: string;
  teacherName?: string;
  chapters: LearningChapter[];
  progress: Progress;
}

export interface CourseProgress {
  courseId: number;
  title: string;
  category?: string;
  progress: Progress;
}

export interface AttemptResult {
  exerciseId: number;
  correct: boolean;
  courseProgress: Progress;
}

export interface CourseAdmin {
  id: number;
  title: string;
  summary?: string;
  description?: string;
  category?: string;
  published: boolean;
  position: number;
  teacherId?: number;
  teacherName?: string;
  chapterCount: number;
  exerciseCount: number;
  updatedAt: string;
}

export interface CourseRequest {
  title: string;
  summary?: string | null;
  description?: string | null;
  category?: string | null;
  published: boolean;
  position: number;
  teacherId?: number | null;
}

export interface ChapterAdmin {
  id: number;
  courseId: number;
  title: string;
  content?: string;
  position: number;
  exerciseCount: number;
}

export interface ChapterRequest {
  title: string;
  content?: string | null;
  position: number;
}

export interface ExerciseAdmin {
  id: number;
  chapterId: number;
  question: string;
  answer: string;
  hint?: string;
  position: number;
}

export interface ExerciseRequest {
  question: string;
  answer: string;
  hint?: string | null;
  position: number;
}

// ---- Resources, chat, assistant ----------------------------------------------------------------

export interface LearningResource {
  id: number;
  title: string;
  description?: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  courseId?: number;
  courseTitle?: string;
  uploadedById?: number;
  uploadedByName?: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
}

export interface ChatMessage {
  id: number;
  room: string;
  senderId?: number;
  senderName: string;
  senderRole: Role;
  content: string;
  sentAt: string;
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}
