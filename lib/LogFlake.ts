import {
  IBodyLog,
  IBodyPerformance,
  IInitOptions,
  SendExceptionOptionsType,
  SendLogOptionsType,
  LogLevels,
  Queue,
  ICorrelation,
} from "./types"
import { getCurrentDateTime, wait } from "./utils"
import { Buffer } from "buffer"
import { compress } from "snappyjs"
import { hostname as getDefaultHostname } from "os-browserify"

export class LogFlake {
  private readonly server: string
  private readonly appId: string | null
  private readonly hostname: string | undefined | null
  private readonly enableCompression: boolean
  private correlation: ICorrelation

  constructor(appId: string, server: string | null = null, options?: IInitOptions) {
    if (appId === null || appId.length === 0) {
      throw new Error("App ID must not be empty")
    }
    this.appId = appId
    this.server = server || "https://app.logflake.io"
    this.hostname = options?.hostname || getDefaultHostname()
    this.enableCompression = options?.enableCompression || true
    this.correlation = options?.correlation
  }

  public setCorrelation(correlation: ICorrelation) {
    this.correlation = correlation
  }

  private async post<T>(queue: Queue, bodyObject: T) {
    let contentType = "application/json"
    let body: BodyInit = JSON.stringify({ ...bodyObject, datetime: getCurrentDateTime() })
    if (this.enableCompression) {
      const encoded = Buffer.from(body).toString("base64")
      const encodedBuffer = new TextEncoder().encode(encoded).buffer
      body = compress(encodedBuffer)
      contentType = "application/octet-stream"
    }

    const fetchOptions: RequestInit = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": contentType,
      },
      keepalive: true,
      body,
    }

    const retries = 5
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${this.server}/api/ingestion/${this.appId}/${queue}`, fetchOptions)
        if (!response.ok) {
          console.error(`LogFlake Error: ${response.status} ${response.statusText}`)
          continue
        }

        return response
      } catch (err) {
        console.error(`LogFlake Error (retry ${i + 1}/${retries}):`, err)
        await wait(500 * (i + 1))
      }
    }
  }

  private log(content: string, options?: Partial<IBodyLog>) {
    let correlation: string | undefined
    if (options?.correlation) {
      correlation = typeof options.correlation === "function" ? options.correlation() : options.correlation
    } else {
      correlation = typeof this.correlation === "function" ? this.correlation() : this.correlation
    }

    return this.post<IBodyLog>(Queue.LOGS, {
      level: LogLevels.DEBUG,
      ...options,
      correlation,
      content,
      hostname: this.hostname,
    })
  }

  public sendLog(content: string, options?: SendLogOptionsType) {
    return this.log(content, options)
  }

  public sendException<E extends Error>(exception: E, options?: SendExceptionOptionsType) {
    const { stack, message, ...exceptionParams } = exception

    return this.log(stack ?? message ?? "Unknown error", {
      ...options,
      level: LogLevels.EXCEPTION,
      params: {
        exception: exceptionParams,
        meta: options?.params,
      },
    })
  }

  public sendPerformance(label: string, duration: number) {
    return this.post<IBodyPerformance>(Queue.PERF, { label, duration })
  }

  public measurePerformance(label: string): () => Promise<number> {
    const startTime = Date.now()

    return () => {
      return new Promise((resolve) => {
        const duration = Date.now() - startTime
        this.sendPerformance(label, duration).then(() => resolve(duration))
      })
    }
  }
}
