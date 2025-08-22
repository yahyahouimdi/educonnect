import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage } from '@core/notification.service';
import { FileSizePipe, InitialsPipe } from './format';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  const pipe = new MarkdownPipe();

  it('renders Markdown to HTML', () => {
    expect(pipe.transform('## Title\n\n**bold**')).toContain('<h2>Title</h2>');
    expect(pipe.transform('**bold**')).toContain('<strong>bold</strong>');
  });

  it('returns an empty string for missing content', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});

describe('FileSizePipe', () => {
  const pipe = new FileSizePipe();

  it('formats byte counts', () => {
    expect(pipe.transform(512)).toBe('512 B');
    expect(pipe.transform(2048)).toBe('2.0 KB');
    expect(pipe.transform(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('InitialsPipe', () => {
  it('keeps at most two initials', () => {
    expect(new InitialsPipe().transform('ada king lovelace')).toBe('AK');
  });
});

describe('errorMessage', () => {
  it('uses the problem detail returned by the API', () => {
    const error = new HttpErrorResponse({ status: 409, error: { detail: 'Email already exists' } });
    expect(errorMessage(error)).toBe('Email already exists');
  });

  it('reports the first invalid field', () => {
    const error = new HttpErrorResponse({ status: 400, error: { errors: { fullName: 'must not be blank' } } });
    expect(errorMessage(error)).toBe('Full name must not be blank');
  });

  it('explains network failures', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Cannot reach the server');
  });
});
