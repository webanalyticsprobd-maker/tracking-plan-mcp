import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { JsonStorage } from "../src/storage/jsonStorage.js";
import { TrackingPlanService } from "../src/services/trackingPlanService.js";
import { ErrorCode } from "../src/models/tracking.js";

describe("validateTrackingEvent Service & Tool", () => {
  let tempDir: string;
  let tempFilePath: string;
  let service: TrackingPlanService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-test-"));
    tempFilePath = path.join(tempDir, "test-tracking-plans.json");
    const storage = new JsonStorage(tempFilePath);
    service = new TrackingPlanService(storage);

    await service.createTrackingPlan({
      id: "test-ecom-plan",
      name: "Ecommerce Plan",
      business_type: "ecommerce",
      platform: "GA4",
      events: [
        {
          name: "view_item",
          description: "View item",
          category: "ecommerce",
          required_parameters: [
            { name: "currency", type: "string", description: "Currency", required: true },
            { name: "value", type: "number", description: "Value", required: true },
            { name: "items", type: "array", description: "Items array", required: true },
          ],
        },
        {
          name: "add_to_cart",
          description: "Add to cart",
          category: "ecommerce",
          required_parameters: [
            { name: "currency", type: "string", description: "Currency", required: true },
            { name: "value", type: "number", description: "Value", required: true },
            { name: "items", type: "array", description: "Items array", required: true },
          ],
        },
        {
          name: "purchase",
          description: "Purchase event",
          category: "ecommerce",
          required_parameters: [
            { name: "transaction_id", type: "string", description: "Order ID", required: true },
            { name: "value", type: "number", description: "Value", required: true },
            { name: "currency", type: "string", description: "Currency", required: true },
            { name: "items", type: "array", description: "Items", required: true },
          ],
        },
      ],
    });

    await service.createTrackingPlan({
      id: "test-lead-plan",
      name: "Lead Generation Plan",
      business_type: "lead_generation",
      platform: "GA4",
      events: [
        {
          name: "generate_lead",
          description: "Lead generated",
          category: "lead_generation",
          required_parameters: [
            { name: "form_id", type: "string", description: "Form ID", required: true },
            { name: "form_name", type: "string", description: "Form Name", required: true },
          ],
          optional_parameters: [
            { name: "service_name", type: "string", description: "Service", required: false },
            { name: "value", type: "number", description: "Lead Value", required: false },
          ],
        },
        {
          name: "form_submit",
          description: "Form submit",
          category: "lead_generation",
          required_parameters: [
            { name: "form_id", type: "string", description: "Form ID", required: true },
          ],
        },
        {
          name: "appointment_booked",
          description: "Appointment booked",
          category: "lead_generation",
          required_parameters: [
            { name: "appointment_id", type: "string", description: "Appt ID", required: true },
            { name: "service_name", type: "string", description: "Service", required: true },
          ],
        },
      ],
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("11. Ecommerce: Validate valid 'view_item' event", async () => {
    const eventPayload = {
      name: "view_item",
      currency: "USD",
      value: 29.99,
      items: [{ item_id: "P1", item_name: "T-Shirt" }],
    };

    const res = await service.validateTrackingEvent("test-ecom-plan", eventPayload);
    expect(res.valid).toBe(true);
    expect(res.business_type).toBe("ecommerce");
    expect(res.errors).toHaveLength(0);
  });

  it("12. Ecommerce: Validate valid 'add_to_cart' event", async () => {
    const eventPayload = {
      name: "add_to_cart",
      currency: "USD",
      value: 59.98,
      items: [{ item_id: "P1", item_name: "T-Shirt", quantity: 2 }],
    };

    const res = await service.validateTrackingEvent("test-ecom-plan", eventPayload);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("13. Ecommerce: Validate valid 'purchase' event", async () => {
    const eventPayload = {
      name: "purchase",
      transaction_id: "T_998877",
      value: 120.0,
      currency: "USD",
      items: [{ item_id: "SKU1", price: 120.0 }],
    };

    const res = await service.validateTrackingEvent("test-ecom-plan", eventPayload);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("14. Ecommerce: Detect missing purchase parameter (transaction_id)", async () => {
    const eventPayload = {
      name: "purchase",
      value: 120.0,
      currency: "USD",
      items: [{ item_id: "SKU1" }],
    };

    const res = await service.validateTrackingEvent("test-ecom-plan", eventPayload);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.parameter === "transaction_id")).toBe(true);
    expect(res.errors[0].code).toBe(ErrorCode.MISSING_REQUIRED_PARAMETER);
  });

  it("15. Ecommerce: Detect invalid parameter type (value as string)", async () => {
    const eventPayload = {
      name: "purchase",
      transaction_id: "T123",
      value: "120.00",
      currency: "USD",
      items: [],
    };

    const res = await service.validateTrackingEvent("test-ecom-plan", eventPayload);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.parameter === "value")).toBe(true);
    expect(res.errors[0].code).toBe(ErrorCode.INVALID_PARAMETER_TYPE);
  });

  it("16. LeadGen: Validate valid 'generate_lead' event", async () => {
    const eventPayload = {
      name: "generate_lead",
      form_id: "contact_form_01",
      form_name: "HVAC Quote Form",
      service_name: "AC Repair",
      value: 150,
    };

    const res = await service.validateTrackingEvent("test-lead-plan", eventPayload);
    expect(res.valid).toBe(true);
    expect(res.business_type).toBe("lead_generation");
    expect(res.errors).toHaveLength(0);
  });

  it("17. LeadGen: Validate valid 'form_submit' event", async () => {
    const eventPayload = {
      name: "form_submit",
      form_id: "lead_form_v2",
    };

    const res = await service.validateTrackingEvent("test-lead-plan", eventPayload);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("18. LeadGen: Validate valid 'appointment_booked' event", async () => {
    const eventPayload = {
      name: "appointment_booked",
      appointment_id: "APPT_4455",
      service_name: "Roofing Consultation",
    };

    const res = await service.validateTrackingEvent("test-lead-plan", eventPayload);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("19. LeadGen: Detect missing lead parameter (form_id)", async () => {
    const eventPayload = {
      name: "generate_lead",
      form_name: "HVAC Quote Form",
    };

    const res = await service.validateTrackingEvent("test-lead-plan", eventPayload);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.parameter === "form_id")).toBe(true);
  });

  it("20. LeadGen: Detect invalid lead parameter type (service_name as number)", async () => {
    const eventPayload = {
      name: "generate_lead",
      form_id: "form1",
      form_name: "Form One",
      service_name: 12345,
    };

    const res = await service.validateTrackingEvent("test-lead-plan", eventPayload);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.parameter === "service_name")).toBe(true);
  });

  it("21. Should return EVENT_NOT_FOUND error for unknown event", async () => {
    const eventPayload = {
      name: "non_existent_event",
    };

    const res = await service.validateTrackingEvent("test-ecom-plan", eventPayload);
    expect(res.valid).toBe(false);
    expect(res.errors[0].code).toBe(ErrorCode.EVENT_NOT_FOUND);
  });

  it("22. Should generate warnings for unexpected parameters while remaining valid", async () => {
    const eventPayload = {
      name: "form_submit",
      form_id: "form_123",
      random_extra_param: "unexpected_value",
    };

    const res = await service.validateTrackingEvent("test-lead-plan", eventPayload);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0].parameter).toBe("random_extra_param");
  });
});
