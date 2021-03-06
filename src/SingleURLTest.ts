"use strict";

import { strict as assert } from "assert";
import fetch from "node-fetch";
import { Headers, Response } from "node-fetch";

import { randomStr, sleep, generateHttpInfo } from "./utils";

interface SingleURLTestOptions {
  userAgent: string;
  cached?: boolean;
  gzip?: boolean;
  redirectHttps?: boolean;
  status?: number;
  redirectTo?: string;
  cacheLevel?: string;
}

export default class SingleURLTest {
  private hostname: string;
  private path: string;
  private userAgent: string;
  private cached: boolean;
  private gzip: boolean;
  private redirectHttps: boolean;
  private status: number;
  private redirectTo: string;
  private cacheLevel: string;
  private res: Response;

  public constructor(hostname: string, path: string, options: SingleURLTestOptions) {
    this.hostname = hostname;
    this.path = path;
    this.userAgent = options.userAgent;
    this.cached = options.cached;
    this.gzip = options.gzip;
    this.redirectHttps = options.redirectHttps;
    this.status = options.status;
    this.redirectTo = options.redirectTo;
    this.cacheLevel = options.cacheLevel;
  }

  public async run() {
    // Cache level tests must be done before any access is made.
    // If the page is accessed before, the page is cached in the Cloudflare edge and
    // the test would fail even if the page is configured correctly.
    if (this.cacheLevel === "standard") {
      await this.assertCacheLevelIsStandard();
    } else if (this.cacheLevel === "ignoreQueryString") {
      await this.assertCacheLevelIsIgnoreQueryString();
    } else if (this.cacheLevel === "noQueryString") {
      assert.fail("noQueryString is not yet supported.");
    } else if (typeof this.cacheLevel === "string") {
      assert.fail("Unsupported cacheLevel: " + this.cacheLevel);
    }

    this.res = await this.fetch("https://" + this.hostname + this.path);

    if (this.status) {
      this.expectStatusCode(this.status);
    }

    if (this.cached === true) {
      await this.assertCached();
    } else if (this.cached === false) {
      await this.assertNotCached();
    }

    if (this.gzip === true) {
      this.assertGzipped();
    } else if (this.gzip === false) {
      this.assertNotGzipped();
    }

    if (this.redirectHttps === true) {
      await this.assertHTTPSRedirectEnabled();
    } else if (this.redirectHttps === false) {
      await this.assertHTTPSRedirectDisabled();
    }

    if (this.redirectTo) {
      this.assertRedirect();
    }
  }

  /**
   * Assert if the content is cached.
   *
   * @param {Response} res - The response object to assert.
   * @param {boolean} isRetry - If this access is the retry.
   */
  private async assertCached(res: Response = this.res, isRetry: boolean = false) {
    const cfCacheStatus = res.headers.get("CF-Cache-Status");

    if (cfCacheStatus === "HIT") {
      // Success
    } else if (
      cfCacheStatus === "MISS" ||
      cfCacheStatus === "EXPIRED" ||
      cfCacheStatus === "BYPASS" ||
      cfCacheStatus === "REVALIDATED" ||
      cfCacheStatus === "UPDATING"
    ) {
      if (!isRetry) {
        const secondRes = await this.fetch(res.url);
        await this.assertCached(secondRes, true);
      } else {
        assert.fail(`CF-Cache-Status might always be ${cfCacheStatus}.
${generateHttpInfo(res)}`);
      }
    } else {
      assert.fail(`CF-Cache-Status is not HIT | MISS | EXPIRED but ${cfCacheStatus}.
${generateHttpInfo(res)}`);
    }
  };

  /** Assert if the content is NOT cached. */
  private async assertNotCached(res: Response = this.res, isRetry: boolean = false) {
    const cfCacheStatus = res.headers.get("CF-Cache-Status");

    if (cfCacheStatus === null || cfCacheStatus === "DYNAMIC") {
      // Success
    } else if (cfCacheStatus === "MISS") {
      if (isRetry) { // If always MISS
        // Success
      } else {
        const secondRes = await this.fetch(res.url);
        await this.assertNotCached(secondRes, true);
      }
    } else if (
      cfCacheStatus === "HIT" ||
      cfCacheStatus === "REVALIDATED" ||
      cfCacheStatus === "UPDATING"
    ){
      assert.fail(`Expected no CF-Cache-Status but actually ${cfCacheStatus}.
${generateHttpInfo(res)}`);
    } else {
      assert.fail(`Unexpected CF-Cache-Status value ${cfCacheStatus}.
${generateHttpInfo(res)}`);
    }
  };

  /** Assert if the content is gzipped. */
  private assertGzipped() {
    const contentEncoding = this.res.headers.get("Content-Encoding");
    assert.strictEqual(
      contentEncoding, "gzip",
      `Expected Content-Encoding to be \"gzip\", but actually ${contentEncoding}
${generateHttpInfo(this.res)}`,
    );
  };

  /** Assert if the content is NOT gzipped. */
  private assertNotGzipped() {
    const contentEncoding = this.res.headers.get("Content-Encoding");
    assert.strictEqual(
      contentEncoding, null,
      `Expected Content-Encoding NOT to be set but actually ${contentEncoding} returned.
${generateHttpInfo(this.res)}`,
    );
  };

  /** Assert if HTTPS redirect is enabled. */
  private async assertHTTPSRedirectEnabled() {
    const res: Response = await this.fetch("http://" + this.hostname + this.path);

    const actualRedirectLocation = res.headers.get("Location");

    const errMsg = `Expected HTTPS redirection enabled but actually disabled. (Actually HTTP status code is ${res.status} and redirecting to ${actualRedirectLocation}.
${generateHttpInfo(res)}`;

    assert.strictEqual(res.status, 301, errMsg);
    assert.strictEqual(actualRedirectLocation, `https://${this.hostname}${this.path}`, `Expected HTTPS redirection but actually redirected somewhere different.
${generateHttpInfo(res)}`);
  };

  /** Assert if HTTPS redirect is disabled. */
  private async assertHTTPSRedirectDisabled() {
    const url = "http://" + this.hostname + this.path;
    const res: Response = await this.fetch(url);

    assert.notStrictEqual(
      res.status, 301,
      "Expected status code NOT to be 30x, but actually 301 returned."
    );
    assert.notStrictEqual(
      res.status, 302,
      "Expected status code NOT to be 30x, but actually 302 returned.\n" + generateHttpInfo(res)
    );
    const location = res.headers.get("Location");
    assert.strictEqual(
      location, null,
      `Expected no Location header field exists, but actually it exists and points to ${location}.
${generateHttpInfo(res)}`
    );
  };

  /** Assert if expected status code is returned. */
  private expectStatusCode(statusCode: number) {
    assert.strictEqual(
      this.res.status, statusCode,
      `Expected HTTP status code ${statusCode}, but actually ${this.res.status} returned.
${generateHttpInfo(this.res)}`,
    );
  };

  /** Assert if redirected to the expected URL. */
  private assertRedirect() {
    assert.strictEqual(
      this.res.status, 301,
      `Expected HTTP status code 301, but actually ${this.res.status} returned.`,
    );
    const location = this.res.headers.get("Location");
    assert.strictEqual(
      location, this.redirectTo,
      `Expected redirection to ${this.redirectTo}, but actually ${location ? "redirected to " + location : "no Location header found"}
${generateHttpInfo(this.res)}`,
    );
  };

  /** Assert if Cloudflare delivers a different resource each time the query string changes. */
  private async assertCacheLevelIsStandard() {
    // TODO allow path with query string
    // Currently if e.g. /foo?bar=boo is given,
    // the URLs will be /foo?bar=boo?ztlGaZfgDIzR=APkglmNsNFOg
    const url1 = `https://${this.hostname}${this.path}?${randomStr(12)}=${randomStr(12)}`;
    const url2 = `https://${this.hostname}${this.path}?${randomStr(12)}=${randomStr(12)}`;

    // First access to url1 should be MISS
    console.log("Accessing " + url1);
    const res1_1st = await this.fetch(url1);
    assert.strictEqual(
      res1_1st.headers.get("CF-Cache-Status"), "MISS",
      `In the first access for the first URL ${url1}, CF-Cache-Status should be MISS but actually ${res1_1st.headers.get("CF-Cache-Status")}. Did you purge cache before the test?
${generateHttpInfo(res1_1st)}`
    );

    // Second access to url1 should be HIT
    const res1_2nd = await this.fetch(url1);
    assert.strictEqual(
      res1_2nd.headers.get("CF-Cache-Status"), "HIT",
      `In the second access for the first URL ${url1}, CF-Cache-Status should be HIT but actually ${res1_2nd.headers.get("CF-Cache-Status")}. Maybe this URL is not cached.

${generateHttpInfo(res1_1st, "First Response Information")}

${generateHttpInfo(res1_2nd, "Second Response Information")}`
    );

    // First access to url2 should be MISS
    console.log("Accessing " + url2);
    const res2_1st  = await this.fetch(url2);
    assert.strictEqual(
      res2_1st.headers.get("CF-Cache-Status"), "MISS",
      `In the first access for the second URL ${url2}, CF-Cache-Status should be MISS but actually ${res2_1st.headers.get("CF-Cache-Status")}. Query string might be ignored to cache contents.

${generateHttpInfo(res1_1st, "Response of First Access to First URL")}

${generateHttpInfo(res1_2nd, "Response of Second Access to First URL")}

${generateHttpInfo(res2_1st, "Response of First Access to Second URL")}`,
    );

    // Second access to url2 should be HIT
    const res2_2nd = await this.fetch(url2);
    assert.strictEqual(
      res2_2nd.headers.get("CF-Cache-Status"), "HIT",
      `In the second access for the second URL ${url2}, CF-Cache-Status should be HIT but actually ${res2_2nd.headers.get("CF-Cache-Status")}. Maybe this URL is not cached.

${generateHttpInfo(res1_1st, "Response of First Access to First URL")}

${generateHttpInfo(res1_2nd, "Response of Second Access to First URL")}

${generateHttpInfo(res2_1st, "Response of First Access to Second URL")}

${generateHttpInfo(res2_2nd, "Response of Second Access to Second URL")}`,
    );
  };

  /** Assert if Cloudflare delivers the same resource to everyone independent of the query string. */
  private async assertCacheLevelIsIgnoreQueryString() {
    // TODO allow path with query string
    // Currently if e.g. /foo?bar=boo is given,
    // the URLs will be /foo?bar=boo?ztlGaZfgDIzR=APkglmNsNFOg
    const url1 = `https://${this.hostname}${this.path}?${randomStr(12)}=${randomStr(12)}`;
    const url2 = `https://${this.hostname}${this.path}?${randomStr(12)}=${randomStr(12)}`;

    // First access to url1 should be MISS
    console.log(`Accessing ${url1}`);
    const res1_1st = await this.fetch(url1);
    assert.strictEqual(
      res1_1st.headers.get("CF-Cache-Status"), "MISS",
      `In the first access for the first URL ${url1}, CF-Cache-Status should be MISS but actually ${res1_1st.headers.get("CF-Cache-Status")}. Did you purge cache before the test?

${generateHttpInfo(res1_1st)}`
    );

    // Second access to url1 should be HIT
    console.log(`Accessing ${url1} again`);
    const res1_2nd = await this.fetch(url1);
    assert.strictEqual(
      res1_2nd.headers.get("CF-Cache-Status"), "HIT",
      `In the second access for the first URL ${url1}, CF-Cache-Status should be HIT but actually ${res1_2nd.headers.get("CF-Cache-Status")}. Maybe this URL is not cached.

${generateHttpInfo(res1_1st, "First Response Information")}

${generateHttpInfo(res1_2nd, "Second Response Information")}`
    );

    // First access to url2 should be HIT
    console.log(`Accessing ${url2}`);
    const res2  = await this.fetch(url2);
    assert.strictEqual(
      res2.headers.get("CF-Cache-Status"), "HIT",
      `In the first access for the second URL ${url2}, CF-Cache-Status should be HIT but actually ${res2.headers.get("CF-Cache-Status")}. Cloudflare may cache by query string.

${generateHttpInfo(res1_1st, "Response of First Access to First URL")}

${generateHttpInfo(res1_2nd, "Response of Second Access to First URL")}

${generateHttpInfo(res2, "Response of First Access to Second URL")}`
    );
  };

  private async fetch(url: string): Promise<Response> {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: new Headers({
        "User-Agent": this.userAgent,
      }),
    });

    await sleep(1000);

    return res;
  }
}
