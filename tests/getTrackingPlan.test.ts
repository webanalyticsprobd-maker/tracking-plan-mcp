import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { JsonStorage } from "../src/storage/jsonStorage.js";
import { TrackingPlanService } from "../src/services/trackingPlanService.js";
import { ErrorCode, TrackingPlanError } from "../src/models/tracking.js";

describe("getTrackingPlan Service & Tool", () => {
  let tempDir: string;
  let tempFilePath: string;
  let service: TrackingPlanService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-test-"));
    tempFilePath = path.join(tempDir, "test-tracking-plans.json");
    const storage = new JsonStorage(tempFilePath);
    service = new TrackingPlanService(storage);

    await service.createTrackingPlan({
      id: "ecommerce-exist",
      name: "Existing E-commerce Plan",
      business_type: "ecommerce",
      platform: "GA4",
      events: [],
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("5. Should retrieve an existing tracking plan by ID", async () => {
    const plan = await service.getTrackingPlan("ecommerce-exist");
    expect(plan).toBeDefined();
    expect(plan.id).toBe("ecommerce-exist");
    expect(plan.name).toBe("Existing E-commerce Plan");
  });

  it("6. Should throw TRACKING_PLAN_NOT_FOUND when plan does not exist", async () => {
    try {
      await service.getTrackingPlan("non-existent-id");
    } catch (err: any) {
      expect(err).toBeInstanceOf(TrackingPlanError);
      expect(err.code).toBe(ErrorCode.TRACKING_PLAN_NOT_FOUND);
    }
  });
});
