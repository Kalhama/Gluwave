import { createServerSideHelpers } from '@trpc/react-query/server'
import superjson from 'superjson'

import { createContext } from './context'
import {
  ZDeleteApiKeyOutputSchema,
  ZDeleteApiKeySchema,
  deleteApiKey,
} from './routes/delete-api-key'
import {
  ZDeteleCarbohydrateOutputSchema,
  ZDeteleCarbohydrateSchema,
  deleteCarbohydrate,
} from './routes/delete-carbohydrate'
import {
  ZDeleteGlucoseOutputSchema,
  ZDeleteGlucoseSchema,
  deleteGlucose,
} from './routes/delete-glucose'
import {
  ZDeleteInsulinOutputSchema,
  ZDeleteInsulinSchema,
  deleteInsulin,
} from './routes/delete-insulin'
import {
  ZGetApiKeyOutputSchema,
  ZGetApiKeySchema,
  getApiKey,
} from './routes/get-api-key'
import {
  ZGetCarbohydrateAttributedOutputSchema,
  ZGetCarbohydrateAttributedSchema,
  getCarbohydrateAttributed,
} from './routes/get-carbohydrate-attributed'
import {
  ZGetCarbohydratesRateObservedOutputSchema,
  ZGetCarbohydratesRateObservedSchema,
  getCarbohydratesRateObserved,
} from './routes/get-carbohydrates-rate-observed'
import {
  ZGetCarbohydratesRateReportedOutputSchema,
  ZGetCarbohydratesRateReportedSchema,
  getCarbohydratesRateReported,
} from './routes/get-carbohydrates-rate-reported'
import {
  ZGetGlucoseOutputSchema,
  ZGetGlucoseSchema,
  getGlucose,
} from './routes/get-glucose'
import {
  ZGetGlucoseLastOutputSchema,
  ZGetGlucoseLastSchema,
  getGlucoseLast,
} from './routes/get-glucose-last'
import {
  ZGetInsulinOutputSchema,
  ZGetInsulinSchema,
  getInsulin,
} from './routes/get-insulin'
import {
  ZGetInsulinOOutputnBoard,
  ZGetInsulinOnBoard,
  getInsulinOnBoard,
} from './routes/get-insulin-on-board'
import {
  ZPostApiKeyOutputSchema,
  ZPostApiKeySchema,
  postApiKey,
} from './routes/post-api-key'
import { postCarbohydrate } from './routes/post-carbohydrate'
import {
  ZPostCarbohydrateOutputSchema,
  ZPostCarbohydrateSchema,
} from './routes/post-carbohydrate.schema'
import { postGlucose } from './routes/post-glucose'
import {
  ZPostGlucoseOutputSchema,
  ZPostGlucoseSchema,
} from './routes/post-glucose.schema'
import { postInsulin } from './routes/post-insulin'
import {
  ZPostInsulinOutputSchema,
  ZPostInsulinSchema,
} from './routes/post-insulin.schema'
import { postProfile } from './routes/post-profile'
import {
  ZPostProfileOutputSchema,
  ZPostProfileSchema,
} from './routes/post-profile.schema'
import { protectedProcedure, router } from './trpc'

export const appRouter = router({
  apikey: router({
    get: protectedProcedure
      .meta({
        openapi: {
          method: 'GET',
          path: '/user/api-key',
          protect: true,
          summary: 'Get all user api keys',
          description: 'Get all api keys for the authenticated user',
        },
      })
      .input(ZGetApiKeySchema)
      .output(ZGetApiKeyOutputSchema)
      .query(getApiKey),
    post: protectedProcedure
      .meta({
        openapi: {
          method: 'POST',
          path: '/user/api-key',
          protect: true,
          summary: 'Create an API key',
          description: 'Generate a new API key for the authenticated user',
        },
      })
      .input(ZPostApiKeySchema)
      .output(ZPostApiKeyOutputSchema)
      .mutation(postApiKey),
    delete: protectedProcedure
      .meta({
        openapi: {
          method: 'DELETE',
          path: '/user/api-key/{id}',
          protect: true,
          summary: 'Delete an API key',
          description: 'Delete a specific API key by ID',
        },
      })
      .input(ZDeleteApiKeySchema)
      .output(ZDeleteApiKeyOutputSchema)
      .mutation(deleteApiKey),
  }),
  user: router({
    postProfile: protectedProcedure
      .meta({
        openapi: {
          method: 'POST',
          path: '/user/profile',
          protect: true,
          summary: 'Update user profile',
          description: "Update the authenticated user's profile information",
        },
      })
      .input(ZPostProfileSchema)
      .output(ZPostProfileOutputSchema)
      .mutation(postProfile),
  }),
  analysis: router({
    getCarbohydratesRateObserved: protectedProcedure
      .meta({
        openapi: {
          method: 'GET',
          path: '/analysis/carbohydrates-rate-observed',
          protect: true,
          summary: 'Get observed carbohydrate absorption rate',
          description:
            'Retrieve the observed rate of carbohydrate absorption based on glucose and insulin absorption',
        },
      })
      .input(ZGetCarbohydratesRateObservedSchema)
      .output(ZGetCarbohydratesRateObservedOutputSchema)
      .query(getCarbohydratesRateObserved),
    getCarbohydrateAttributed: protectedProcedure
      .meta({
        openapi: {
          method: 'GET',
          path: '/analysis/carbohydrate-attributed',
          protect: true,
          summary: 'Get attributed carbohydrates',
          description: 'Retrieve carbohydrates attributed to meals',
        },
      })
      .input(ZGetCarbohydrateAttributedSchema)
      .output(ZGetCarbohydrateAttributedOutputSchema)
      .query(getCarbohydrateAttributed),
  }),
  insulin: router({
    getInsulinOnBoard: protectedProcedure
      .meta({
        openapi: {
          method: 'GET',
          path: '/insulin/on-board',
          protect: true,
          summary: 'Get insulin on board',
          description: 'Calculate the amount of active insulin in the body',
        },
      })
      .input(ZGetInsulinOnBoard)
      .output(ZGetInsulinOOutputnBoard)
      .query(getInsulinOnBoard),
    get: protectedProcedure
      .meta({
        openapi: {
          method: 'GET',
          path: '/insulin',
          protect: true,
          summary: 'Get insulin records',
          description: 'Retrieve insulin records within a specified time range',
        },
      })
      .input(ZGetInsulinSchema)
      .output(ZGetInsulinOutputSchema)
      .query(getInsulin),
    delete: protectedProcedure
      .meta({
        openapi: {
          method: 'DELETE',
          path: '/insulin/{id}',
          protect: true,
          summary: 'Delete an insulin record',
          description: 'Delete a specific insulin record by ID',
        },
      })
      .input(ZDeleteInsulinSchema)
      .output(ZDeleteInsulinOutputSchema)
      .mutation(deleteInsulin),
    post: protectedProcedure
      .meta({
        openapi: {
          method: 'POST',
          path: '/insulin',
          protect: true,
          summary: 'Create or update an insulin record',
          description:
            'Create a new insulin record or update an existing one if ID is provided',
        },
      })
      .input(ZPostInsulinSchema)
      .output(ZPostInsulinOutputSchema)
      .mutation(postInsulin),
  }),
  carbohydrate: router({
    delete: protectedProcedure
      .meta({
        openapi: {
          method: 'DELETE',
          path: '/carbohydrate/{id}',
          protect: true,
          summary: 'Delete a carbohydrate record',
          description: 'Delete a specific carbohydrate record by ID',
        },
      })
      .input(ZDeteleCarbohydrateSchema)
      .output(ZDeteleCarbohydrateOutputSchema)
      .mutation(deleteCarbohydrate),
    post: protectedProcedure
      .meta({
        openapi: {
          method: 'POST',
          path: '/carbohydrate',
          protect: true,
          summary: 'Create or update a carbohydrate record',
          description:
            'Create a new carbohydrate record or update an existing one if ID is provided',
        },
      })
      .input(ZPostCarbohydrateSchema)
      .output(ZPostCarbohydrateOutputSchema)
      .mutation(postCarbohydrate),
    getReportedRate: protectedProcedure
      .meta({
        openapi: {
          method: 'GET',
          path: '/carbohydrate/reported-rate',
          protect: true,
          summary: 'Get reported carbohydrate absorption rate',
          description: 'Retrieve the reported rate of carbohydrate absorption',
        },
      })
      .input(ZGetCarbohydratesRateReportedSchema)
      .output(ZGetCarbohydratesRateReportedOutputSchema)
      .query(getCarbohydratesRateReported),
  }),
  glucose: router({
    get: protectedProcedure
      .meta({
        openapi: {
          method: 'GET',
          path: '/glucose',
          protect: true,
          summary: 'Get glucose readings',
          description:
            'Retrieve glucose readings within a specified time range',
        },
      })
      .input(ZGetGlucoseSchema)
      .output(ZGetGlucoseOutputSchema)
      .query(getGlucose),
    delete: protectedProcedure
      .meta({
        openapi: {
          method: 'DELETE',
          path: '/glucose/{id}',
          protect: true,
          summary: 'Delete a glucose reading',
          description: 'Delete a specific glucose reading by ID',
        },
      })
      .input(ZDeleteGlucoseSchema)
      .output(ZDeleteGlucoseOutputSchema)
      .mutation(deleteGlucose),
    post: protectedProcedure
      .meta({
        openapi: {
          method: 'POST',
          path: '/glucose',
          protect: true,
          summary: 'Create or update a glucose reading',
          description:
            'Create a new glucose reading or update an existing one if ID is provided',
        },
      })
      .input(ZPostGlucoseSchema)
      .output(ZPostGlucoseOutputSchema)
      .mutation(postGlucose),
    getLast: protectedProcedure
      .meta({
        openapi: {
          method: 'GET',
          path: '/glucose/last',
          protect: true,
          summary: 'Get the latest glucose reading',
          description: 'Retrieve the most recent glucose reading',
        },
      })
      .input(ZGetGlucoseLastSchema)
      .output(ZGetGlucoseLastOutputSchema)
      .query(getGlucoseLast),
  }),
})

export type AppRouter = typeof appRouter

export const createSSRHelper = async () =>
  createServerSideHelpers({
    router: appRouter,
    ctx: await createContext(),
    transformer: superjson,
  })
