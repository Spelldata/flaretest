# flaretest

![GitHub Actions](https://github.com/Spelldata/flaretest/workflows/Actions/badge.svg)

Cache rule testing utility for Cloudflare

## Install

```shell
$ yarn add --dev flaretest
```

or

```shell
$ npm install --save-dev flaretest
```

## API

### `new FlareTest(hostname, options)`

- `hostname`: `string` - A hostname of the test target website
- `options.userAgents`: `{ [userAgentName: string]: string }` - User agent strings which FlareTest sends to the test target website

### `FlareTest.prototype.run(testconfigs)`

- `testconfigs`: `object[]` - Array of test configs
- `testconfigs[].paths`: `string[]` - Array of paths to test
- `testconfigs[].cached`: `boolean` - If target paths should be cached by Cloudflare edge
- `testconfigs[].redirectHttps`: `boolean` - If it forces redirection to HTTPS URL when users open the target paths
- `testconfigs[].status`: `number` - Expected status code
- `testconfigs[].cacheLevel`: `string` - Expected cache level. `standart`, `ignoreQueryString`, or `noQueryString`. **You need to purge cache before testing cache level, or the test may fail.** Currently `noQueryString` is not supported yet.

## Example

Here's an example using Jest:

```javascript
import FlareTest from "flaretest";

const flaretest = new FlareTest("example.com", {
  userAgents: {
    desktop: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3163.100 Safari/537.36",
    mobile: "Mozilla/5.0 (Linux; Android 7.1.2; Kingbox Build/NHG47K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/73.0.3653.0 Safari/537.36",
  }
});

test("Cache rules", async () => {
  await flaretest.run([
    {
      paths: [
        "/foo/bar",
        "/boo",
        "/woo.css",
      ],
      cached: true,
      redirectHttps: true,
      status: 200,
    },
    {
      paths: [
        "/path-with-query",
      ],
      cached: true,
      redirectHttps: true,
      status: 200,
      cacheLevel: "standard", // or ignoreQueryString or noQueryString
    },
  ]);
}, 30000);
```
