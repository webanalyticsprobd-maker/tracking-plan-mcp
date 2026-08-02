import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TrackingPlanService } from "./services/trackingPlanService.js";

import {
  createTrackingPlanToolSchema,
  handleCreateTrackingPlan,
} from "./tools/createTrackingPlan.js";
import {
  getTrackingPlanToolSchema,
  handleGetTrackingPlan,
} from "./tools/getTrackingPlan.js";
import {
  listTrackingPlansToolSchema,
  handleListTrackingPlans,
} from "./tools/listTrackingPlans.js";
import {
  validateTrackingEventToolSchema,
  handleValidateTrackingEvent,
} from "./tools/validateTrackingEvent.js";

const trackingService = new TrackingPlanService();

const server = new McpServer({
  name: "tracking-plan-mcp",
  version: "1.0.0",
});

server.tool(
  "create_tracking_plan",
  "Creates a new tracking plan specification for an ecommerce or lead-generation business.",
  createTrackingPlanToolSchema,
  async (input) => handleCreateTrackingPlan(trackingService, input)
);

server.tool(
  "get_tracking_plan",
  "Retrieves a complete tracking plan definition by plan_id.",
  getTrackingPlanToolSchema,
  async (input) => handleGetTrackingPlan(trackingService, input)
);

server.tool(
  "list_tracking_plans",
  "Lists all available tracking plans with optional filtering by business_type ('ecommerce' or 'lead_generation').",
  listTrackingPlansToolSchema,
  async (input) => handleListTrackingPlans(trackingService, input)
);

server.tool(
  "validate_tracking_event",
  "Validates an analytics tracking event payload against a target tracking plan schema.",
  validateTrackingEventToolSchema,
  async (input) => handleValidateTrackingEvent(trackingService, input)
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tracking Plan MCP Server initialized and listening on stdio.");
}

main().catch((error) => {
  console.error("Fatal error during Tracking Plan MCP Server initialization:", error);
  process.exit(1);
});
