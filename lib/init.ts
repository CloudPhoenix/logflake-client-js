import { LogFlake } from "./LogFlake"
import { IInitOptions, SendExceptionOptionsType, SendLogOptionsType } from "./types"

let Logger: LogFlake | null = null

export const getLogger = () => {
  return Logger
}

export const sendLog = (content: string, options?: SendLogOptionsType) => getLogger()?.sendLog(content, options)
export const sendException = (error: Error, options?: SendExceptionOptionsType) => getLogger()?.sendException(error, options)
export const measurePerformance = (label: string) => getLogger()?.measurePerformance(label)
export const sendPerformance = (label: string, duration: number) => getLogger()?.sendPerformance(label, duration)

export function initialize(appId: string, server?: string, options?: IInitOptions) {
  if (Logger !== null) {
    throw new Error("LogFlake is already initialized, if you want to initialize a new instance, use the LogFlake class directly.")
  }

  Logger = new LogFlake(appId, server, options)
  return Logger
}

export function reset() {
  Logger = null
}
