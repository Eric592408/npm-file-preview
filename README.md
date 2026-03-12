# Universal File Preview

[![npm version](https://img.shields.io/npm/v/universal-file-preview.svg)](https://www.npmjs.com/package/universal-file-preview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A universal file preview library for web applications, supporting multiple file formats including PDF, images, Office documents, and more. Built with TypeScript and provides Vue 3 and Web Component integrations.

## Features

- 📄 **PDF Preview** - Full support with pagination and zoom using pdfjs-dist
- 🖼️ **Image Preview** - Support for jpg, png, gif, webp, svg, and more with lazy loading
- 📝 **Text/Markdown** - Plain text and markdown rendering with syntax highlighting
- 📊 **Office Documents** - DOCX, PPTX, and XLSX preview support
- 🔄 **Legacy Format Handling** - Graceful degradation for .doc and .ppt formats
- 🎨 **Framework Agnostic** - Core logic is framework-independent
- ⚡ **Dynamic Imports** - Heavy dependencies are loaded on-demand for optimal bundle size
- 🎯 **TypeScript** - Full TypeScript support with strict mode
- 🌐 **Web Component** - Native custom element support for any framework

## Installation

```bash
npm install universal-file-preview

# Install required peer dependencies based on your needs
npm install pdfjs-dist      # For PDF preview
npm install marked          # For Markdown preview
npm install docx-preview    # For DOCX preview
npm install pptx-preview    # For PPTX preview
npm install xlsx            # For XLSX preview
```

## Quick Start

### Vue 3

```vue
<template>
  <FilePreview
    :src="fileUrl"
    width="100%"
    height="600px"
    @error="handleError"
    @load="handleLoad"
  />
</template>

<script setup>
import { FilePreview } from 'universal-file-preview/vue';
import 'universal-file-preview/style.css';

const fileUrl = 'https://your-s3-bucket.s3.amazonaws.com/document.pdf';

const handleError = (error) => {
  console.error('Preview error:', error);
};

const handleLoad = () => {
  console.log('File loaded successfully');
};
</script>
```

### Web Component

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { registerWebComponent } from 'universal-file-preview/web-component';
    import 'universal-file-preview/style.css';
    registerWebComponent();
  </script>
</head>
<body>
  <universal-file-preview
    src="https://your-s3-bucket.s3.amazonaws.com/document.pdf"
    width="100%"
    height="600px"
  ></universal-file-preview>
</body>
</html>
```

### Framework-Agnostic Usage

```typescript
import { createPreview } from 'universal-file-preview';
import 'universal-file-preview/style.css';

const container = document.getElementById('preview-container');
const preview = createPreview(container, {
  src: 'https://your-s3-bucket.s3.amazonaws.com/document.pdf',
  width: '100%',
  height: '600px',
  onError: (error) => console.error('Preview error:', error),
  onLoad: () => console.log('File loaded successfully'),
});

// Later, you can refresh or destroy
preview.refresh();
preview.destroy();
```

## API Reference

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `src` | `string` | Yes | - | The S3 CDN URL of the file to preview |
| `width` | `string \| number` | No | `'100%'` | Width of the preview container |
| `height` | `string \| number` | No | `'500px'` | Height of the preview container |
| `className` | `string` | No | `'ufp-container'` | Custom CSS class name |
| `style` | `object` | No | - | Custom inline styles |
| `config` | `GlobalConfig` | No | - | Global configuration object |
| `loader` | `slot/component` | No | Default spinner | Custom loading placeholder |
| `error` | `slot/component` | No | Default error | Custom error placeholder |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `onError` | `PreviewError` | Fired when an error occurs |
| `onLoad` | - | Fired when the file is successfully loaded |
| `onLegacyFormat` | `LegacyFormatInfo` | Fired when a legacy format (.doc/.ppt) is detected |

### Configuration Options

```typescript
interface GlobalConfig {
  defaultWidth?: string | number;
  defaultHeight?: string | number;
  theme?: {
    primaryColor?: string;
    errorColor?: string;
    backgroundColor?: string;
    textColor?: string;
    loadingColor?: string;
  };
  legacyFormatHandler?: 'hint' | 'convert-service-url' | 'custom';
  convertServiceUrl?: string;
  pdfWorkerSrc?: string;
  enableLazyLoad?: boolean;
  maxFileSize?: number;
  requestTimeout?: number;
}
```

## Supported File Formats

| Format | Extensions | Library Used |
|--------|------------|--------------|
| PDF | `.pdf` | pdfjs-dist |
| Images | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`, `.tiff` | Native `<img>` |
| Text | `.txt`, `.log`, `.csv` | Native rendering |
| Markdown | `.md`, `.markdown` | marked |
| Word | `.docx` | docx-preview |
| PowerPoint | `.pptx` | pptx-preview |
| Excel | `.xlsx`, `.xls` | xlsx |

## Legacy Format Handling (.doc / .ppt)

Due to the complexity of parsing legacy binary formats (.doc, .ppt) in the browser, this library implements a **degradation strategy** instead of attempting direct rendering.

### Handling Strategies

1. **`hint` (Default)**: Display a user-friendly message suggesting conversion
2. **`convert-service-url`**: Automatically redirect to a conversion service
3. **`custom`**: Trigger a custom event for parent component handling

### Example: Custom Handler

```vue
<template>
  <FilePreview
    :src="fileUrl"
    :config="{ legacyFormatHandler: 'custom' }"
    @legacy-format="handleLegacyFormat"
  />
</template>

<script setup>
const handleLegacyFormat = (info) => {
  // info.fileType: 'doc' | 'ppt'
  // info.originalUrl: the original file URL
  // You can:
  // 1. Show a conversion dialog
  // 2. Call your backend conversion service
  // 3. Redirect to a converted PDF version
  console.log('Legacy format detected:', info);
};
</script>
```

### Recommended Solution

For production use, we recommend:
1. Pre-convert .doc/.ppt files to .docx/.pptx or PDF on your backend
2. Store both versions in S3
3. Use the `fallbackUrl` option to provide the converted version

## S3 CORS Configuration

Ensure your S3 bucket has proper CORS configuration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

## Error Handling

The library provides detailed error codes for different scenarios:

```typescript
enum ErrorCode {
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
```

### Custom Error Rendering

```vue
<template>
  <FilePreview :src="fileUrl">
    <template #error="{ error }">
      <div class="custom-error">
        <h3>Oops! {{ error.code }}</h3>
        <p>{{ error.message }}</p>
      </div>
    </template>
  </FilePreview>
</template>
```

## Styling

### CSS Variables

Override default styles using CSS variables:

```css
:root {
  --ufp-primary-color: #1890ff;
  --ufp-error-color: #ff4d4f;
  --ufp-bg-color: #f5f5f5;
  --ufp-text-color: #333333;
  --ufp-border-color: #e8e8e8;
}
```

### Custom Class Names

```vue
<FilePreview
  :src="fileUrl"
  class-name="my-custom-preview"
/>
```

```css
.my-custom-preview {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

## Performance Considerations

- **Dynamic Imports**: Heavy libraries (pdfjs-dist, docx-preview, etc.) are loaded on-demand
- **Lazy Loading**: Images support native lazy loading by default
- **Virtual Scrolling**: PDF pages are rendered on-demand
- **Bundle Size**: Core library is lightweight; only load what you need

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Type checking
npm run typecheck
```

## Demo

We provide demo projects for different frameworks in the `examples` directory:

| Framework | Path | Port |
|-----------|------|------|
| Vue 3 | `examples/vue` | 5174 |
| Web Component | `examples/web-component` | 5176 |

### Running Demos

```bash
# Vue 3 Demo
cd examples/vue
npm install
npm run dev

# Web Component Demo
cd examples/web-component
npm install
npm run dev
```

## License

MIT License © [wf.j](https://github.com/Eric592408)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

## Links

- [GitHub Repository](https://github.com/Eric592408/npm-file-preview)
- [npm Package](https://www.npmjs.com/package/universal-file-preview)
- [Report an Issue](https://github.com/Eric592408/npm-file-preview/issues)
