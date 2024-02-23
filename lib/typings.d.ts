declare module "snappyjs" {
  export function compress(uncompressed: Uint8Array | ArrayBuffer | Buffer): ArrayBuffer
}

declare module "os-browserify" {
  export function hostname(): string | null
}

declare module "whatwg-fetch" {}
