import { api } from "encore.dev/api";

interface PingResponse {
    message: string;
  }

// GET /ping → "hello from The Farm"
export const ping = api(
  { expose: true, auth: false, method: "GET", path: "/ping" },
  async (): Promise<PingResponse> => {
    return { message: "hello from The Farm" };
  }
);