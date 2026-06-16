import { describe, expect, it } from "vitest";

import {
  formatCliHelp,
  parseCliOptions,
  type MutableEnvironment,
} from "../src/cli-options.js";

describe("CLI options", () => {
  it("enables localhost audits when --local is provided", () => {
    const env: MutableEnvironment = {};

    const result = parseCliOptions(["--local"], env);

    expect(result).toEqual({ action: "start" });
    expect(env.LIGHTHOUSE_MCP_ALLOW_LOCALHOST).toBe("true");
  });

  it("prints help without mutating the environment", () => {
    const env: MutableEnvironment = {};

    const result = parseCliOptions(["--help"], env);

    expect(result).toEqual({ action: "help", text: formatCliHelp() });
    expect(env).toEqual({});
  });

  it("rejects unknown flags", () => {
    const env: MutableEnvironment = {};

    const result = parseCliOptions(["--localhost"], env);

    expect(result).toEqual({
      action: "error",
      text: "Unknown option: --localhost\n\n" + formatCliHelp(),
    });
    expect(env).toEqual({});
  });
});
