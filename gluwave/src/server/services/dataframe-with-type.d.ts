import { DataFrame } from 'nodejs-polars'

export interface DataFrameTypes<T extends Record<string, any>>
  extends DataFrame {
  toRecords(): T[]
}
