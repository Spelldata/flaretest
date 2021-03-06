"use strict";

import SingleURLTest from "./SingleURLTest";

interface FlareTestOptions {
  userAgents: object;
}

interface FlareTestConfig   {
  paths: string[];
  cached?: boolean;
  gzip?: boolean;
  redirectHttps?: boolean;
  status?: number;
  redirectTo?: string;
  cacheLevel?: string;
}

export class FlareTest {
  private hostname: string;
  private userAgents: object;

  public constructor(hostname: string, options: FlareTestOptions) {
    this.hostname = hostname;
    this.userAgents = options.userAgents;
  }

  public async run(configs: FlareTestConfig[]) {
    const self = this;

    for (const config of configs) {
      for (const path of config.paths) {
        for (const [ deviceType, userAgentString ] of Object.entries(self.userAgents)) {
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
        }
      }
    }
  }
}
