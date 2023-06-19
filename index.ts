import os from "os-browserify";
import fetch from "isomorphic-fetch";

let LogFlakeServer =
  process.env.LOGFLAKESERVER || "https://app-test.logflake.io";
let LogFlakeAppId = null;
let LogFlakeHostname = null;

const Post = async (uri, bodyObject) => {
  if (LogFlakeAppId === null)
    throw new Error("App ID must not be empty. Call Setup first.");
  const retries = 3;
  for (let i = 0; i < retries; i++) {
    try {
      await fetch(`${LogFlakeServer}/api/ingestion/${LogFlakeAppId}/${uri}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        keepalive: true,
        body: JSON.stringify(bodyObject),
      });
      break;
    } catch (err) {
      // Continue till it goes or breaks
      console.error(`LogFlake Error (retry ${i + 1}/${retries}):`, err);
    }
  }
};

const Setup = (appid: string | null = null, server = null, hostname = null) => {
  if (appid === null || appid.length === 0)
    throw new Error("App ID must not be empty");
  LogFlakeAppId = appid;
  if (server !== null) LogFlakeServer = server;
  LogFlakeHostname = hostname || os.hostname() || null;
};

const SendLog = (
  level: number,
  content = null,
  correlation = null,
  params = {}
) =>
  Post("logs", {
    correlation,
    params,
    level: content === null ? LogLevels.INFO : level,
    content: content === null ? level : content,
    hostname: LogFlakeHostname,
  });

const SendException = (exception, correlation = null) => {
  if (!(exception instanceof Error)) {
    exception = new Error(exception);
    const searchStr = "    at Object.SendException (";
    if (exception.stack.indexOf(searchStr) !== -1) {
      const stack = exception.stack.split("\n");
      const removeIndex = stack.findIndex((x) => x.startsWith(searchStr));
      if (removeIndex !== -1) {
        stack.splice(removeIndex, 1);
        exception.stack = stack.join("\n");
      }
    }
  }
  Post("logs", {
    correlation,
    message: exception.message,
    type: exception.name,
    trace: exception.stack,
    hostname: LogFlakeHostname,
  });
};

const SendPerformance = (label = null, duration = null) => {
  if (label === null || duration === null)
    throw new Error("Label and duration must not be empty");
  Post("perf", { label, duration });
};

const MeasurePerformance = (label = null) => {
  if (label === null) throw new Error("Label must not be empty");
  const startTime = new Date();
  return {
    Stop: (_) => {
      const duration = new Date() - startTime;
      SendPerformance(label, duration);
      return duration;
    },
  };
};

const LogLevels = {
  ALL: "ALL",
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  FATAL: "FATAL",
};

module.exports = {
  Setup,
  LogLevels,
  SendLog,
  SendException,
  SendPerformance,
  MeasurePerformance,
};
