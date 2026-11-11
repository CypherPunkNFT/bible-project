export function readSlice(body: ReadableStream<Uint8Array>, start: number, end: number): Promise<Uint8Array>;
export function wantsByteRange(request: Request): boolean;
export function serveByteRange(
  request: Request,
  env: { ASSETS: { fetch(request: Request): Promise<Response> } },
  cache: { match(request: Request): Promise<Response | undefined>; put(request: Request, response: Response): Promise<void> },
): Promise<Response>;
