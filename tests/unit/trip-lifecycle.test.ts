import { describe, it, expect } from "vitest";

type TripStatus = "pending" | "dispatched" | "in_transit" | "delivered" | "cancelled";

const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  pending: ["dispatched", "cancelled"],
  dispatched: ["in_transit", "cancelled"],
  in_transit: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

function canTransitionTrip(from: TripStatus, to: TripStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

describe("Trip Lifecycle Transition Invariants", () => {
  it("allows valid forward transition from 'pending' to 'dispatched'", () => {
    expect(canTransitionTrip("pending", "dispatched")).toBe(true);
  });

  it("allows valid forward transition from 'dispatched' to 'in_transit'", () => {
    expect(canTransitionTrip("dispatched", "in_transit")).toBe(true);
  });

  it("allows valid forward transition from 'in_transit' to 'delivered'", () => {
    expect(canTransitionTrip("in_transit", "delivered")).toBe(true);
  });

  it("allows cancellation from 'pending', 'dispatched', and 'in_transit'", () => {
    expect(canTransitionTrip("pending", "cancelled")).toBe(true);
    expect(canTransitionTrip("dispatched", "cancelled")).toBe(true);
    expect(canTransitionTrip("in_transit", "cancelled")).toBe(true);
  });

  it("rejects skipping intermediate states (e.g. 'pending' directly to 'in_transit')", () => {
    expect(canTransitionTrip("pending", "in_transit")).toBe(false);
    expect(canTransitionTrip("pending", "delivered")).toBe(false);
  });

  it("rejects backwards transition from 'delivered' to 'pending'", () => {
    expect(canTransitionTrip("delivered", "pending")).toBe(false);
  });

  it("rejects any transitions originating from 'delivered' state", () => {
    expect(canTransitionTrip("delivered", "dispatched")).toBe(false);
    expect(canTransitionTrip("delivered", "cancelled")).toBe(false);
  });

  it("rejects any transitions originating from 'cancelled' state", () => {
    expect(canTransitionTrip("cancelled", "pending")).toBe(false);
    expect(canTransitionTrip("cancelled", "dispatched")).toBe(false);
    expect(canTransitionTrip("cancelled", "in_transit")).toBe(false);
    expect(canTransitionTrip("cancelled", "delivered")).toBe(false);
  });
});

