import { Logger, initialize } from "../lib/init"

describe("initialize", () => {
  expect(process.env.APP_ID).toBeDefined()
  const APP_ID = process.env.APP_ID as string

  expect(process.env.SERVER).toBeDefined()
  const SERVER = process.env.SERVER as string

  it("should initialize correctly", () => {
    const logInstance = initialize(APP_ID, {
      server: SERVER,
    })

    expect(logInstance).toBeDefined()
    // @ts-expect-error
    expect(logInstance?.appId).toBe(APP_ID)
    // @ts-expect-error
    expect(logInstance?.server).toBe(SERVER)
    expect(Logger).toBe(logInstance)
  })
})
