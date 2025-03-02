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
    baseUrl: config.HOST ?? 'http://localhost:3000',
    docsUrl: '/api/docs',
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
      },
    },
  })

  return <SwaggerUI spec={openApiDocument} />
}

export default App
