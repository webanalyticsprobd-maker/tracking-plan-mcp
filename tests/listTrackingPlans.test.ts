import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { JsonStorage } from "../src/storage/jsonStorage.js";
import { TrackingPlanService } from "../src/services/trackingPlanService.js";
import { ErrorCode, TrackingPlanError } from "../src/models/tracking.js";

describe("listTrackingPlans Service & Tool", () => {
  let tempDir: string;
  let tempFilePath: string;
  let service: TrackingPlanService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-test-"));
    tempFilePath = path.join(tempDir, "test-tracking-plans.json");
    const storage = new JsonStorage(tempFilePath);
    service = new TrackingPlanService(storage);

    await service.createTrackingPlan({
      id: "ecom-1",
      name: "Ecom Plan 1",
      business_type: "ecommerce",
      platform: "GA4",
      events: [],
    });

    await service.createTrackingPlan({
      id: "leadgen-1",
      name: "Leadgen Plan 1",
      business_type: "lead_generation",
      platform: "Mixpanel",
      events: [],
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("7. Should list all tracking plans when no filter is provided", async () => {
    const list = await service.listTrackingPlans();
    expect(list).toHaveLength(2);
  });

  it("8. Should filter tracking plans by business_type = 'ecommerce'", async () => {
    const list = await service.listTrackingPlans("ecommerce");
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("ecom-1");
    expect(list[0].business_type).toBe("ecommerce");
  });

  it("9. Should filter tracking plans by business_type = 'lead_generation'", async () => {
    const list = await service.listTrackingPlans("lead_generation");
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("leadgen-1");
    expect(list[0].business_type).toBe("lead_generation");
  });

  it("10. Should throw INVALID_BUSINESS_TYPE for invalid business type filter", async () => {
    try {
      await service.listTrackingPlans("invalid_filter" as any);
    } catch (err: any) {
      expect(err).toBeInstanceOf(TrackingPlanError);
      expect(err.code).toBe(ErrorCode.INVALID_BUSINESS_TYPE);
    }
  });
});
