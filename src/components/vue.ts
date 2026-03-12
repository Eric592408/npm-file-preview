import FilePreview from './FilePreview.vue';
import type { App } from 'vue';

export { FilePreview };

export default {
  install(app: App) {
    app.component('FilePreview', FilePreview);
  },
};
