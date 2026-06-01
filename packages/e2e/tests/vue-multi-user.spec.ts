/**
 * Multi-user integration tests for @realtimejs/vue.
 *
 * Tests run against the Vue app on localhost:3002 via the 'vue-chromium' project.
 * All scenarios are defined in helpers/scenarios.ts and shared with the React
 * and Solid suites so all three frameworks are exercised against identical
 * assertions.
 */

import { registerScenarios } from './helpers/scenarios.js'

registerScenarios()
