import { LogFlake } from "../lib/LogFlake"
import { IBodyLog, LogLevels, Queue } from "../lib/types"

describe("LogFlake logs", () => {
  expect(process.env.APP_ID).toBeDefined()
  const APP_ID = process.env.APP_ID as string

  expect(process.env.SERVER).toBeDefined()
  const SERVER = process.env.SERVER as string

  let logFlake: LogFlake
  let mockPost: jest.Mock

  beforeEach(() => {
    mockPost = jest.fn()
    // @ts-expect-error
    LogFlake.prototype.post = mockPost
    logFlake = new LogFlake(APP_ID, null, SERVER)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should send log with default level", async () => {
    const content = "Test log"
    await logFlake.sendLog(content)

    expect(mockPost).toHaveBeenCalledWith(Queue.LOGS, {
      content,
      level: LogLevels.INFO,
    })
  })

  it("should send log with custom level", async () => {
    const content = "Test log"
    const options: Omit<IBodyLog, "content"> = {
      level: LogLevels.ERROR,
    }
    await logFlake.sendLog(content, options)

    expect(mockPost).toHaveBeenCalledWith(Queue.LOGS, {
      content,
      ...options,
    })
  })

  it("should send exception with default level", async () => {
    const error = new Error("Test error")
    await logFlake.sendException(error)

    expect(mockPost).toHaveBeenCalledWith(Queue.LOGS, {
      content: error.stack,
      level: LogLevels.EXCEPTION,
      params: error,
    })
  })

  it("should send exception with custom level", async () => {
    const error = new Error("Test error")
    const options: Pick<IBodyLog, "correlation"> = {
      correlation: "test-correlation",
    }
    await logFlake.sendException(error, options)

    expect(mockPost).toHaveBeenCalledWith(Queue.LOGS, {
      content: error.stack,
      level: LogLevels.EXCEPTION,
      params: error,
      ...options,
    })
  })

  it("should send performance with default level", async () => {
    const name = "Test performance"
    const duration = 123
    await logFlake.sendPerformance(name, duration)

    expect(mockPost).toHaveBeenCalledWith(Queue.PERF, {
      label: name,
      duration,
    })
  })

  it("should send performance with custom level", async () => {
    const name = "Test performance"
    const duration = 123
    await logFlake.sendPerformance(name, duration)

    expect(mockPost).toHaveBeenCalledWith(Queue.PERF, {
      label: name,
      duration,
    })
  })
})
