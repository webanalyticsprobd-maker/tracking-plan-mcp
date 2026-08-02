import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { JsonStorage } from "../src/storage/jsonStorage.js";
import { TrackingPlanService } from "../src/services/trackingPlanService.js";
import { ErrorCode, TrackingPlanError } from "../src/models/tracking.js";

describe("createTrackingPlan Service & Tool", () => {
  let tempDir: string;
  let tempFilePath: string;
  let service: TrackingPlanService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-test-"));
    tempFilePath = path.join(tempDir, "test-tracking-plans.json");
    const storage = new JsonStorage(tempFilePath);
    service = new TrackingPlanService(storage);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("1. Should successfully create a new ecommerce tracking plan", async () => {
    const planInput = {
      id: "test-ecommerce-plan",
      name: "Test E-commerce Plan",
      description: "Plan for testing ecommerce tracking",
      business_type: "ecommerce",
      platform: "GA4",
      events: [
        {
          name: "purchase",
          description: "Completed purchase",
          category: "ecommerce",
          required_parameters: [
            { name: "transaction_id", type: "string", description: "Order ID", required: true },
            { name: "value", type: "number", description: "Total value", required: true },
            { name: "currency", type: "string", description: "Currency", required: true },
            { name: "items", type: "array", description: "Items array", required: true },
          ],
        },
      ],
    };

    const created = await service.createTrackingPlan(planInput);
    expect(created.id).toBe("test-ecommerce-plan");
    expect(created.business_type).toBe("ecommerce");
    expect(created.created_at).toBeDefined();
  });

  it("2. Should successfully create a new lead generation tracking plan", async () => {
    const planInput = {
      id: "test-leadgen-plan",
      name: "Test Lead Gen Plan",
      description: "Plan for testing lead gen tracking",
      business_type: "lead_generation",
      platform: "GA4",
      events: [
        {
          name: "generate_lead",
          description: "Submitted lead form",
          category: "lead_generation",
          required_parameters: [
            { name: "form_id", type: "string", description: "Form ID", required: true },
            { name: "form_name", type: "string", description: "Form Name", required: true },
          ],
        },
      ],
    };

    const created = await service.createTrackingPlan(planInput);
    expect(created.id).toBe("test-leadgen-plan");
    expect(created.business_type).toBe("lead_generation");
  });

  it("3. Should reject creation with duplicate plan ID", async () => {
    const planInput = {
      id: "dup-plan",
      name: "Original Plan",
      business_type: "ecommerce",
      platform: "GA4",
      events: [],
    };

    await service.createTrackingPlan(planInput);

    await expect(service.createTrackingPlan(planInput)).rejects.toThrowError(
      TrackingPlanError
    );

    try {
      await service.createTrackingPlan(planInput);
    } catch (err: any) {
      expect(err.code).toBe(ErrorCode.TRACKING_PLAN_ALREADY_EXISTS);
    }
  });

  it("4. Should reject creation with invalid business_type", async () => {
    const planInput = {
      id: "invalid-biz-plan",
      name: "Invalid Biz Plan",
      business_type: "saas_subscription",
      platform: "GA4",
      events: [],
    };

    try {
      await service.createTrackingPlan(planInput);
    } catch (err: any) {
      expect(err.code).toBe(ErrorCode.INVALID_BUSINESS_TYPE);
    }
  });
});
