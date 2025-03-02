import config from '@/config.mjs'
import { generateOpenApiDocument } from 'trpc-to-openapi'

import { appRouter } from './index'

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'GluWave API',
  description: 'API for GluWave - Glucose, Insulin, and Carbohydrate tracking',
  version: '1.0.0',
  baseUrl: config.HOST,
  docsUrl: '/api/docs',
})
