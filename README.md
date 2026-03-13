# @eric_bs/universal-file-preview

[![npm version](https://img.shields.io/npm/v/@eric_bs/universal-file-preview.svg)](https://www.npmjs.com/package/@eric_bs/universal-file-preview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

通用文件预览库，支持 PDF、图片、Office 文档等多种格式。基于 TypeScript 开发，提供 Vue 3 和 Web Component 集成。

## 目录

- [功能特性](#功能特性)
- [安装](#安装)
- [快速开始](#快速开始)
- [支持的文件格式](#支持的文件格式)
- [API 参考](#api-参考)
- [配置选项](#配置选项)
- [错误处理](#错误处理)
- [自定义样式](#自定义样式)
- [常见问题](#常见问题)
- [English Documentation](#english-documentation)

## 功能特性

- PDF 预览 - 支持分页、缩放，基于 pdfjs-dist
- 图片预览 - 支持 jpg、png、gif、webp、svg 等格式，支持懒加载
- 文本/Markdown - 纯文本和 Markdown 渲染
- Office 文档 - 支持 DOCX、PPTX、XLSX 预览
- 旧格式处理 - 对 .doc 和 .ppt 格式提供降级提示
- 框架无关 - 核心逻辑与框架解耦，可在任何环境中使用
- 自动依赖 - 所有必需依赖自动安装
- TypeScript - 完整的类型支持
- Web Component - 原生自定义元素支持

## 安装

```bash
npm install @eric_bs/universal-file-preview
```

所有必需的依赖（pdfjs-dist、marked、docx-preview、pptx-preview、xlsx）会自动安装。

注意：如果使用 Vue 3，请确保项目中已安装 `vue@^3.3.0`。

## 快速开始

### Vue 3

#### 1. 引入样式

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import '@eric_bs/universal-file-preview/style.css'

createApp(App).mount('#app')
```

#### 2. 组件使用

```vue
<template>
  <FilePreview
    :src="fileUrl"
    :file-type="fileType"
    :config="config"
    @error="handleError"
    @load="handleLoad"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FilePreview } from '@eric_bs/universal-file-preview/vue'
import type { FileType, GlobalConfig } from '@eric_bs/universal-file-preview'

const fileUrl = ref('https://example.com/document.pdf')
const fileType = ref<FileType>('pdf')

const config: GlobalConfig = {
  width: '100%',
  defaultHeight: '600px',
  theme: {
    primaryColor: '#1890ff',
    errorColor: '#ff4d4f',
    backgroundColor: '#f5f5f5'
  }
}

const handleError = (error: any) => {
  console.error('预览错误:', error)
}

const handleLoad = () => {
  console.log('文件加载成功')
}
</script>
```

### Web Component

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>文件预览示例</title>
</head>
<body>
  <div id="preview-container"></div>

  <script type="module">
    import { createPreview } from '@eric_bs/universal-file-preview'
    import '@eric_bs/universal-file-preview/style.css'

    const container = document.getElementById('preview-container')
    
    const preview = createPreview(container, {
      src: 'https://example.com/document.pdf',
      fileType: 'pdf',
      width: '100%',
      height: '600px',
      onError: (error) => console.error('预览错误:', error),
      onLoad: () => console.log('文件加载成功')
    })

    // 销毁实例
    // preview.destroy()
  </script>
</body>
</html>
```

### 本地文件预览

使用 `URL.createObjectURL` 创建临时 URL：

```vue
<script setup>
import { ref } from 'vue'
import { FilePreview } from '@eric_bs/universal-file-preview/vue'
import '@eric_bs/universal-file-preview/style.css'

const fileUrl = ref('')
const fileType = ref('')

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    fileUrl.value = URL.createObjectURL(file)
    // 根据扩展名判断文件类型
    const ext = file.name.split('.').pop().toLowerCase()
    const typeMap = {
      pdf: 'pdf', png: 'image', jpg: 'image', jpeg: 'image',
      gif: 'image', webp: 'image', svg: 'image', md: 'markdown',
      txt: 'text', docx: 'docx', xlsx: 'xlsx', pptx: 'pptx'
    }
    fileType.value = typeMap[ext] || 'text'
  }
}
</script>

<template>
  <input type="file" @change="handleFileChange" />
  <FilePreview v-if="fileUrl" :src="fileUrl" :file-type="fileType" />
</template>
```

## 支持的文件格式

| 格式 | 扩展名 | 使用的库 | 说明 |
|------|--------|----------|------|
| PDF | .pdf | pdfjs-dist | 支持分页、缩放 |
| 图片 | .jpg, .jpeg, .png, .gif, .webp, .svg, .bmp, .ico | 原生 img | 支持懒加载 |
| 文本 | .txt, .log, .csv | 原生渲染 | 纯文本显示 |
| Markdown | .md, .markdown | marked | 支持 Markdown 语法 |
| Word | .docx | docx-preview | 仅支持新版格式 |
| PowerPoint | .pptx | pptx-preview | 仅支持新版格式 |
| Excel | .xlsx, .xls | xlsx | 支持工作表切换 |

注意：旧版 Office 格式（.doc、.ppt）不支持直接预览，需要在服务端转换为新版格式或 PDF。

## API 参考

### Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| src | string | 是 | - | 文件的 URL 地址 |
| fileType | FileType | 否 | 自动检测 | 文件类型 |
| width | string \| number | 否 | '100%' | 预览容器宽度 |
| height | string \| number | 否 | '500px' | 预览容器高度 |
| className | string | 否 | - | 自定义 CSS 类名 |
| config | GlobalConfig | 否 | - | 全局配置对象 |

#### FileType 类型

```typescript
type FileType = 'pdf' | 'image' | 'markdown' | 'text' | 'docx' | 'xlsx' | 'pptx'
```

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| onError | (error: PreviewError) | 预览出错时触发 |
| onLoad | - | 文件加载成功时触发 |
| onProgress | (progress: number) | 加载进度变化时触发（0-100） |

### Slots

```vue
<FilePreview :src="fileUrl">
  <!-- 自定义加载状态 -->
  <template #loader>
    <div class="custom-loader">加载中...</div>
  </template>

  <!-- 自定义错误状态 -->
  <template #error="{ error }">
    <div class="custom-error">
      <h3>{{ error.code }}</h3>
      <p>{{ error.message }}</p>
    </div>
  </template>
</FilePreview>
```

## 配置选项

```typescript
interface GlobalConfig {
  // 容器宽度
  width?: string | number

  // 容器默认高度
  defaultHeight?: string | number

  // 主题配置
  theme?: {
    primaryColor?: string
    errorColor?: string
    backgroundColor?: string
    textColor?: string
    loadingColor?: string
  }

  // 错误回调
  onError?: (error: PreviewError) => void

  // 加载完成回调
  onLoad?: () => void

  // 进度回调
  onProgress?: (progress: number) => void

  // PDF Worker 地址（默认使用 CDN）
  pdfWorkerSrc?: string

  // 是否启用懒加载
  enableLazyLoad?: boolean

  // 最大文件大小（字节）
  maxFileSize?: number

  // 请求超时时间（毫秒）
  requestTimeout?: number
}
```

### 配置示例

```typescript
const config: GlobalConfig = {
  width: '100%',
  defaultHeight: '800px',
  theme: {
    primaryColor: '#1890ff',
    errorColor: '#ff4d4f'
  },
  enableLazyLoad: true,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  requestTimeout: 30000
}
```

## 错误处理

### 错误码

```typescript
enum ErrorCode {
  NETWORK_ERROR       = 'NETWORK_ERROR'       // 网络错误
  CORS_ERROR          = 'CORS_ERROR'          // 跨域错误
  FILE_NOT_FOUND      = 'FILE_NOT_FOUND'      // 文件不存在
  UNSUPPORTED_FORMAT  = 'UNSUPPORTED_FORMAT'  // 不支持的格式
  PARSE_ERROR         = 'PARSE_ERROR'         // 解析错误
  RENDER_ERROR        = 'RENDER_ERROR'        // 渲染错误
  TIMEOUT             = 'TIMEOUT'             // 请求超时
  UNKNOWN             = 'UNKNOWN'             // 未知错误
}
```

### 错误对象

```typescript
interface PreviewError {
  code: ErrorCode        // 错误码
  message: string        // 错误信息
  originalError?: Error  // 原始错误对象
  url?: string           // 文件 URL
}
```

### 错误处理示例

```vue
<template>
  <FilePreview :src="fileUrl" @error="handleError">
    <template #error="{ error }">
      <div class="error-container">
        <h3>{{ getErrorTitle(error.code) }}</h3>
        <p>{{ error.message }}</p>
        <button v-if="canRetry(error.code)" @click="retry">重试</button>
      </div>
    </template>
  </FilePreview>
</template>

<script setup>
const handleError = (error) => {
  console.error('预览错误:', error.code, error.message)
}

const getErrorTitle = (code) => {
  const titles = {
    NETWORK_ERROR: '网络连接失败',
    CORS_ERROR: '跨域访问被拒绝',
    FILE_NOT_FOUND: '文件不存在',
    UNSUPPORTED_FORMAT: '不支持的文件格式',
    PARSE_ERROR: '文件解析失败',
    TIMEOUT: '加载超时'
  }
  return titles[code] || '预览失败'
}

const canRetry = (code) => ['NETWORK_ERROR', 'TIMEOUT'].includes(code)
</script>
```

## 自定义样式

### CSS 变量

```css
:root {
  --ufp-primary-color: #1890ff;
  --ufp-error-color: #ff4d4f;
  --ufp-bg-color: #f5f5f5;
  --ufp-text-color: #333333;
  --ufp-border-color: #e8e8e8;
  --ufp-loading-color: #1890ff;
}
```

### 自定义类名

```vue
<FilePreview :src="fileUrl" class-name="custom-preview" />
```

```css
.custom-preview {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## 常见问题

### PDF 预览显示空白或报错

原因：PDF 文件跨域或 Worker 加载失败

解决方案：
- 确保 PDF 文件所在服务器配置了正确的 CORS 响应头
- 通过 `config.pdfWorkerSrc` 指定自定义 Worker 地址

```typescript
const config = {
  pdfWorkerSrc: '/static/pdf.worker.min.js'
}
```

### DOCX/XLSX/PPTX 预览失败

原因：文件格式不正确或文件损坏

解决方案：
- 确保文件是有效的新版 Office 格式（.docx/.xlsx/.pptx）
- 旧版格式（.doc/.xls/.ppt）不支持，需要先转换

### 跨域问题

原因：目标服务器未配置 CORS

解决方案：在 S3 或其他存储服务中配置 CORS：

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

### 文件类型检测不准确

解决方案：手动指定 `fileType` 属性

```vue
<FilePreview :src="fileUrl" file-type="pdf" />
```

## 浏览器支持

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 13+ |
| Edge | 80+ |

## 开发

```bash
# 安装依赖
npm install

# 构建库
npm run build

# 类型检查
npm run typecheck

# 运行 Demo
cd examples/vue
npm install
npm run dev
```

## 许可证

MIT License

## 相关链接

- [GitHub Repository](https://github.com/Eric592408/npm-file-preview)
- [npm Package](https://www.npmjs.com/package/@eric_bs/universal-file-preview)
- [Issue Tracker](https://github.com/Eric592408/npm-file-preview/issues)

---

# English Documentation

[![npm version](https://img.shields.io/npm/v/@eric_bs/universal-file-preview.svg)](https://www.npmjs.com/package/@eric_bs/universal-file-preview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A universal file preview library for web applications, supporting PDF, images, Office documents and more. Built with TypeScript, provides Vue 3 and Web Component integrations.

## Installation

```bash
npm install @eric_bs/universal-file-preview
```

All required dependencies (pdfjs-dist, marked, docx-preview, pptx-preview, xlsx) are installed automatically.

Note: For Vue 3 projects, ensure `vue@^3.3.0` is installed.

## Quick Start

### Vue 3

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import '@eric_bs/universal-file-preview/style.css'

createApp(App).mount('#app')
```

```vue
<template>
  <FilePreview
    :src="fileUrl"
    :file-type="fileType"
    :config="config"
    @error="handleError"
    @load="handleLoad"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FilePreview } from '@eric_bs/universal-file-preview/vue'
import type { FileType, GlobalConfig } from '@eric_bs/universal-file-preview'

const fileUrl = ref('https://example.com/document.pdf')
const fileType = ref<FileType>('pdf')

const config: GlobalConfig = {
  width: '100%',
  defaultHeight: '600px'
}

const handleError = (error: any) => console.error('Preview error:', error)
const handleLoad = () => console.log('File loaded')
</script>
```

### Web Component

```html
<div id="preview-container"></div>

<script type="module">
  import { createPreview } from '@eric_bs/universal-file-preview'
  import '@eric_bs/universal-file-preview/style.css'

  const container = document.getElementById('preview-container')
  const preview = createPreview(container, {
    src: 'https://example.com/document.pdf',
    fileType: 'pdf',
    width: '100%',
    height: '600px'
  })
</script>
```

## Supported File Formats

| Format | Extensions | Library |
|--------|------------|---------|
| PDF | .pdf | pdfjs-dist |
| Images | .jpg, .jpeg, .png, .gif, .webp, .svg, .bmp, .ico | Native img |
| Text | .txt, .log, .csv | Native rendering |
| Markdown | .md, .markdown | marked |
| Word | .docx | docx-preview |
| PowerPoint | .pptx | pptx-preview |
| Excel | .xlsx, .xls | xlsx |

Note: Legacy Office formats (.doc, .ppt) are not supported. Convert them to modern formats or PDF on the server.

## API Reference

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| src | string | Yes | - | File URL |
| fileType | FileType | No | Auto-detect | File type |
| width | string \| number | No | '100%' | Container width |
| height | string \| number | No | '500px' | Container height |
| className | string | No | - | Custom CSS class |
| config | GlobalConfig | No | - | Configuration object |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| onError | (error: PreviewError) | Fired on error |
| onLoad | - | Fired when loaded |
| onProgress | (progress: number) | Fired on progress (0-100) |

### Slots

```vue
<FilePreview :src="fileUrl">
  <template #loader>
    <div>Loading...</div>
  </template>
  <template #error="{ error }">
    <div>{{ error.message }}</div>
  </template>
</FilePreview>
```

## Configuration

```typescript
interface GlobalConfig {
  width?: string | number
  defaultHeight?: string | number
  theme?: {
    primaryColor?: string
    errorColor?: string
    backgroundColor?: string
    textColor?: string
    loadingColor?: string
  }
  onError?: (error: PreviewError) => void
  onLoad?: () => void
  onProgress?: (progress: number) => void
  pdfWorkerSrc?: string
  enableLazyLoad?: boolean
  maxFileSize?: number
  requestTimeout?: number
}
```

## Error Codes

```typescript
enum ErrorCode {
  NETWORK_ERROR       = 'NETWORK_ERROR'
  CORS_ERROR          = 'CORS_ERROR'
  FILE_NOT_FOUND      = 'FILE_NOT_FOUND'
  UNSUPPORTED_FORMAT  = 'UNSUPPORTED_FORMAT'
  PARSE_ERROR         = 'PARSE_ERROR'
  RENDER_ERROR        = 'RENDER_ERROR'
  TIMEOUT             = 'TIMEOUT'
  UNKNOWN             = 'UNKNOWN'
}
```

## Styling

```css
:root {
  --ufp-primary-color: #1890ff;
  --ufp-error-color: #ff4d4f;
  --ufp-bg-color: #f5f5f5;
  --ufp-text-color: #333333;
  --ufp-border-color: #e8e8e8;
}
```

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 13+ |
| Edge | 80+ |

## License

MIT License

## Links

- [GitHub Repository](https://github.com/Eric592408/npm-file-preview)
- [npm Package](https://www.npmjs.com/package/@eric_bs/universal-file-preview)
- [Issue Tracker](https://github.com/Eric592408/npm-file-preview/issues)
