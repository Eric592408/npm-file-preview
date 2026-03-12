import {
  FileType,
  FileInfo,
  PreviewError,
  ErrorCode,
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_PDF_EXTENSIONS,
  SUPPORTED_TEXT_EXTENSIONS,
  SUPPORTED_MARKDOWN_EXTENSIONS,
  SUPPORTED_DOCX_EXTENSIONS,
  SUPPORTED_PPTX_EXTENSIONS,
  SUPPORTED_XLSX_EXTENSIONS,
  LEGACY_FORMATS,
  MIME_TYPE_MAP,
} from '../types';

export { ErrorCode };

export function getFileExtension(url: string): string {
  const cleanUrl = url.split('?')[0].split('#')[0];
  const lastDot = cleanUrl.lastIndexOf('.');
  if (lastDot === -1 || lastDot === cleanUrl.length - 1) {
    return '';
  }
  return cleanUrl.slice(lastDot + 1).toLowerCase();
}

export function getFileName(url: string): string {
  const cleanUrl = url.split('?')[0].split('#')[0];
  const lastSlash = Math.max(cleanUrl.lastIndexOf('/'), cleanUrl.lastIndexOf('\\'));
  return cleanUrl.slice(lastSlash + 1);
}

export function detectFileType(extension: string): FileType {
  const ext = extension.toLowerCase();

  if (SUPPORTED_PDF_EXTENSIONS.includes(ext as typeof SUPPORTED_PDF_EXTENSIONS[number])) {
    return 'pdf';
  }

  if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext as typeof SUPPORTED_IMAGE_EXTENSIONS[number])) {
    return 'image';
  }

  if (SUPPORTED_TEXT_EXTENSIONS.includes(ext as typeof SUPPORTED_TEXT_EXTENSIONS[number])) {
    return 'txt';
  }

  if (SUPPORTED_MARKDOWN_EXTENSIONS.includes(ext as typeof SUPPORTED_MARKDOWN_EXTENSIONS[number])) {
    return 'markdown';
  }

  if (SUPPORTED_DOCX_EXTENSIONS.includes(ext as typeof SUPPORTED_DOCX_EXTENSIONS[number])) {
    return 'docx';
  }

  if (SUPPORTED_PPTX_EXTENSIONS.includes(ext as typeof SUPPORTED_PPTX_EXTENSIONS[number])) {
    return 'pptx';
  }

  if (SUPPORTED_XLSX_EXTENSIONS.includes(ext as typeof SUPPORTED_XLSX_EXTENSIONS[number])) {
    return ext as 'xlsx' | 'xls';
  }

  if (LEGACY_FORMATS.includes(ext as typeof LEGACY_FORMATS[number])) {
    return ext as 'doc' | 'ppt';
  }

  return 'unknown';
}

export function getFileInfo(url: string): FileInfo {
  const fileName = getFileName(url);
  const extension = getFileExtension(url);
  const fileType = detectFileType(extension);
  const mimeType = MIME_TYPE_MAP[extension] || 'application/octet-stream';

  return {
    url,
    fileName,
    extension,
    fileType,
    mimeType,
  };
}

export function isLegacyFormat(fileType: FileType): boolean {
  return fileType === 'doc' || fileType === 'ppt';
}

export function isSupportedFormat(fileType: FileType): boolean {
  return fileType !== 'unknown' && !isLegacyFormat(fileType);
}

export async function fetchFile(
  url: string,
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw createError(
        response.status === 404 ? ErrorCode.FILE_NOT_FOUND : ErrorCode.NETWORK_ERROR,
        `HTTP ${response.status}: ${response.statusText}`,
        undefined,
        url
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw createError(ErrorCode.TIMEOUT, 'Request timeout', error, url);
      }
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        throw createError(ErrorCode.CORS_ERROR, 'CORS error: Unable to fetch file', error, url);
      }
    }

    throw createError(ErrorCode.NETWORK_ERROR, 'Network error', error as Error, url);
  }
}

export async function validateFile(
  url: string,
  timeout: number = 30000
): Promise<{ valid: boolean; contentType?: string; size?: number }> {
  try {
    const response = await fetchFile(url, timeout);
    const contentType = response.headers.get('content-type') || undefined;
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : undefined;

    return { valid: true, contentType, size };
  } catch {
    return { valid: false };
  }
}

export function createError(
  code: ErrorCode,
  message: string,
  originalError?: Error,
  fileUrl?: string
): PreviewError {
  return {
    code,
    message,
    originalError,
    fileUrl,
  };
}

export function sanitizeHtml(html: string): string {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export function formatDimension(value: string | number | undefined, defaultValue: string): string {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'number') {
    return `${value}px`;
  }
  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) {
      return `${value}px`;
    }
    return value;
  }
  return defaultValue;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export function createLoadingElement(theme?: { primaryColor?: string }): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ufp-loading';
  container.innerHTML = `
    <div class="ufp-loading-spinner" style="border-top-color: ${theme?.primaryColor || '#1890ff'}"></div>
    <div class="ufp-loading-text">Loading...</div>
  `;
  return container;
}

export function createErrorElement(
  error: PreviewError,
  theme?: { errorColor?: string }
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ufp-error';
  container.innerHTML = `
    <div class="ufp-error-icon" style="color: ${theme?.errorColor || '#ff4d4f'}">⚠️</div>
    <div class="ufp-error-message">${escapeHtml(error.message)}</div>
    <div class="ufp-error-code">Error Code: ${error.code}</div>
  `;
  return container;
}

export function createLegacyFormatHint(
  fileInfo: FileInfo,
  fallbackUrl?: string
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ufp-legacy-hint';

  const formatName = fileInfo.fileType === 'doc' ? 'Word Document (.doc)' : 'PowerPoint (.ppt)';

  container.innerHTML = `
    <div class="ufp-legacy-hint-icon">📄</div>
    <div class="ufp-legacy-hint-title">Legacy Format Detected</div>
    <div class="ufp-legacy-hint-desc">
      The file "${escapeHtml(fileInfo.fileName)}" is in ${formatName} format.<br>
      This legacy format requires conversion to PDF or modern format for preview.
    </div>
    <div class="ufp-legacy-hint-actions">
      ${fallbackUrl ? `<a href="${escapeHtml(fallbackUrl)}" class="ufp-btn ufp-btn-primary" target="_blank">Open Converted File</a>` : ''}
      <button class="ufp-btn ufp-btn-secondary ufp-legacy-convert-btn">Convert & Preview</button>
    </div>
    <div class="ufp-legacy-hint-note">
      Tip: Convert your file to .${fileInfo.fileType}x format for direct preview support.
    </div>
  `;

  return container;
}
