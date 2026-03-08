/**
 * Multi-user integration tests for @tanstack/react-realtime.
 *
 * Tests run against the React app on localhost:3000 via the 'chromium' project.
 * All scenarios are defined in helpers/scenarios.ts and shared with the Solid
 * suite so both frameworks are exercised against identical assertions.
 */

import { registerScenarios } from './helpers/scenarios.js'

registerScenarios()
