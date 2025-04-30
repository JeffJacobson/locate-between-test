import { getRouteCount, getRoutes } from "../src/lrs/getRouteIds.ts";
import { env } from "bun";
import { describe, expect, test } from "bun:test";

env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

describe("get routes", () => {
    test("getRouteCount", async () => {
        const { count } = await getRouteCount();
        expect(count).toBeTypeOf("number");
        expect(count).toBeGreaterThan(900);
    });
    test("getRoutes", async () => {
        const routes = await getRoutes();
        expect(routes).toBeArray();
        expect(routes).not.toBeEmpty();
        expect(routes.length).toBeGreaterThan(900);
    });
});