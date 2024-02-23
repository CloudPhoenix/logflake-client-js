export const wait = (delay: number) => {
  return new Promise((resolve) => setTimeout(resolve, delay))
}

export const getCurrentDateTime = () => {
  return new Date().toISOString()
}
