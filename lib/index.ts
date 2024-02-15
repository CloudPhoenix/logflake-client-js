import "whatwg-fetch"
import { Buffer } from "buffer"
//@ts-ignore
import * as SnappyJS from "snappyjs"
//@ts-ignore
import * as os from "os-browserify"

export let Logger: LogFlake

export function Setup(appid: string, hostname: string | null = null, server: string | null = null, enableCompression: boolean = true) {
  Logger = new LogFlake(appid, hostname, server, enableCompression)
}

export const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  FATAL: 4,
  EXCEPTION: 5,
}

export class LogFlake {
  private server: string
  private appId: string | null
  private hostname: string | null
  private enableCompression: boolean

  constructor(appid: string, hostname: string | null = null, server: string | null = null, enableCompression: boolean = true) {
    if (appid === null || appid.length === 0) {
      throw new Error("App ID must not be empty")
    }
    this.appId = appid
    this.server = server || "https://app.logflake.io"
    this.hostname = hostname || os.hostname() || null
    this.enableCompression = enableCompression
  }

  private dataToBase64(data: any): string {
    return Buffer.from(String.fromCharCode(...data)).toString("base64")
  }

  private async post(queue: string, bodyObject: any) {
    if (this.appId === null) {
      throw new Error("App ID must not be empty. Call Setup first.")
    }

    const fetchOptions: any = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify(bodyObject),
    }

    if (this.enableCompression) {
      const encoded = this.dataToBase64(fetchOptions.body)
      fetchOptions.body = SnappyJS.compress(new TextEncoder().encode(encoded).buffer)
      fetchOptions.headers["Content-Type"] = "application/octet-stream"
    }

    const retries = 3
    for (let i = 0; i < retries; i++) {
      try {
        return await fetch(`${this.server}/api/ingestion/${this.appId}/${queue}`, fetchOptions)
      } catch (err) {
        console.error(`LogFlake Error (retry ${i + 1}/${retries}):`, err)
      }
    }
  }

  public async sendLog(level: number, content: string, correlation: string | null = null, params: object | undefined = {}) {
    return this.post("logs", {
      correlation,
      params,
      level,
      content,
      hostname: this.hostname,
    })
  }

  public async sendException(exception: Error, correlation: string | null = null) {
    return this.post("logs", {
      correlation,
      content: exception.stack,
      hostname: this.hostname,
      level: LogLevels.EXCEPTION,
    })
  }

  public async sendPerformance(label: string, duration: number | null = null) {
    if (label === null || duration === null) {
      throw new Error("Label and duration must not be empty")
    }
    return this.post("perf", { label, duration })
  }

  public measurePerformance(label: string) {
    if (label === null) {
      throw new Error("Label must not be empty")
    }
    const startTime = new Date()
    return {
      stop: async () => {
        const duration = new Date().getTime() - startTime.getTime()
        await this.sendPerformance(label, duration)
        return duration
      },
    }
  }
}
