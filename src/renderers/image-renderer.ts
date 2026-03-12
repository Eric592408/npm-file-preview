import type { Renderer, RenderContext } from '../types';
import { ErrorCode, createError, escapeHtml } from '../utils';

export class ImageRenderer implements Renderer {
  name = 'image';
  supportedTypes = ['image'] as const;

  canHandle(fileType: string): boolean {
    return fileType === 'image';
  }

  async render(context: RenderContext): Promise<void> {
    const { container, fileInfo, config, onError, onProgress, onComplete } = context;

    container.innerHTML = '';
    container.classList.add('ufp-image-container');

    onProgress?.(10);

    const wrapper = document.createElement('div');
    wrapper.className = 'ufp-image-wrapper';

    const image = document.createElement('img');
    image.className = 'ufp-image';
    image.alt = escapeHtml(fileInfo.fileName);

    if (config.enableLazyLoad !== false) {
      image.loading = 'lazy';
    }

    image.style.maxWidth = '100%';
    image.style.maxHeight = '100%';
    image.style.objectFit = 'contain';

    return new Promise((resolve, reject) => {
      image.onload = () => {
        onProgress?.(100);
        wrapper.appendChild(image);
        container.appendChild(wrapper);
        onComplete?.();
        resolve();
      };

      image.onerror = () => {
        const error = createError(
          ErrorCode.NETWORK_ERROR,
          `Failed to load image: ${fileInfo.fileName}`,
          undefined,
          fileInfo.url
        );
        onError?.(error);
        reject(error);
      };

      image.src = fileInfo.url;
      onProgress?.(50);
    });
  }

  destroy(container: HTMLElement): void {
    const image = container.querySelector('.ufp-image');
    if (image) {
      (image as HTMLImageElement).src = '';
    }
    container.innerHTML = '';
  }
}

export const imageRenderer = new ImageRenderer();
