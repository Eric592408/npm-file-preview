import type { Renderer, RenderContext } from '../types';
import { ErrorCode, createError, fetchFile, escapeHtml } from '../utils';

interface MarkedInstance {
  parse(text: string, options?: Record<string, unknown>): string | Promise<string>;
}

let markedPromise: Promise<MarkedInstance> | null = null;

async function loadMarked(): Promise<MarkedInstance> {
  if (markedPromise) {
    return markedPromise;
  }

  markedPromise = import('marked').then((module) => {
    const marked = module as unknown as MarkedInstance & { marked?: MarkedInstance };
    return marked.marked || marked;
  });

  return markedPromise;
}

export class MarkdownRenderer implements Renderer {
  name = 'markdown';
  supportedTypes = ['markdown'] as const;

  canHandle(fileType: string): boolean {
    return fileType === 'markdown';
  }

  async render(context: RenderContext): Promise<void> {
    const { container, fileInfo, onError, onProgress, onComplete } = context;

    container.innerHTML = '';
    container.classList.add('ufp-markdown-container');

    onProgress?.(10);

    try {
      const response = await fetchFile(fileInfo.url);
      onProgress?.(30);

      const markdown = await response.text();
      onProgress?.(50);

      const marked = await loadMarked();
      onProgress?.(70);

      const html = await this.renderMarkdown(marked, markdown);
      onProgress?.(90);

      const wrapper = document.createElement('div');
      wrapper.className = 'ufp-markdown-wrapper ufp-markdown-body';
      wrapper.innerHTML = html;

      this.postProcessHtml(wrapper);

      container.appendChild(wrapper);

      onProgress?.(100);
      onComplete?.();
    } catch (error) {
      const previewError = createError(
        ErrorCode.PARSE_ERROR,
        'Failed to render markdown',
        error as Error,
        fileInfo.url
      );
      onError?.(previewError);
      throw previewError;
    }
  }

  private async renderMarkdown(marked: MarkedInstance, text: string): Promise<string> {
    try {
      const result = marked.parse(text, { async: false } as Record<string, unknown>);
      if (result instanceof Promise) {
        return await result;
      }
      return result;
    } catch {
      return `<pre>${escapeHtml(text)}</pre>`;
    }
  }

  private postProcessHtml(container: HTMLElement): void {
    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      img.loading = 'lazy';
    });
  }

  destroy(container: HTMLElement): void {
    container.innerHTML = '';
  }
}

export const markdownRenderer = new MarkdownRenderer();
