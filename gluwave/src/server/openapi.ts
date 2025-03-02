import { generateOpenApiDocument } from 'trpc-to-openapi'

import { appRouter } from './index'

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'GluWave API',
  description: 'API for GluWave - Glucose, Insulin, and Carbohydrate tracking',
  version: '1.0.0',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  docsUrl: '/api/docs',
})
