import {
  GlobalConfig,
  FilePreviewProps,
  PreviewState,
  FilePreviewInstance,
  FileInfo,
  PreviewError,
  ErrorCode,
  LegacyFormatInfo,
} from '../types';
import {
  getFileInfo,
  isLegacyFormat,
  isSupportedFormat,
  createLoadingElement,
  createErrorElement,
  createLegacyFormatHint,
  formatDimension,
  validateFile,
} from '../utils';
import { renderFile, destroyRenderer } from '../renderers';

const DEFAULT_CONFIG: GlobalConfig = {
  defaultWidth: '100%',
  defaultHeight: '500px',
  theme: {
    primaryColor: '#1890ff',
    errorColor: '#ff4d4f',
    backgroundColor: '#f5f5f5',
    textColor: '#333333',
    loadingColor: '#1890ff',
  },
  legacyFormatHandler: 'hint',
  enableLazyLoad: true,
  maxFileSize: 100 * 1024 * 1024,
  requestTimeout: 30000,
};

export class FilePreviewEngine implements FilePreviewInstance {
  private container: HTMLElement;
  private props: FilePreviewProps;
  private config: GlobalConfig;
  private state: PreviewState;
  private fileInfo: FileInfo | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, props: FilePreviewProps) {
    this.container = container;
    this.props = props;
    this.config = { ...DEFAULT_CONFIG, ...props.config };
    this.state = {
      loading: false,
      error: null,
      fileInfo: null,
      rendered: false,
    };

    this.setupContainer();
    this.init();
  }

  private setupContainer(): void {
    const width = formatDimension(
      this.props.width ?? this.config.defaultWidth,
      String(DEFAULT_CONFIG.defaultWidth)
    );
    const height = formatDimension(
      this.props.height ?? this.config.defaultHeight,
      String(DEFAULT_CONFIG.defaultHeight)
    );

    this.container.style.width = width;
    this.container.style.height = height;
    this.container.className = this.props.className || 'ufp-container';

    if (this.props.style) {
      Object.entries(this.props.style).forEach(([key, value]) => {
        this.container.style.setProperty(key, String(value));
      });
    }

    this.setupResizeObserver();
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.state.rendered && this.fileInfo) {
        this.handleResize();
      }
    });

    this.resizeObserver.observe(this.container);
  }

  private handleResize(): void {
    // Subclasses can override this for resize handling
  }

  private async init(): Promise<void> {
    if (!this.props.src) {
      this.handleError(
        createErrorInternal(
          ErrorCode.NETWORK_ERROR,
          'No source URL provided'
        )
      );
      return;
    }

    this.setState({ loading: true });
    this.showLoading();

    try {
      this.fileInfo = getFileInfo(this.props.src);
      
      if (this.props.fileType) {
        this.fileInfo.fileType = this.props.fileType;
      }

      const validation = await validateFile(
        this.props.src,
        this.config.requestTimeout
      );

      if (!validation.valid) {
        throw createErrorInternal(
          ErrorCode.NETWORK_ERROR,
          'Unable to access file. Please check the URL and CORS settings.'
        );
      }

      if (validation.size && this.config.maxFileSize && validation.size > this.config.maxFileSize) {
        throw createErrorInternal(
          ErrorCode.PARSE_ERROR,
          `File size (${(validation.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(this.config.maxFileSize! / 1024 / 1024).toFixed(2)}MB)`
        );
      }

      if (isLegacyFormat(this.fileInfo.fileType)) {
        await this.handleLegacyFormat();
        return;
      }

      if (!isSupportedFormat(this.fileInfo.fileType)) {
        throw createErrorInternal(
          ErrorCode.UNSUPPORTED_FORMAT,
          `Unsupported file format: ${this.fileInfo.extension}`
        );
      }

      this.setState({ fileInfo: this.fileInfo });

      await this.render();
    } catch (error) {
      this.handleError(error as PreviewError);
    }
  }

  private async handleLegacyFormat(): Promise<void> {
    if (!this.fileInfo) return;

    const legacyInfo: LegacyFormatInfo = {
      originalUrl: this.fileInfo.url,
      fileType: this.fileInfo.fileType as 'doc' | 'ppt',
      suggestedAction: 'convert',
    };

    this.props.onLegacyFormat?.(legacyInfo);

    switch (this.config.legacyFormatHandler) {
      case 'hint':
        this.showLegacyHint(legacyInfo);
        break;

      case 'convert-service-url':
        if (this.config.convertServiceUrl) {
          const convertedUrl = `${this.config.convertServiceUrl}?url=${encodeURIComponent(this.fileInfo.url)}`;
          this.fileInfo = {
            ...this.fileInfo,
            url: convertedUrl,
            fileType: 'pdf',
            extension: 'pdf',
          };
          await this.render();
        } else {
          this.showLegacyHint(legacyInfo);
        }
        break;

      case 'custom':
        this.showLegacyHint(legacyInfo);
        break;

      default:
        this.showLegacyHint(legacyInfo);
    }

    this.setState({
      loading: false,
      error: {
        code: ErrorCode.LEGACY_FORMAT,
        message: `Legacy format detected: ${this.fileInfo.extension}`,
        fileUrl: this.fileInfo.url,
      },
    });
  }

  private showLegacyHint(info: LegacyFormatInfo): void {
    this.container.innerHTML = '';
    const hintElement = createLegacyFormatHint(
      this.fileInfo!,
      info.fallbackUrl
    );

    const convertBtn = hintElement.querySelector('.ufp-legacy-convert-btn');
    if (convertBtn) {
      convertBtn.addEventListener('click', () => {
        this.props.onLegacyFormat?.({
          ...info,
          suggestedAction: 'convert',
        });
      });
    }

    this.container.appendChild(hintElement);
  }

  private async render(): Promise<void> {
    if (!this.fileInfo || this.isDestroyed) return;

    this.container.innerHTML = '';
    this.container.classList.add('ufp-loading');

    try {
      await renderFile({
        container: this.container,
        fileInfo: this.fileInfo,
        config: this.config,
        width: this.props.width ?? this.config.defaultWidth!,
        height: this.props.height ?? this.config.defaultHeight!,
        onProgress: (_progress) => {
          // Handle progress if needed
        },
        onComplete: () => {
          this.setState({ loading: false, rendered: true });
          this.container.classList.remove('ufp-loading');
          this.props.onLoad?.();
        },
        onError: (error) => {
          this.handleError(error);
        },
      });
    } catch (error) {
      this.handleError(error as PreviewError);
    }
  }

  private showLoading(): void {
    this.container.innerHTML = '';

    if (this.props.loader) {
      if (typeof this.props.loader === 'string') {
        this.container.innerHTML = this.props.loader;
      } else if (typeof this.props.loader === 'function') {
        this.container.appendChild(this.props.loader());
      } else {
        this.container.appendChild(this.props.loader.cloneNode(true));
      }
    } else {
      const loadingEl = createLoadingElement(this.config.theme);
      this.container.appendChild(loadingEl);
    }
  }

  private handleError(error: PreviewError): void {
    this.setState({ loading: false, error });
    this.props.onError?.(error);

    this.container.innerHTML = '';
    this.container.classList.remove('ufp-loading');
    this.container.classList.add('ufp-error');

    if (this.props.error) {
      if (typeof this.props.error === 'string') {
        this.container.innerHTML = this.props.error;
      } else if (typeof this.props.error === 'function') {
        this.container.appendChild(this.props.error(error));
      } else {
        this.container.appendChild(this.props.error.cloneNode(true));
      }
    } else {
      const errorEl = createErrorElement(error, this.config.theme);
      this.container.appendChild(errorEl);
    }
  }

  private setState(newState: Partial<PreviewState>): void {
    this.state = { ...this.state, ...newState };
  }

  getState(): PreviewState {
    return { ...this.state };
  }

  async refresh(): Promise<void> {
    if (this.fileInfo) {
      destroyRenderer(this.container, this.fileInfo.fileType);
    }
    await this.init();
  }

  destroy(): void {
    this.isDestroyed = true;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.fileInfo) {
      destroyRenderer(this.container, this.fileInfo.fileType);
    }

    this.container.innerHTML = '';
  }

  resize(width: string | number, height: string | number): void {
    this.container.style.width = formatDimension(width, String(DEFAULT_CONFIG.defaultWidth));
    this.container.style.height = formatDimension(height, String(DEFAULT_CONFIG.defaultHeight));
  }
}

function createErrorInternal(code: ErrorCode, message: string): PreviewError {
  return { code, message };
}

export function createPreview(
  container: HTMLElement,
  props: FilePreviewProps
): FilePreviewInstance {
  return new FilePreviewEngine(container, props);
}

export { DEFAULT_CONFIG };
