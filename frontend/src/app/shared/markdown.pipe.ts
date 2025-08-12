import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

/**
 * Renders Markdown to HTML. Bind the result with [innerHTML]: Angular's built-in sanitizer then
 * strips scripts, event handlers and other unsafe markup.
 */
@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? (marked.parse(value, { async: false }) as string) : '';
  }
}
