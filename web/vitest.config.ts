import { defineConfig } from 'vitest/config';

// Limit vitest test discovery to unit tests only so Playwright e2e specs
// (which import `@playwright/test`) are not executed by vitest's runner.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{js,ts,tsx}', 'tests/unit/**/*.spec.{js,ts,tsx}'],
    exclude: ['tests/e2e/**']
  }
});
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setupTests.ts'
  }
});
