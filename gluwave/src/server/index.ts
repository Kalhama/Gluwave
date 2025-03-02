import { createServerSideHelpers } from '@trpc/react-query/server'
import superjson from 'superjson'

import { createContext } from './context'
import { ZDeleteApiKeySchema, deleteApiKey } from './routes/delete-api-key'
import {
  ZDeteleCarbohydrateSchema,
  deleteCarbohydrate,
} from './routes/delete-carbohydrate'
import { ZDeleteGlucoseSchema, deleteGlucose } from './routes/delete-glucose'
import { ZDeleteInsulinSchema, deleteInsulin } from './routes/delete-insulin'
import {
  ZGetCarbohydrateAttributedSchema,
  getCarbohydrateAttributed,
} from './routes/get-carbohydrate-attributed'
import {
  ZGetCarbohydratesRateObservedSchema,
  getCarbohydratesRateObserved,
} from './routes/get-carbohydrates-rate-observed'
import {
  ZGetCarbohydratesRateReportedSchema,
  getCarbohydratesRateReported,
} from './routes/get-carbohydrates-rate-reported'
import { ZGetGlucoseSchema, getGlucose } from './routes/get-glucose'
import {
  ZGetGlucoseLastSchema,
  getGlucoseLast,
} from './routes/get-glucose-last'
import { ZGetInsulinSchema, getInsulin } from './routes/get-insulin'
import {
  ZGetInsulinOnBoard,
  getInsulinOnBoard,
} from './routes/get-insulin-on-board'
import { ZPostApiKeySchema, postApiKey } from './routes/post-api-key'
import { postCarbohydrate } from './routes/post-carbohydrate'
import { ZPostCarbohydrateSchema } from './routes/post-carbohydrate.schema'
import { postGlucose } from './routes/post-glucose'
import { ZPostGlucoseSchema } from './routes/post-glucose.schema'
import { postInsulin } from './routes/post-insulin'
import { ZPostInsulinSchema } from './routes/post-insulin.schema'
import { postProfile } from './routes/post-profile'
import { ZPostProfileSchema } from './routes/post-profile.schema'
import { protectedProcedure, router } from './trpc'

export const appRouter = router({
  user: router({
    postApiKey: protectedProcedure
      .input(ZPostApiKeySchema)
      .mutation(postApiKey),
    deleteApiKey: protectedProcedure
      .input(ZDeleteApiKeySchema)
      .mutation(deleteApiKey),
    postProfile: protectedProcedure
      .input(ZPostProfileSchema)
      .mutation(postProfile),
  }),
  analysis: router({
    getCarbohydratesRateObserved: protectedProcedure
      .input(ZGetCarbohydratesRateObservedSchema)
      .query(getCarbohydratesRateObserved),
    getCarbohydrateAttributed: protectedProcedure
      .input(ZGetCarbohydrateAttributedSchema)
      .query(getCarbohydrateAttributed),
  }),
  insulin: router({
    getInsulinOnBoard: protectedProcedure
      .input(ZGetInsulinOnBoard)
      .query(getInsulinOnBoard),
    get: protectedProcedure.input(ZGetInsulinSchema).query(getInsulin),
    delete: protectedProcedure
      .input(ZDeleteInsulinSchema)
      .mutation(deleteInsulin),
    post: protectedProcedure.input(ZPostInsulinSchema).mutation(postInsulin),
  }),
  carbohydrate: router({
    delete: protectedProcedure
      .input(ZDeteleCarbohydrateSchema)
      .mutation(deleteCarbohydrate),
    post: protectedProcedure
      .input(ZPostCarbohydrateSchema)
      .mutation(postCarbohydrate),
    getReportedRate: protectedProcedure
      .input(ZGetCarbohydratesRateReportedSchema)
      .query(getCarbohydratesRateReported),
  }),
  glucose: router({
    get: protectedProcedure.input(ZGetGlucoseSchema).query(getGlucose),
    delete: protectedProcedure
      .input(ZDeleteGlucoseSchema)
      .mutation(deleteGlucose),
    post: protectedProcedure.input(ZPostGlucoseSchema).mutation(postGlucose),
    getLast: protectedProcedure
      .input(ZGetGlucoseLastSchema)
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
