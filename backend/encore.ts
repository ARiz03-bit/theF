// import { api } from "encore.dev/api";
// import { SQLDatabase } from "encore.dev/storage/sqldb";

// // 'url' database is used to store the URLs that are being shortened.
// const db = new SQLDatabase("intern", { migrations: "./Multi-Tenancy/migrations" });

// interface PingResponse {
//     message: string;
//   }

// // GET /ping → "hello from The Farm"
// export const ping = api(
//   { expose: true, auth: false, method: "GET", path: "/ping" },
//   async (): Promise<PingResponse> => {
//     return { message: "hello from The Farm" };
//   }
// );

import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { requireScope } from "./scope";
import { getUserFromAuthHeader, generateJWT, UserContext } from "./auth";

const db = new SQLDatabase("intern", { migrations: "./Multi-Tenancy/migrations" });

interface Plan {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
}

interface PlansResponse {
  plans: Plan[];
}

// LOGIN - tạo JWT
export const login = api(
  { expose: true, auth: false, method: "POST", path: "/login" },
  async (params: { workspace_id: string; scopes: string[] }): Promise<{ token: string }> => {
    // Ở môi trường thực tế, hãy kiểm tra user/password ở đây!
    const token = generateJWT(params.workspace_id, params.scopes);
    return { token };
  }
);

// CREATE
export const createPlan = api(
    { expose: true, auth: true, method: "POST", path: "/plan" },
    async (params: { name: string; description?: string; headers?: any }): Promise<Plan> => {
      const user: UserContext = getUserFromAuthHeader(params.headers);
      requireScope(user, "plan:create");
      const workspace_id = user.workspace_id;
      const row = await db.queryRow`
        INSERT INTO plan (id, workspace_id, name, description)
        VALUES (gen_random_uuid(), ${workspace_id}, ${params.name}, ${params.description ?? null})
        RETURNING id, workspace_id, name, description
      `;
      return row as Plan;
    }
  );

// READ ALL
export const getPlans = api(
  { expose: true, auth: true, method: "GET", path: "/plan" },
  async (params: { headers?: any }): Promise<PlansResponse> => {
    const user: UserContext = getUserFromAuthHeader(params.headers);
    requireScope(user, "plan:read");
    const workspace_id = user.workspace_id;
    const plans: Plan[] = [];
    for await (const row of db.query`
      SELECT id, workspace_id, name, description FROM plan WHERE workspace_id = ${workspace_id}
    `) {
      plans.push(row as Plan);
    }
    return { plans };
  }
);

// READ ONE
export const getPlan = api(
  { expose: true, auth: true, method: "GET", path: "/plan/:id" },
  async (params: { id: string; headers?: any }): Promise<Plan> => {
    const user: UserContext = getUserFromAuthHeader(params.headers);
    requireScope(user, "plan:read");
    const workspace_id = user.workspace_id;
    const row = await db.queryRow`
      SELECT id, workspace_id, name, description FROM plan WHERE id = ${params.id} AND workspace_id = ${workspace_id}
    `;
    if (!row) throw new Error("Plan not found");
    return row as Plan;
  }
);

// UPDATE
export const updatePlan = api(
  { expose: true, auth: true, method: "PUT", path: "/plan/:id" },
  async (params: { id: string; name?: string; description?: string; headers?: any }): Promise<Plan> => {
    const user: UserContext = getUserFromAuthHeader(params.headers);
    requireScope(user, "plan:update");
    const workspace_id = user.workspace_id;
    const row = await db.queryRow`
      UPDATE plan SET
        name = COALESCE(${params.name}, name),
        description = COALESCE(${params.description}, description)
      WHERE id = ${params.id} AND workspace_id = ${workspace_id}
      RETURNING id, workspace_id, name, description
    `;
    if (!row) throw new Error("Plan not found or access denied");
    return row as Plan;
  }
);

// DELETE
export const deletePlan = api(
  { expose: true, auth: true, method: "DELETE", path: "/plan/:id" },
  async (params: { id: string; headers?: any }): Promise<{ success: boolean }> => {
    const user: UserContext = getUserFromAuthHeader(params.headers);
    requireScope(user, "plan:delete");
    const workspace_id = user.workspace_id;
    const result = await db.queryRow`
      DELETE FROM plan WHERE id = ${params.id} AND workspace_id = ${workspace_id}
      RETURNING id
    `;
    if (!result) throw new Error("Plan not found or access denied");
    return { success: true };
  }
);