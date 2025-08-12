import { Pipe, PipeTransform } from '@angular/core';

/** Formats a byte count as a short human-readable size (e.g. "2.4 MB"). */
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    if (bytes == null) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit++;
    }
    return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
  }
}

/** Initials used for avatars, e.g. "Ada Lovelace" → "AL". */
@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(name: string | null | undefined): string {
    return (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('');
  }
}

/** Picks a Bootstrap Icons glyph for a MIME type. */
export function fileIcon(contentType: string): string {
  if (contentType.startsWith('image/')) return 'bi-file-earmark-image';
  if (contentType.startsWith('video/')) return 'bi-file-earmark-play';
  if (contentType.includes('pdf')) return 'bi-file-earmark-pdf';
  if (contentType.includes('word') || contentType.includes('document')) return 'bi-file-earmark-word';
  if (contentType.includes('sheet') || contentType.includes('excel') || contentType.includes('csv'))
    return 'bi-file-earmark-spreadsheet';
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) return 'bi-file-earmark-slides';
  if (contentType.includes('zip') || contentType.includes('compressed')) return 'bi-file-earmark-zip';
  if (contentType.startsWith('text/')) return 'bi-file-earmark-text';
  return 'bi-file-earmark';
}
