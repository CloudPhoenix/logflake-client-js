import { LogFlake } from "./LogFlake"

export let Logger: LogFlake | null = null

interface IInitOptions {
  hostname?: string
  enableCompression?: boolean
}

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
