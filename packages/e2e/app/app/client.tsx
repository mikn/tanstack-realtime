/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { createAppRouter } from './router'

const router = createAppRouter()

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
)
