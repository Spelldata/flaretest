"use strict";

import SingleURLTest from "./SingleURLTest";

interface FlareTestOptions {
  userAgents: object;
}

interface FlareTestConfig   {
  paths: string[];
  cached: boolean;
  gzip: boolean;
  redirectHttps: boolean;
  status: number;
  redirectTo: string;
  cacheLevel: string;
}

export default class FlareTest {
  private hostname: string;
  private userAgents: object;

  public constructor(hostname: string, options: FlareTestOptions) {
    this.hostname = hostname;
    this.userAgents = options.userAgents;
  }

  public run(configs: FlareTestConfig[]) {
    const self = this;

    describe("Cloudflare Pages", function() {
      this.timeout(10000);

      for (const config of configs) {
        for (const path of config.paths) {
          for (const [ deviceType, userAgentString ] of Object.entries(self.userAgents)) {
            it(`${path} (${deviceType})`, async function() {
              const singleURLTest = new SingleURLTest(self.hostname, path, {
                userAgent: userAgentString,
                cached: config.cached,
                gzip: config.gzip,
                redirectHttps: config.redirectHttps,
                status: config.status,
                redirectTo: config.redirectTo,
                cacheLevel: config.cacheLevel,
              });
              await singleURLTest.run();
            });
          }
        }
      }
    });
  }
}
