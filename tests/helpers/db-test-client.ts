import * as fs from "fs";
import * as path from "path";

export interface SafeTargetConfig {
  host: string;
  port: number;
  database: string;
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number | null;
  command: string;
}

export interface ClientBase {
  query<R = Record<string, unknown>>(queryText: string, values?: unknown[]): Promise<QueryResult<R>>;
}

export interface PoolClient extends ClientBase {
  release(err?: Error | boolean): void;
}

export interface Client extends ClientBase {
  connect(): Promise<void>;
  end(): Promise<void>;
}

export interface Pool extends ClientBase {
  connect(): Promise<PoolClient>;
  end(): Promise<void>;
}

// Dynamically resolve pg module with fallback for environments where local node_modules lacks pg
let PgPoolConstructor: new (opts: { connectionString?: string; max?: number; idleTimeoutMillis?: number }) => Pool;
let PgClientConstructor: new (opts: { connectionString?: string }) => Client;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pg = require("pg");
  PgPoolConstructor = pg.Pool;
  PgClientConstructor = pg.Client;
} catch {
  PgPoolConstructor = class DummyPool implements Pool {
    constructor() {}
    async query<R = Record<string, unknown>>(): Promise<QueryResult<R>> {
      throw new Error("pg driver not loaded");
    }
    async connect(): Promise<PoolClient> {
      throw new Error("pg driver not loaded");
    }
    async end(): Promise<void> {}
  };
  PgClientConstructor = class DummyClient implements Client {
    constructor() {}
    async query<R = Record<string, unknown>>(): Promise<QueryResult<R>> {
      throw new Error("pg driver not loaded");
    }
    async connect(): Promise<void> {}
    async end(): Promise<void> {}
  };
}

/**
 * Strictly validates the database connection string.
 * Permitted in CI only:
 * - Host: strictly 'postgres'
 * - Port: strictly 5432
 * - Database: strictly 'bridge_ci_test'
 * Fails closed on any unexpected, remote, or cloud database.
 */
export function validateCiDatabaseTarget(rawUrl: string | undefined): SafeTargetConfig {
  if (!rawUrl || rawUrl.trim() === "") {
    throw new Error(
      "FATAL CONFIGURATION ERROR: INTEGRATION_DATABASE_URL is not set. Database integration tests cannot run."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("FATAL CONFIGURATION ERROR: INTEGRATION_DATABASE_URL is not a valid URI format.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error(`FATAL SECURITY VIOLATION: Invalid protocol "${parsed.protocol}". Expected "postgres:".`);
  }

  if (parsed.hostname !== "postgres") {
    throw new Error(
      `FATAL SECURITY VIOLATION: Host "${parsed.hostname}" is rejected. Only "postgres" is permitted in CI.`
    );
  }

  const port = parseInt(parsed.port || "5432", 10);
  if (port !== 5432) {
    throw new Error(`FATAL SECURITY VIOLATION: Port "${port}" is rejected. Only 5432 is permitted.`);
  }

  const database = parsed.pathname.replace(/^\//, "");
  if (database !== "bridge_ci_test") {
    throw new Error(
      `FATAL SECURITY VIOLATION: Database "${database}" is rejected. Only "bridge_ci_test" is permitted.`
    );
  }

  // Safe credential-redacted log
  console.log(`[Safe CI DB Harness] Target verified: postgres://[REDACTED]@${parsed.hostname}:${port}/${database}`);

  return { host: parsed.hostname, port, database };
}

let poolInstance: Pool | null = null;

export function getTestPool(): Pool {
  if (!poolInstance) {
    const rawUrl = process.env.INTEGRATION_DATABASE_URL;
    validateCiDatabaseTarget(rawUrl);
    poolInstance = new PgPoolConstructor({
      connectionString: rawUrl,
      max: 10,
      idleTimeoutMillis: 10000,
    });
  }
  return poolInstance;
}

export async function createDedicatedClient(): Promise<Client> {
  const rawUrl = process.env.INTEGRATION_DATABASE_URL;
  validateCiDatabaseTarget(rawUrl);
  const client = new PgClientConstructor({ connectionString: rawUrl });
  await client.connect();
  return client;
}

/**
 * Initializes the disposable CI database:
 * 1. Applies synthetic baseline schema fixture.
 * 2. Applies the exact Phase 6B migration file.
 */
export async function initializeTestDatabase(): Promise<void> {
  const pool = getTestPool();
  const client = await pool.connect();
  try {
    const fixturePath = path.resolve(__dirname, "../fixtures/00_minimal_payment_schema.sql");
    const migrationPath = path.resolve(
      __dirname,
      "../../supabase/migrations/20260930121000_payment_invoice_integrity_phase6b.sql"
    );

    if (!fs.existsSync(fixturePath)) {
      throw new Error(`Missing fixture file at ${fixturePath}`);
    }
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Missing migration file at ${migrationPath}`);
    }

    const fixtureSql = fs.readFileSync(fixturePath, "utf-8");
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    // Execute fixture as superuser
    await client.query(fixtureSql);

    // Execute exact Phase 6B migration
    await client.query(migrationSql);

    console.log("[Safe CI DB Harness] Synthetic baseline and Phase 6B migration applied successfully.");
  } finally {
    client.release();
  }
}

/**
 * Creates a synthetic tenant with user, profile, organization, and optional party/trip fixtures.
 */
export async function createSyntheticTenant(
  client: PoolClient | Client,
  orgName = "Acme Transport",
  outstandingBalance = 50000
): Promise<{ orgId: string; userId: string; partyId: string }> {
  // Insert synthetic auth user
  const userRes = await client.query<{ id: string }>(`
    INSERT INTO auth.users (id, email)
    VALUES (gen_random_uuid(), 'test-user@example.com')
    RETURNING id;
  `);
  const userId = userRes.rows[0].id;

  // Insert synthetic org
  const orgRes = await client.query<{ id: string }>(`
    INSERT INTO public.organizations (id, name, invoice_prefix)
    VALUES (gen_random_uuid(), $1, 'YSL-INV')
    RETURNING id;
  `, [orgName]);
  const orgId = orgRes.rows[0].id;

  // Insert profile linking user to active org
  await client.query(`
    INSERT INTO public.profiles (id, org_id, full_name, role)
    VALUES ($1, $2, 'Admin Tester', 'admin');
  `, [userId, orgId]);

  // Insert synthetic party
  const partyRes = await client.query<{ id: string }>(`
    INSERT INTO public.parties (id, org_id, name, outstanding_amount, total_business)
    VALUES (gen_random_uuid(), $1, 'Global Logistics Corp', $2, $2)
    RETURNING id;
  `, [orgId, outstandingBalance]);
  const partyId = partyRes.rows[0].id;

  return { orgId, userId, partyId };
}

/**
 * Helper to set tenant context and switch role to authenticated.
 */
export async function setTenantContext(client: PoolClient | Client, userId: string): Promise<void> {
  await client.query(`SET LOCAL request.jwt.claim.sub = '${userId}';`);
  await client.query("SET LOCAL ROLE authenticated;");
}

/**
 * Deterministically waits until targetPid is blocked by another process using pg_blocking_pids.
 */
export async function waitForLockBlock(
  observerClient: Client,
  blockedPid: number,
  expectedBlockingPid: number,
  timeoutMs = 5000
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const res = await observerClient.query<{ blocking_pids: number[] }>(`
      SELECT pg_blocking_pids($1) AS blocking_pids;
    `, [blockedPid]);

    const blockingPids = res.rows[0]?.blocking_pids || [];
    if (blockingPids.includes(expectedBlockingPid)) {
      return; // Deterministically verified: blockedPid is waiting on expectedBlockingPid
    }
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`TIMEOUT: Process ${blockedPid} was not blocked by ${expectedBlockingPid} within ${timeoutMs}ms.`);
}
