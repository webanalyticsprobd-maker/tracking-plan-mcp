import { fsyncSync } from "fs";
import { promises as fs } from "fs";
import path from "path";
import { TrackingPlan, ErrorCode, TrackingPlanError } from "../models/tracking.js";

export class JsonStorage {
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), "data", "tracking-plans.json");
  }

  public getFilePath(): string {
    return this.filePath;
  }

  private async ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err: any) {
      throw new TrackingPlanError(
        ErrorCode.STORAGE_ERROR,
        `Failed to create directory '${dir}': ${err.message}`
      );
    }
  }

  public async readAll(): Promise<TrackingPlan[]> {
    await this.ensureDirectoryExists();
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      if (!data.trim()) {
        return [];
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        throw new Error("Storage content is not an array");
      }
      return parsed as TrackingPlan[];
    } catch (err: any) {
      if (err.code === "ENOENT") {
        await this.writeAll([]);
        return [];
      }
      if (err instanceof SyntaxError || err.message.includes("not an array")) {
        return [];
      }
      throw new TrackingPlanError(
        ErrorCode.STORAGE_ERROR,
        `Error reading storage file: ${err.message}`
      );
    }
  }

  public async writeAll(plans: TrackingPlan[]): Promise<void> {
    await this.ensureDirectoryExists();
    try {
      const jsonContent = JSON.stringify(plans, null, 2);
      await fs.writeFile(this.filePath, jsonContent, "utf-8");
    } catch (err: any) {
      throw new TrackingPlanError(
        ErrorCode.STORAGE_ERROR,
        `Failed to write to storage file '${this.filePath}': ${err.message}`
      );
    }
  }
}
