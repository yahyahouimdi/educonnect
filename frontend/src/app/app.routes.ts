import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';
import { PublicLayoutComponent } from './layout/public-layout.component';
import { WorkspaceLayoutComponent } from './layout/workspace-layout.component';

export const routes: Routes = [
  // Learning space for every signed-in user.
  {
    path: 'app',
    component: WorkspaceLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', title: 'My learning', loadComponent: () => import('./features/learn/learn-dashboard.component') },
      { path: 'courses/:id', title: 'Course', loadComponent: () => import('./features/learn/course-player.component') },
      { path: 'resources', title: 'Resources', loadComponent: () => import('./features/learn/resources.component') },
      { path: 'chat', title: 'Chat', loadComponent: () => import('./features/learn/chat.component') },
      { path: 'assistant', title: 'Assistant', loadComponent: () => import('./features/learn/assistant.component') },
      { path: 'profile', title: 'My profile', loadComponent: () => import('./features/learn/profile.component') },
    ],
  },

  // Administration console for teachers and administrators.
  {
    path: 'admin',
    component: WorkspaceLayoutComponent,
    canActivate: [roleGuard('ADMIN', 'TEACHER')],
    children: [
      { path: '', title: 'Overview', loadComponent: () => import('./features/admin/admin-dashboard.component') },
      { path: 'courses', title: 'Courses', loadComponent: () => import('./features/admin/courses.component') },
      {
        path: 'courses/:id',
        title: 'Edit course',
        loadComponent: () => import('./features/admin/course-editor.component'),
      },
      {
        path: 'resources',
        title: 'Resources',
        loadComponent: () => import('./features/admin/resources-admin.component'),
      },
      {
        path: 'users',
        title: 'Users',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./features/admin/users.component'),
      },
      {
        path: 'news',
        title: 'News',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./features/admin/news-admin.component'),
      },
      {
        path: 'news/:id',
        title: 'Edit article',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./features/admin/news-editor.component'),
      },
      {
        path: 'messages',
        title: 'Messages',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./features/admin/messages.component'),
      },
      {
        path: 'settings',
        title: 'Institution settings',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./features/admin/settings.component'),
      },
    ],
  },

  // Public institutional website. Declared last because it owns the catch-all route.
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/public/home.component') },
      { path: 'about', title: 'About us', loadComponent: () => import('./features/public/about.component') },
      { path: 'programs', title: 'Programs', loadComponent: () => import('./features/public/programs.component') },
      {
        path: 'programs/:id',
        title: 'Program',
        loadComponent: () => import('./features/public/program-detail.component'),
      },
      { path: 'news', title: 'News', loadComponent: () => import('./features/public/news.component') },
      { path: 'news/:id', title: 'News', loadComponent: () => import('./features/public/article.component') },
      { path: 'contact', title: 'Contact', loadComponent: () => import('./features/public/contact.component') },
      {
        path: 'login',
        title: 'Sign in',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/public/login.component'),
      },
      { path: '**', title: 'Page not found', loadComponent: () => import('./features/public/not-found.component') },
    ],
  },
];
