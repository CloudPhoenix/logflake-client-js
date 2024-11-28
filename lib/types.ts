export enum LogLevels {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  FATAL = 4,
  EXCEPTION = 5,
}

export enum Queue {
  LOGS = "logs",
  PERF = "perf",
}

export type ICorrelation = string | (() => string) | undefined

export interface IBodyLog {
  correlation?: ICorrelation
  params?: Record<string, unknown>
  level: LogLevels
  content: string
  hostname?: string | null
}

export interface IBodyPerformance {
  label: string
  duration: number
}

export interface IInitOptions {
  hostname?: string
  enableCompression?: boolean
  correlation?: ICorrelation
  verbose?: boolean
}

export type SendLogOptionsType = Partial<Omit<IBodyLog, "content">>
export type SendExceptionOptionsType = Omit<IBodyLog, "content" | "level">
