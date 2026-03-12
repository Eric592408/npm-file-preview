export type FileType =
  | 'pdf'
  | 'image'
  | 'txt'
  | 'markdown'
  | 'docx'
  | 'pptx'
  | 'xlsx'
  | 'xls'
  | 'doc'
  | 'ppt'
  | 'unknown';

export type LegacyFormatHandler = 'hint' | 'convert-service-url' | 'custom';

export interface ThemeConfig {
  primaryColor?: string;
  errorColor?: string;
  backgroundColor?: string;
  textColor?: string;
  loadingColor?: string;
}

export interface GlobalConfig {
  defaultWidth?: string | number;
  defaultHeight?: string | number;
  theme?: ThemeConfig;
  legacyFormatHandler?: LegacyFormatHandler;
  convertServiceUrl?: string;
  pdfWorkerSrc?: string;
  enableLazyLoad?: boolean;
  maxFileSize?: number;
  requestTimeout?: number;
}

export interface FilePreviewProps {
  src: string;
  fileType?: FileType;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: Record<string, string | number>;
  loader?: LoaderComponent;
  error?: ErrorComponent;
  config?: GlobalConfig;
  onError?: (error: PreviewError) => void;
  onLoad?: () => void;
  onLegacyFormat?: (fileInfo: LegacyFormatInfo) => void;
}

export type LoaderComponent = string | HTMLElement | (() => HTMLElement) | null;
export type ErrorComponent = string | HTMLElement | ((error: PreviewError) => HTMLElement) | null;

export interface PreviewError {
  code: ErrorCode;
  message: string;
  originalError?: Error;
  fileUrl?: string;
}

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  PARSE_ERROR = 'PARSE_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  TIMEOUT = 'TIMEOUT',
  LEGACY_FORMAT = 'LEGACY_FORMAT',
  UNKNOWN = 'UNKNOWN',
}

export interface LegacyFormatInfo {
  originalUrl: string;
  fileType: 'doc' | 'ppt';
  suggestedAction: 'convert' | 'fallback';
  fallbackUrl?: string;
}

export interface FileInfo {
  url: string;
  fileName: string;
  extension: string;
  fileType: FileType;
  size?: number;
  mimeType?: string;
}

export interface RenderContext {
  container: HTMLElement;
  fileInfo: FileInfo;
  config: GlobalConfig;
  width: string | number;
  height: string | number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (error: PreviewError) => void;
}

export interface Renderer {
  name: string;
  supportedTypes: readonly FileType[];
  canHandle(fileType: FileType): boolean;
  render(context: RenderContext): Promise<void>;
  destroy?(container: HTMLElement): void;
}

export interface PDFRenderOptions {
  scale?: number;
  enableTextLayer?: boolean;
  enableAnnotationLayer?: boolean;
  pageNumber?: number;
}

export interface ImageRenderOptions {
  lazyLoad?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none';
  alt?: string;
}

export interface TextRenderOptions {
  encoding?: string;
  lineNumbers?: boolean;
  maxHeight?: string | number;
}

export interface MarkdownRenderOptions {
  gfm?: boolean;
  breaks?: boolean;
  sanitize?: boolean;
}

export interface DocxRenderOptions {
  useBase64URL?: boolean;
  renderHeaders?: boolean;
  renderFooters?: boolean;
}

export interface PptxRenderOptions {
  scale?: number;
}

export interface XlsxRenderOptions {
  sheetIndex?: number;
  showGrid?: boolean;
}

export type RenderOptions =
  | PDFRenderOptions
  | ImageRenderOptions
  | TextRenderOptions
  | MarkdownRenderOptions
  | DocxRenderOptions
  | PptxRenderOptions
  | XlsxRenderOptions;

export interface PreviewState {
  loading: boolean;
  error: PreviewError | null;
  fileInfo: FileInfo | null;
  rendered: boolean;
}

export interface FilePreviewInstance {
  getState(): PreviewState;
  refresh(): Promise<void>;
  destroy(): void;
  resize(width: string | number, height: string | number): void;
}

export const SUPPORTED_IMAGE_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif'
] as const;

export const SUPPORTED_PDF_EXTENSIONS = ['pdf'] as const;

export const SUPPORTED_TEXT_EXTENSIONS = ['txt', 'log', 'csv'] as const;

export const SUPPORTED_MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown', 'mkd'] as const;

export const SUPPORTED_DOCX_EXTENSIONS = ['docx'] as const;

export const SUPPORTED_PPTX_EXTENSIONS = ['pptx'] as const;

export const SUPPORTED_XLSX_EXTENSIONS = ['xlsx', 'xls'] as const;

export const LEGACY_FORMATS = ['doc', 'ppt'] as const;

export const MIME_TYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  txt: 'text/plain',
  log: 'text/plain',
  csv: 'text/csv',
  md: 'text/markdown',
  markdown: 'text/markdown',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  doc: 'application/msword',
  ppt: 'application/vnd.ms-powerpoint',
};
