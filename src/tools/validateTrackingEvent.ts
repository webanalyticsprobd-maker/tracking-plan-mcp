import { z } from "zod";
import { TrackingPlanService } from "../services/trackingPlanService.js";
import { TrackingPlanError } from "../models/tracking.js";

export const validateTrackingEventToolSchema = {
  plan_id: z.string().describe("Target tracking plan ID (e.g. 'ecommerce-ga4' or 'leadgen-ga4')"),
  event: z
    .record(z.any())
    .describe(
      "Event payload object to validate, including name/event and parameter key-values"
    ),
};

export async function handleValidateTrackingEvent(
  service: TrackingPlanService,
  input: { plan_id: string; event: Record<string, any> }
) {
  try {
    const result = await service.validateTrackingEvent(input.plan_id, input.event);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    const code = error instanceof TrackingPlanError ? error.code : "INTERNAL_ERROR";
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              valid: false,
              error: {
                code,
                message: error.message || "Failed to validate tracking event.",
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
