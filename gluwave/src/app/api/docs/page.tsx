import { API_KEY_HEADER_NAME } from '@/auth'
import config from '@/config.mjs'
import { appRouter } from '@/server'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { generateOpenApiDocument } from 'trpc-to-openapi'

const App = () => {
  const openApiDocument = generateOpenApiDocument(appRouter, {
    title: 'Gluwvave OpenAPI',
    description: '',
    version: '0.1.0',
    baseUrl: new URL('/api', config.HOST).toString(),
    docsUrl: '/api/docs',
    securitySchemes: {
      [API_KEY_HEADER_NAME]: {
        type: 'apiKey',
        in: 'header',
        name: API_KEY_HEADER_NAME,
      },
    },
  })

  return <SwaggerUI spec={openApiDocument} />
}

export default App
