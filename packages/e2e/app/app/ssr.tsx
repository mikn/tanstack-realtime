/// <reference types="vinxi/types/server" />
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/start/server'
import { createAppRouter } from './router'

export default createStartHandler({
  createRouter: createAppRouter,
})(defaultStreamHandler)
