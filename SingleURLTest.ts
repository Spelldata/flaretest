"use strict";

import { expect } from "chai";
import fetch from "node-fetch";
import { Headers, Response } from "node-fetch";

import { randomStr } from "./utils";

interface SingleURLTestOptions {
  userAgent: string;
  cached: boolean;
  gzip: boolean;
  redirectHttps: boolean;
  status: number;
  redirectTo: string;
  cacheLevel: string;
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
    this.res = await this.fetch("https://" + this.hostname + this.path);

    if (this.cached === true) {
      this.assertCached();
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

    if (this.status) {
      this.expectStatusCode(this.status);
    }

    if (this.redirectTo) {
      this.assertRedirect();
    }

    if (this.cacheLevel === "standard") {
      await this.assertCacheLevelIsStandard();
    } else if (this.cacheLevel === "ignoreQueryString") {
      expect.fail("ignoreQueryString is not yet supported.");
    } else if (this.cacheLevel === "noQueryString") {
      expect.fail("noQueryString is not yet supported.");
    } else if (typeof this.cacheLevel === "string") {
      expect.fail("Unsupported cacheLevel: " + this.cacheLevel);
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
      expect(cfCacheStatus).to.equal("HIT");
    } else if (cfCacheStatus === "MISS" || cfCacheStatus === "EXPIRED") {
      if (!isRetry) {
        const secondRes = await this.fetch(res.url);
        await this.assertCached(secondRes, true);
      } else {
        expect.fail("CF-Cache-Status might always be MISS or EXPIRED");
      }
    } else {
      expect.fail("CF-Cache-Status is not HIT | MISS | EXPIRED but " + cfCacheStatus);
    }
  };

  /** Assert if the content is NOT cached. */
  private async assertNotCached(res: Response = this.res, isRetry: boolean = false) {
    const cfCacheStatus = res.headers.get("CF-Cache-Status");

    if (cfCacheStatus === null) {
      expect(cfCacheStatus).to.be.null; // Success
    } else if (cfCacheStatus === "MISS") {
      if (isRetry) { // If always MISS
        expect(cfCacheStatus).to.equal("MISS"); // Success
      } else {
        const secondRes = await this.fetch(res.url);
        await this.assertNotCached(secondRes, true);
      }
    } else if (cfCacheStatus === "HIT"){
      expect.fail("Expected no CF-Cache-Status but actually HIT");
    } else {
      expect.fail(`Unexpected CF-Cache-Status value ${cfCacheStatus}`);
    }
  };

  /** Assert if the content is gzipped. */
  private assertGzipped() {
    expect(
      this.res.headers.get("Content-Encoding"),
      Array.from(this.res.headers.entries()).map(([ key,val ]) => `${key}: ${val}`)
    ).to.equal("gzip");
  };

  /** Assert if the content is NOT gzipped. */
  private assertNotGzipped() {
    expect(this.res.headers.get("Content-Encoding")).to.be.null;
  };

  /** Assert if HTTPS redirect is enabled. */
  private async assertHTTPSRedirectEnabled() {
    const res: Response = await this.fetch("http://" + this.hostname + this.path);

    expect(res.status).to.equal(301);
    expect(res.headers.get("Location"))
      .to.equal(`https://${this.hostname}${this.path}`);
  };

  /** Assert if HTTPS redirect is disabled. */
  private async assertHTTPSRedirectDisabled() {
    const url = "http://" + this.hostname + this.path;
    const res: Response = await this.fetch(url);

    expect(res.url).to.equal(url);
    expect(res.status).not.to.equal(301);
    expect(res.status).to.equal(200);
  };

  /** Assert if 200 returned. */
  private expectStatusCode(statusCode: number) {
    expect(this.res.status).to.equal(statusCode);
  };

  /** Assert if redirected to the expected URL. */
  private assertRedirect() {
    expect(this.res.status).to.equal(301);
    expect(this.redirectTo).to.equal(this.res.headers.get("Location"));
  };

  /** Assert if Cloudflare delivers a different resource each time the query string changes. */
  private async assertCacheLevelIsStandard() {
    const url1 = `https://${this.hostname}${this.path}?${randomStr(12)}=${randomStr(12)}`;
    const url2 = `https://${this.hostname}${this.path}?${randomStr(12)}=${randomStr(12)}`;

    // First access to url1 should be MISS
    console.log("Accessing " + url1);
    const res1_1st = await this.fetch(url1);
    expect(res1_1st.headers.get("CF-Cache-Status")).to.equals("MISS");

    // Second access to url1 should be HIT
    const res1_2nd = await this.fetch(url1);
    expect(res1_2nd.headers.get("CF-Cache-Status")).to.equals("HIT");

    // First access to url2 should be MISS
    console.log("Accessing " + url2);
    const res2_1st  = await this.fetch(url2);
    expect(res2_1st.headers.get("CF-Cache-Status")).to.equals("MISS");

    // Second access to url2 should be HIT
    const res2_2nd = await this.fetch(url2);
    expect(res2_2nd.headers.get("CF-Cache-Status")).to.equals("HIT");
  };

  private async fetch(url: string): Promise<Response> {
    return fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: new Headers({
        "User-Agent": this.userAgent,
      }),
    });
  }
}
