import {
  TrackingPlan,
  TrackingPlanSchema,
  BusinessType,
  ErrorCode,
  TrackingPlanError,
  ValidationResult,
  ValidationIssue,
  ParameterType,
} from "../models/tracking.js";
import { JsonStorage } from "../storage/jsonStorage.js";

export class TrackingPlanService {
  private storage: JsonStorage;

  constructor(storage?: JsonStorage) {
    this.storage = storage || new JsonStorage();
  }

  public async createTrackingPlan(planInput: any): Promise<TrackingPlan> {
    const parseResult = TrackingPlanSchema.safeParse({
      ...planInput,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      if (firstError.path.includes("business_type")) {
        throw new TrackingPlanError(
          ErrorCode.INVALID_BUSINESS_TYPE,
          `Invalid business_type '${planInput.business_type}'. Must be 'ecommerce' or 'lead_generation'.`
        );
      }
      throw new TrackingPlanError(
        ErrorCode.INVALID_INPUT,
        `Invalid tracking plan input: ${firstError.message}`,
        parseResult.error.format()
      );
    }

    const plan = parseResult.data;

    const existingPlans = await this.storage.readAll();
    const isDuplicate = existingPlans.some((p) => p.id === plan.id);
    if (isDuplicate) {
      throw new TrackingPlanError(
        ErrorCode.TRACKING_PLAN_ALREADY_EXISTS,
        `Tracking plan with ID '${plan.id}' already exists.`
      );
    }

    existingPlans.push(plan);
    await this.storage.writeAll(existingPlans);
    return plan;
  }

  public async getTrackingPlan(planId: string): Promise<TrackingPlan> {
    if (!planId) {
      throw new TrackingPlanError(ErrorCode.INVALID_INPUT, "plan_id is required.");
    }
    const plans = await this.storage.readAll();
    const found = plans.find((p) => p.id === planId);
    if (!found) {
      throw new TrackingPlanError(
        ErrorCode.TRACKING_PLAN_NOT_FOUND,
        `Tracking plan with ID '${planId}' was not found.`
      );
    }
    return found;
  }

  public async listTrackingPlans(businessType?: BusinessType): Promise<
    Array<{ id: string; name: string; business_type: BusinessType; platform: string }>
  > {
    const plans = await this.storage.readAll();
    let filtered = plans;

    if (businessType) {
      if (businessType !== "ecommerce" && businessType !== "lead_generation") {
        throw new TrackingPlanError(
          ErrorCode.INVALID_BUSINESS_TYPE,
          `Invalid business_type filter '${businessType}'. Must be 'ecommerce' or 'lead_generation'.`
        );
      }
      filtered = plans.filter((p) => p.business_type === businessType);
    }

    return filtered.map((p) => ({
      id: p.id,
      name: p.name,
      business_type: p.business_type,
      platform: p.platform,
    }));
  }

  public async validateTrackingEvent(planId: string, eventInput: any): Promise<ValidationResult> {
    const plan = await this.getTrackingPlan(planId);

    if (!eventInput || typeof eventInput !== "object") {
      throw new TrackingPlanError(
        ErrorCode.INVALID_INPUT,
        "Event input payload must be an object."
      );
    }

    const eventName = eventInput.name || eventInput.event;
    if (!eventName || typeof eventName !== "string") {
      throw new TrackingPlanError(
        ErrorCode.INVALID_EVENT,
        "Event payload must contain a valid string 'name' or 'event' property."
      );
    }

    const targetEvent = plan.events.find((e) => e.name === eventName);
    if (!targetEvent) {
      return {
        valid: false,
        business_type: plan.business_type,
        event: eventName,
        errors: [
          {
            code: ErrorCode.EVENT_NOT_FOUND,
            message: `Event '${eventName}' is not defined in tracking plan '${planId}'.`,
          },
        ],
        warnings: [],
      };
    }

    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    const providedParams = eventInput.parameters || eventInput.params || eventInput;

    for (const reqParam of targetEvent.required_parameters) {
      const value = providedParams[reqParam.name];
      if (value === undefined || value === null) {
        errors.push({
          code: ErrorCode.MISSING_REQUIRED_PARAMETER,
          parameter: reqParam.name,
          message: `Missing required parameter '${reqParam.name}' (${reqParam.description || "no description"}).`,
        });
      } else {
        const typeMatch = this.checkTypeMatch(value, reqParam.type);
        if (!typeMatch) {
          errors.push({
            code: ErrorCode.INVALID_PARAMETER_TYPE,
            parameter: reqParam.name,
            message: `Parameter '${reqParam.name}' must be of type '${reqParam.type}', but received '${this.getValueType(value)}'.`,
          });
        }
      }
    }

    for (const optParam of targetEvent.optional_parameters || []) {
      const value = providedParams[optParam.name];
      if (value !== undefined && value !== null) {
        const typeMatch = this.checkTypeMatch(value, optParam.type);
        if (!typeMatch) {
          errors.push({
            code: ErrorCode.INVALID_PARAMETER_TYPE,
            parameter: optParam.name,
            message: `Optional parameter '${optParam.name}' must be of type '${optParam.type}', but received '${this.getValueType(value)}'.`,
          });
        }
      }
    }

    const expectedParamNames = new Set([
      "name",
      "event",
      "parameters",
      "params",
      ...targetEvent.required_parameters.map((p) => p.name),
      ...(targetEvent.optional_parameters || []).map((p) => p.name),
    ]);

    const actualKeys = Object.keys(providedParams);
    for (const key of actualKeys) {
      if (!expectedParamNames.has(key)) {
        warnings.push({
          code: ErrorCode.INVALID_INPUT,
          parameter: key,
          message: `Unexpected parameter '${key}' provided. It is not defined in the tracking plan schema.`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      business_type: plan.business_type,
      event: eventName,
      errors,
      warnings,
    };
  }

  public checkTypeMatch(value: any, expectedType: ParameterType): boolean {
    if (value === null || value === undefined) return false;

    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "integer":
        return typeof value === "number" && Number.isInteger(value);
      case "boolean":
        return typeof value === "boolean";
      case "object":
        return typeof value === "object" && !Array.isArray(value);
      case "array":
        return Array.isArray(value);
      default:
        return false;
    }
  }

  private getValueType(value: any): string {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    if (typeof value === "number" && Number.isInteger(value)) return "integer";
    return typeof value;
  }
}
