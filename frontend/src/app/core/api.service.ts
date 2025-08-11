import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AssistantMessage,
  AttemptResult,
  ChapterAdmin,
  ChapterRequest,
  ChatMessage,
  ChatRoom,
  ContactMessage,
  ContactRequest,
  CourseAdmin,
  CourseOverview,
  CourseProgress,
  CourseRequest,
  CourseSummary,
  DashboardStats,
  ExerciseAdmin,
  ExerciseRequest,
  LearningCourse,
  LearningResource,
  NewsArticle,
  NewsRequest,
  NewsSummary,
  Page,
  PublicStats,
  Role,
  User,
  UserRequest,
} from './models';

const API = '/api/v1';

/** Public website endpoints (no authentication required). */
@Injectable({ providedIn: 'root' })
export class PublicApi {
  private readonly http = inject(HttpClient);

  stats(): Observable<PublicStats> {
    return this.http.get<PublicStats>(`${API}/site/stats`);
  }

  news(page = 0, size = 9): Observable<Page<NewsSummary>> {
    return this.http.get<Page<NewsSummary>>(`${API}/news`, { params: { page, size } });
  }

  article(id: number): Observable<NewsArticle> {
    return this.http.get<NewsArticle>(`${API}/news/${id}`);
  }

  courses(): Observable<CourseSummary[]> {
    return this.http.get<CourseSummary[]>(`${API}/courses`);
  }

  course(id: number): Observable<CourseOverview> {
    return this.http.get<CourseOverview>(`${API}/courses/${id}`);
  }

  contact(request: ContactRequest): Observable<void> {
    return this.http.post<void>(`${API}/contact`, request);
  }
}

/** Learning space endpoints for any signed-in user. */
@Injectable({ providedIn: 'root' })
export class LearningApi {
  private readonly http = inject(HttpClient);

  progress(): Observable<CourseProgress[]> {
    return this.http.get<CourseProgress[]>(`${API}/learning/progress`);
  }

  course(id: number): Observable<LearningCourse> {
    return this.http.get<LearningCourse>(`${API}/learning/courses/${id}`);
  }

  attempt(exerciseId: number, answer: string): Observable<AttemptResult> {
    return this.http.post<AttemptResult>(`${API}/learning/exercises/${exerciseId}/attempts`, { answer });
  }

  resources(courseId?: number): Observable<LearningResource[]> {
    const params = courseId ? new HttpParams().set('courseId', courseId) : undefined;
    return this.http.get<LearningResource[]>(`${API}/resources`, { params });
  }

  download(resource: LearningResource): void {
    // Downloads need the bearer token, so fetch as a blob instead of navigating to the URL.
    this.http.get(`${API}/resources/${resource.id}/download`, { responseType: 'blob' }).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resource.filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  chatRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${API}/chat/rooms`);
  }

  chatHistory(room: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${API}/chat/rooms/${encodeURIComponent(room)}/messages`);
  }

  askAssistant(messages: AssistantMessage[]): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${API}/assistant/chat`, { messages });
  }
}

/** Administration console endpoints (teachers and administrators). */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);

  dashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${API}/admin/dashboard`);
  }

  // Users
  users(options: { page?: number; size?: number; role?: Role | ''; search?: string } = {}): Observable<Page<User>> {
    let params = new HttpParams().set('page', options.page ?? 0).set('size', options.size ?? 20);
    if (options.role) params = params.set('role', options.role);
    if (options.search) params = params.set('search', options.search);
    return this.http.get<Page<User>>(`${API}/admin/users`, { params });
  }

  createUser(request: UserRequest): Observable<User> {
    return this.http.post<User>(`${API}/admin/users`, request);
  }

  updateUser(id: number, request: UserRequest): Observable<User> {
    return this.http.put<User>(`${API}/admin/users/${id}`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/admin/users/${id}`);
  }

  // Courses
  courses(): Observable<CourseAdmin[]> {
    return this.http.get<CourseAdmin[]>(`${API}/admin/courses`);
  }

  course(id: number): Observable<CourseAdmin> {
    return this.http.get<CourseAdmin>(`${API}/admin/courses/${id}`);
  }

  createCourse(request: CourseRequest): Observable<CourseAdmin> {
    return this.http.post<CourseAdmin>(`${API}/admin/courses`, request);
  }

  updateCourse(id: number, request: CourseRequest): Observable<CourseAdmin> {
    return this.http.put<CourseAdmin>(`${API}/admin/courses/${id}`, request);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/admin/courses/${id}`);
  }

  chapters(courseId: number): Observable<ChapterAdmin[]> {
    return this.http.get<ChapterAdmin[]>(`${API}/admin/courses/${courseId}/chapters`);
  }

  createChapter(courseId: number, request: ChapterRequest): Observable<ChapterAdmin> {
    return this.http.post<ChapterAdmin>(`${API}/admin/courses/${courseId}/chapters`, request);
  }

  updateChapter(id: number, request: ChapterRequest): Observable<ChapterAdmin> {
    return this.http.put<ChapterAdmin>(`${API}/admin/chapters/${id}`, request);
  }

  deleteChapter(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/admin/chapters/${id}`);
  }

  exercises(chapterId: number): Observable<ExerciseAdmin[]> {
    return this.http.get<ExerciseAdmin[]>(`${API}/admin/chapters/${chapterId}/exercises`);
  }

  createExercise(chapterId: number, request: ExerciseRequest): Observable<ExerciseAdmin> {
    return this.http.post<ExerciseAdmin>(`${API}/admin/chapters/${chapterId}/exercises`, request);
  }

  updateExercise(id: number, request: ExerciseRequest): Observable<ExerciseAdmin> {
    return this.http.put<ExerciseAdmin>(`${API}/admin/exercises/${id}`, request);
  }

  deleteExercise(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/admin/exercises/${id}`);
  }

  // Resources
  uploadResource(
    file: File,
    title: string,
    description: string,
    courseId?: number | null,
  ): Observable<LearningResource> {
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    if (description) form.append('description', description);
    if (courseId) form.append('courseId', String(courseId));
    return this.http.post<LearningResource>(`${API}/admin/resources`, form);
  }

  deleteResource(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/admin/resources/${id}`);
  }

  // News
  news(page = 0, size = 20): Observable<Page<NewsSummary>> {
    return this.http.get<Page<NewsSummary>>(`${API}/admin/news`, { params: { page, size } });
  }

  article(id: number): Observable<NewsArticle> {
    return this.http.get<NewsArticle>(`${API}/admin/news/${id}`);
  }

  createArticle(request: NewsRequest): Observable<NewsArticle> {
    return this.http.post<NewsArticle>(`${API}/admin/news`, request);
  }

  updateArticle(id: number, request: NewsRequest): Observable<NewsArticle> {
    return this.http.put<NewsArticle>(`${API}/admin/news/${id}`, request);
  }

  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/admin/news/${id}`);
  }

  // Contact messages
  messages(page = 0, size = 20): Observable<Page<ContactMessage>> {
    return this.http.get<Page<ContactMessage>>(`${API}/admin/contact-messages`, { params: { page, size } });
  }

  markMessage(id: number, read: boolean): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${API}/admin/contact-messages/${id}`, null, { params: { read } });
  }

  deleteMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/admin/contact-messages/${id}`);
  }
}
