import { z } from "zod";

export const BusinessTypeSchema = z.enum(["ecommerce", "lead_generation"]);
export type BusinessType = z.infer<typeof BusinessTypeSchema>;

export const ParameterTypeSchema = z.enum([
  "string",
  "number",
  "integer",
  "boolean",
  "object",
  "array",
]);
export type ParameterType = z.infer<typeof ParameterTypeSchema>;

export const TrackingParameterSchema = z.object({
  name: z.string().min(1, "Parameter name is required"),
  type: ParameterTypeSchema,
  description: z.string().default(""),
  required: z.boolean().default(false),
});
export type TrackingParameter = z.infer<typeof TrackingParameterSchema>;

export const TrackingEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().default(""),
  category: z.string().default("general"),
  required_parameters: z.array(TrackingParameterSchema).default([]),
  optional_parameters: z.array(TrackingParameterSchema).default([]),
});
export type TrackingEvent = z.infer<typeof TrackingEventSchema>;

export const TrackingPlanSchema = z.object({
  id: z.string().min(1, "Plan ID is required"),
  name: z.string().min(1, "Plan name is required"),
  description: z.string().default(""),
  business_type: BusinessTypeSchema,
  platform: z.string().min(1, "Platform name is required"),
  events: z.array(TrackingEventSchema).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type TrackingPlan = z.infer<typeof TrackingPlanSchema>;

export enum ErrorCode {
  TRACKING_PLAN_NOT_FOUND = "TRACKING_PLAN_NOT_FOUND",
  TRACKING_PLAN_ALREADY_EXISTS = "TRACKING_PLAN_ALREADY_EXISTS",
  EVENT_NOT_FOUND = "EVENT_NOT_FOUND",
  INVALID_EVENT = "INVALID_EVENT",
  MISSING_REQUIRED_PARAMETER = "MISSING_REQUIRED_PARAMETER",
  INVALID_PARAMETER_TYPE = "INVALID_PARAMETER_TYPE",
  INVALID_BUSINESS_TYPE = "INVALID_BUSINESS_TYPE",
  INVALID_INPUT = "INVALID_INPUT",
  STORAGE_ERROR = "STORAGE_ERROR",
}

export class TrackingPlanError extends Error {
  code: ErrorCode;
  details?: any;

  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.name = "TrackingPlanError";
    this.code = code;
    this.details = details;
  }
}

export interface ValidationIssue {
  code: ErrorCode;
  parameter?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  business_type: BusinessType;
  event: string;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}
