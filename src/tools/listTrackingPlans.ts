import { z } from "zod";
import { TrackingPlanService } from "../services/trackingPlanService.js";
import { BusinessTypeSchema, TrackingPlanError } from "../models/tracking.js";

export const listTrackingPlansToolSchema = {
  business_type: BusinessTypeSchema.optional().describe(
    "Optional filter by business type: 'ecommerce' or 'lead_generation'"
  ),
};

export async function handleListTrackingPlans(
  service: TrackingPlanService,
  input: { business_type?: any }
) {
  try {
    const plans = await service.listTrackingPlans(input.business_type);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(plans, null, 2),
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
              error: {
                code,
                message: error.message || "Failed to list tracking plans.",
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
