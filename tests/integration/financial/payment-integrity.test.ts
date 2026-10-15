import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getTestPool,
  createDedicatedClient,
  initializeTestDatabase,
  createSyntheticTenant,
  setTenantContext,
  waitForLockBlock,
} from "../../helpers/db-test-client";

describe("Phase 6B Payment Integrity & Ledger Hardening (CI Integration)", () => {
  beforeAll(async () => {
    // Apply synthetic baseline and Phase 6B migration to disposable CI database
    await initializeTestDatabase();
  });

  afterAll(async () => {
    const pool = getTestPool();
    await pool.end();
  });

  it("1. Valid General Party Payment: reduces party outstanding balance atomically", async () => {
    const pool = getTestPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      const { userId, partyId } = await createSyntheticTenant(client, "Org 1", 50000);
      await setTenantContext(client, userId);

      // Call Phase 6B RPC: General party payment of 20,000
      const res = await client.query(`
        SELECT public.record_party_payment(
          p_party_id := $1,
          p_amount := 20000,
          p_payment_method := 'bank_transfer',
          p_reference_number := 'REF-001'
        ) AS result;
      `, [partyId]);

      expect(res.rows[0].result.success).toBe(true);
      expect(res.rows[0].result.new_outstanding).toBe(30000);

      // Verify parties table updated
      const partyCheck = await client.query(
        "SELECT outstanding_amount FROM public.parties WHERE id = $1;",
        [partyId]
      );
      expect(Number(partyCheck.rows[0].outstanding_amount)).toBe(30000);

      // Verify payments ledger contains exactly 1 row
      const paymentCheck = await client.query(
        "SELECT amount, payment_method, reference_number, trip_id FROM public.payments WHERE party_id = $1;",
        [partyId]
      );
      expect(paymentCheck.rows.length).toBe(1);
      expect(Number(paymentCheck.rows[0].amount)).toBe(20000);
      expect(paymentCheck.rows[0].payment_method).toBe("bank_transfer");
      expect(paymentCheck.rows[0].trip_id).toBeNull();

      await client.query("ROLLBACK;");
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  });

  it("2. General Party Overpayment Rejection: fails closed with zero ledger writes", async () => {
    const pool = getTestPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      const { userId, partyId } = await createSyntheticTenant(client, "Org 2", 10000);
      await setTenantContext(client, userId);

      // Set savepoint to test failure and verify state within same transaction
      await client.query("SAVEPOINT sp_overpay_test;");

      let caughtError: Error | null = null;
      try {
        await client.query(`
          SELECT public.record_party_payment(
            p_party_id := $1,
            p_amount := 15000
          );
        `, [partyId]);
      } catch (err: unknown) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain("exceeds party outstanding balance");

      // Rollback to savepoint and assert zero rows inserted
      await client.query("ROLLBACK TO SAVEPOINT sp_overpay_test;");

      const partyCheck = await client.query(
        "SELECT outstanding_amount FROM public.parties WHERE id = $1;",
        [partyId]
      );
      expect(Number(partyCheck.rows[0].outstanding_amount)).toBe(10000);

      const paymentCheck = await client.query(
        "SELECT count(*) FROM public.payments WHERE party_id = $1;",
        [partyId]
      );
      expect(Number(paymentCheck.rows[0].count)).toBe(0);

      await client.query("ROLLBACK;");
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  });

  it("3. Trip Payment Ceiling & Status Sync: enforces sequential payments and rejects overpayment", async () => {
    const pool = getTestPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      const { orgId, userId, partyId } = await createSyntheticTenant(client, "Org 3", 50000);

      // Create unbilled trip with freight 50,000
      const tripRes = await client.query(`
        INSERT INTO public.trips (org_id, party_id, status, freight_amount, advance_paid, payment_status)
        VALUES ($1, $2, 'pending', 50000, 0, 'pending')
        RETURNING id;
      `, [orgId, partyId]);
      const tripId = tripRes.rows[0].id;

      await setTenantContext(client, userId);

      // Payment 1: 30,000 -> status transitions to 'partial'
      const pay1 = await client.query(`
        SELECT public.record_party_payment(
          p_party_id := $1,
          p_amount := 30000,
          p_trip_id := $2
        ) AS result;
      `, [partyId, tripId]);
      expect(pay1.rows[0].result.success).toBe(true);

      const tripCheck1 = await client.query(
        "SELECT advance_paid, payment_status FROM public.trips WHERE id = $1;",
        [tripId]
      );
      expect(Number(tripCheck1.rows[0].advance_paid)).toBe(30000);
      expect(tripCheck1.rows[0].payment_status).toBe("partial");

      // Payment 2: 20,000 -> status transitions to 'paid'
      const pay2 = await client.query(`
        SELECT public.record_party_payment(
          p_party_id := $1,
          p_amount := 20000,
          p_trip_id := $2
        ) AS result;
      `, [partyId, tripId]);
      expect(pay2.rows[0].result.success).toBe(true);

      const tripCheck2 = await client.query(
        "SELECT advance_paid, payment_status FROM public.trips WHERE id = $1;",
        [tripId]
      );
      expect(Number(tripCheck2.rows[0].advance_paid)).toBe(50000);
      expect(tripCheck2.rows[0].payment_status).toBe("paid");

      // Payment 3: 5,000 -> Rejected by ceiling calculation
      await client.query("SAVEPOINT sp_trip_overpay;");
      let caughtError: Error | null = null;
      try {
        await client.query(`
          SELECT public.record_party_payment(
            p_party_id := $1,
            p_amount := 5000,
            p_trip_id := $2
          );
        `, [partyId, tripId]);
      } catch (err: unknown) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain("Payment amount exceeds remaining trip balance");

      await client.query("ROLLBACK TO SAVEPOINT sp_trip_overpay;");

      // Verify exactly 2 payments recorded
      const countCheck = await client.query(
        "SELECT count(*) FROM public.payments WHERE trip_id = $1;",
        [tripId]
      );
      expect(Number(countCheck.rows[0].count)).toBe(2);

      await client.query("ROLLBACK;");
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  });

  it("4. Cancelled Trip Protection: rejects payment attempts on cancelled trips", async () => {
    const pool = getTestPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      const { orgId, userId, partyId } = await createSyntheticTenant(client, "Org 4", 50000);

      // Create cancelled trip
      const tripRes = await client.query(`
        INSERT INTO public.trips (org_id, party_id, status, freight_amount, advance_paid, payment_status)
        VALUES ($1, $2, 'cancelled', 50000, 0, 'pending')
        RETURNING id;
      `, [orgId, partyId]);
      const tripId = tripRes.rows[0].id;

      await setTenantContext(client, userId);
      await client.query("SAVEPOINT sp_cancel_test;");

      let caughtError: Error | null = null;
      try {
        await client.query(`
          SELECT public.record_party_payment(
            p_party_id := $1,
            p_amount := 10000,
            p_trip_id := $2
          );
        `, [partyId, tripId]);
      } catch (err: unknown) {
        caughtError = err as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain("Cannot add payment to a cancelled trip.");

      await client.query("ROLLBACK TO SAVEPOINT sp_cancel_test;");
      await client.query("ROLLBACK;");
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  });

  it("5. Deterministic Concurrent Overpayment Serialization: proves lock-wait and ceiling enforcement across two distinct connections", async () => {
    const client1 = await createDedicatedClient();
    const client2 = await createDedicatedClient();
    const observerClient = await createDedicatedClient();

    try {
      // 1. Setup fixture in separate autocommit mode
      const { orgId, userId, partyId } = await createSyntheticTenant(observerClient, "Org 5 Concurrency", 50000);

      const tripRes = await observerClient.query(`
        INSERT INTO public.trips (org_id, party_id, status, freight_amount, advance_paid, payment_status)
        VALUES ($1, $2, 'pending', 50000, 0, 'pending')
        RETURNING id;
      `, [orgId, partyId]);
      const tripId = tripRes.rows[0].id;

      // Get backend PIDs for lock verification
      const pid1Res = await client1.query("SELECT pg_backend_pid() AS pid;");
      const pid2Res = await client2.query("SELECT pg_backend_pid() AS pid;");
      const pid1: number = pid1Res.rows[0].pid;
      const pid2: number = pid2Res.rows[0].pid;

      // 2. Client 1 begins transaction and executes 30,000 payment (holds FOR UPDATE row lock)
      await client1.query("BEGIN;");
      await setTenantContext(client1, userId);
      await client1.query(`
        SELECT public.record_party_payment(
          p_party_id := $1,
          p_amount := 30000,
          p_trip_id := $2
        );
      `, [partyId, tripId]);

      // 3. Client 2 begins transaction and starts concurrent 30,000 payment (blocks on trip lock)
      await client2.query("BEGIN;");
      await setTenantContext(client2, userId);

      let client2Error: Error | null = null;
      let client2Finished = false;

      const client2Promise = client2
        .query(
          `
          SELECT public.record_party_payment(
            p_party_id := $1,
            p_amount := 30000,
            p_trip_id := $2
          );
        `,
          [partyId, tripId]
        )
        .catch((err: unknown) => {
          client2Error = err as Error;
        })
        .finally(() => {
          client2Finished = true;
        });

      // 4. Deterministic Verification: Observer verifies Client 2 is BLOCKED by Client 1 via pg_blocking_pids
      await waitForLockBlock(observerClient, pid2, pid1);
      expect(client2Finished).toBe(false); // Proves Client 2 is waiting and has not proceeded

      // 5. Client 1 commits (releases row lock)
      await client1.query("COMMIT;");

      // 6. Await Client 2 resolution
      await client2Promise;
      expect(client2Finished).toBe(true);
      expect(client2Error).not.toBeNull();
      expect((client2Error as Error | null)?.message).toContain("Payment amount exceeds remaining trip balance");

      await client2.query("ROLLBACK;");

      // 7. Final State Verification: Exactly 1 payment recorded ($30,000) and trip balance reflects Client 1 only
      const finalTripCheck = await observerClient.query(
        "SELECT advance_paid, payment_status FROM public.trips WHERE id = $1;",
        [tripId]
      );
      expect(Number(finalTripCheck.rows[0].advance_paid)).toBe(30000);
      expect(finalTripCheck.rows[0].payment_status).toBe("partial");

      const finalPaymentCount = await observerClient.query(
        "SELECT count(*) FROM public.payments WHERE trip_id = $1;",
        [tripId]
      );
      expect(Number(finalPaymentCount.rows[0].count)).toBe(1);
    } finally {
      await client1.end().catch(() => {});
      await client2.end().catch(() => {});
      await observerClient.end().catch(() => {});
    }
  });
});
