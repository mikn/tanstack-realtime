/**
 * Multi-user integration tests for @tanstack/solid-realtime.
 *
 * Tests run against the Solid app on localhost:3001 via the 'solid-chromium'
 * project.  All scenarios are defined in helpers/scenarios.ts and shared with
 * the React suite so both frameworks are exercised against identical assertions.
 */

import { registerScenarios } from './helpers/scenarios.js'

registerScenarios()
