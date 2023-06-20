import os from "os-browserify";
import fetch from "isomorphic-fetch";

class LogFlake {
  private LogFlakeServer: string;
  private LogFlakeAppId: string | null;
  private LogFlakeHostname: string | null;

  constructor(server: string = "https://app-test.logflake.io") {
    this.LogFlakeServer = server;
    this.LogFlakeAppId = null;
    this.LogFlakeHostname = null;
  }

  private async post(queue: string, bodyObject: any) {
    if (this.LogFlakeAppId === null) {
      throw new Error("App ID must not be empty. Call Setup first.");
    }

    const retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        await fetch(
          `${this.LogFlakeServer}/api/ingestion/${this.LogFlakeAppId}/${queue}`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            keepalive: true,
            body: JSON.stringify(bodyObject),
          }
        );
        break;
      } catch (err) {
        console.error(`LogFlake Error (retry ${i + 1}/${retries}):`, err);
      }
    }
  }

  public setup(
    appid: string,
    server: string | null = null,
    hostname: string | null = null
  ) {
    if (appid === null || appid.length === 0) {
      throw new Error("App ID must not be empty");
    }
    this.LogFlakeAppId = appid;
    if (server !== null) {
      this.LogFlakeServer = server;
    }
    this.LogFlakeHostname = hostname || os.hostname() || null;
  }

  public sendLog(
    level: number,
    content: string,
    correlation: string | null = null,
    params: object | undefined = {}
  ) {
    this.post("logs", {
      correlation,
      params,
      level,
      content,
      hostname: this.LogFlakeHostname,
    });
  }

  public sendException(exception: Error, correlation: string | null = null) {
    this.post("logs", {
      correlation,
      content: exception.stack,
      hostname: this.LogFlakeHostname,
      level: LogFlake.LogLevels.EXCEPTION,
    });
  }

  public sendPerformance(label: string, duration: number | null = null) {
    if (label === null || duration === null) {
      throw new Error("Label and duration must not be empty");
    }
    this.post("perf", { label, duration });
  }

  public measurePerformance(label: string) {
    if (label === null) {
      throw new Error("Label must not be empty");
    }
    const startTime = new Date();
    return {
      stop: () => {
        const duration = new Date().getTime() - startTime.getTime();
        this.sendPerformance(label, duration);
        return duration;
      },
    };
  }

  public static readonly LogLevels = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    FATAL: 4,
    EXCEPTION: 5,
  };
}

export default LogFlake;
