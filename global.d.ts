declare module "npm:@supabase/server@^1" {
  export function withSupabase(
    options: { auth: "secret" | "jwt" },
    handler: (req: Request, ctx: { supabaseAdmin: any }) => Promise<Response> | Response
  ): (req: Request) => Promise<Response>;
}

declare module "npm:@pushforge/builder" {
  export function buildPushHTTPRequest(input: any): Promise<{
    endpoint: string;
    headers: HeadersInit;
    body: BodyInit;
  }>;
}

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};
