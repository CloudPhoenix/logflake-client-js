import { IBodyLog, IBodyPerformance, LogLevels, Queue } from "./types"
import { wait } from "./utils"
import { Buffer } from "buffer"
import { compress } from "snappyjs"
import { hostname as getDefaultHostname } from "os-browserify"

export class LogFlake {
  private readonly server: string
  private readonly appId: string | null
  private readonly hostname: string | null
  private readonly enableCompression: boolean

  constructor(appId: string, hostname: string | null = null, server: string | null = null, enableCompression: boolean = true) {
    if (appId === null || appId.length === 0) {
      throw new Error("App ID must not be empty")
    }
    this.appId = appId
    this.server = server || "https://app.logflake.io"
    this.hostname = hostname || getDefaultHostname() || null
    this.enableCompression = enableCompression
  }

  private async post<T>(queue: Queue, bodyObject: T) {
    let contentType = "application/json"
    let body: BodyInit = JSON.stringify({ ...bodyObject, hostname: this.hostname })
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

  public async sendLog(content: string, options?: Omit<IBodyLog, "content">) {
    return this.post<IBodyLog>(Queue.LOGS, {
      content,
      level: LogLevels.INFO,
      ...options,
    })
  }

  public async sendException<E extends Error>(exception: E, options?: Pick<IBodyLog, "correlation">) {
    return this.post<IBodyLog>(Queue.LOGS, {
      content: exception.stack ?? exception.message ?? "Unknown error",
      level: LogLevels.EXCEPTION,
      params: exception,
      ...options,
    })
  }

  public async sendPerformance(label: string, duration: number) {
    return this.post<IBodyPerformance>(Queue.PERF, { label, duration })
  }

  public measurePerformance(label: string) {
    const startTime = Date.now()

    return new Promise((resolve) => {
      const duration = Date.now() - startTime
      this.sendPerformance(label, duration).then(() => resolve(duration))
    })
  }
}
