import { Server } from "./testutils";
import FlareTest from "../src/FlareTest";

const flaretest = new FlareTest("localhost", {
  userAgents: {
    desktop: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3163.100 Safari/537.36",
    mobile: "Mozilla/5.0 (Linux; Android 7.1.2; Kingbox Build/NHG47K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/73.0.3653.0 Safari/537.36",
  },
});

let server: Server;

beforeEach(async () => {
  server = new Server({ http: 80, https: 443 });
  await server.start();
});

afterEach(async () => {
  await server.close();
});

test("Cached, force HTTPS redirect, 200", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/cached-https-200",
      ],
      cached: true,
      redirectHttps: true,
      status: 200,
    },
  ])).resolves.toBeUndefined();
}, 10000);

test("Not cached, force HTTPS redirect, 200", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/nocache-https-200",
      ],
      cached: false,
      redirectHttps: true,
      status: 200,
    },
  ])).resolves.toBeUndefined();
}, 10000);

test("Not cached (DYNAMIC), force HTTPS redirect, 200", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/nocache_dynamic-https-200",
      ],
      cached: false,
      redirectHttps: true,
      status: 200,
    },
  ])).resolves.toBeUndefined();
}, 10000);

test("Cached, no HTTPS redirect, 200", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/cached-nohttps-200",
      ],
      cached: true,
      redirectHttps: false,
      status: 200,
    },
  ])).resolves.toBeUndefined();
}, 10000);

test("Not cached, no HTTPS redirect, 200", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/nocache-nohttps-200",
      ],
      cached: false,
      redirectHttps: false,
      status: 200,
    },
  ])).resolves.toBeUndefined();
}, 30000);

test("Not cached, no HTTPS redirect, 200", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/nocache_dynamic-nohttps-200",
      ],
      cached: false,
      redirectHttps: false,
      status: 200,
    },
  ])).resolves.toBeUndefined();
}, 30000);

test("Cache Level: standard", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/cache-level-standard",
      ],
      cached: true,
      status: 200,
      cacheLevel: "standard",
    },
  ])).resolves.toBeUndefined();
}, 30000);

test("Cache Level: ignoreQueryString", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/cache-level-ignore-query-string",
      ],
      cached: true,
      status: 200,
      cacheLevel: "ignoreQueryString",
    },
  ])).resolves.toBeUndefined();
}, 30000);

test("Detect contents which should be cached but actually not cached", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/nocache-https-200",
      ],
      cached: true,
      redirectHttps: true,
      status: 200,
    },
  ])).rejects.toThrow("CF-Cache-Status is not HIT | MISS | EXPIRED but null");
}, 10000);

test("Detect contents which should redirect to HTTPS but actually does not redirect", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/cached-nohttps-200",
      ],
      cached: true,
      redirectHttps: true,
    },
  ])).rejects.toThrow("Expected HTTPS redirection enabled but actually disabled. (Actually HTTP status code is 200 and redirecting to null.");
}, 10000);

test("Detect 500 contents which should return 200", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/cached-https-500",
      ],
      cached: true,
      redirectHttps: true,
      status: 200,
    },
  ])).rejects.toThrow("Expected HTTP status code 200, but actually 500 returned.");
}, 10000);

test("Expected Cache Level: standard, but detected ignoreQueryString", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/cache-level-ignore-query-string",
      ],
      cached: true,
      status: 200,
      cacheLevel: "standard",
    },
  ])).rejects.toThrow(/^In the first access for the second URL https:\/\/localhost\/cache-level-ignore-query-string\?[A-Za-z]+=[A-Za-z]+, CF-Cache-Status should be MISS but actually HIT. Query string might be ignored to cache contents.$/);
}, 30000);

test("Expected Cache Level: ignoreQueryString, but detected standard", async () => {
  await expect(flaretest.run([
    {
      paths: [
        "/cache-level-standard",
      ],
      cached: true,
      status: 200,
      cacheLevel: "ignoreQueryString",
    },
  ])).rejects.toThrow(/^In the first access for the second URL https:\/\/localhost\/cache-level-standard\?[A-Za-z]+=[A-Za-z]+, CF-Cache-Status should be HIT but actually MISS. Cloudflare may cache by query string.$/);
}, 30000);
