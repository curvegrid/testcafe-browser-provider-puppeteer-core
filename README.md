# testcafe-browser-provider-puppeteer-core

This is the **puppeteer-core** browser provider plugin for [TestCafe](http://devexpress.github.io/testcafe).

This package implements the [puppeteer](https://github.com/GoogleChrome/puppeteer) browser automation for [TestCafe](http://devexpress.github.io/testcafe).

This browser provider plugin can:
- connect to remote Chromium instance through the DevTools Protocol
- download a recent Chromium build (if not already downloaded) and use it for the tests
- launch a specific Chromium executable

Same as with the official `puppeteer-core` package, this package doesn't download Chromium when installed.

## Install

```
npm install testcafe-browser-provider-puppeteer-core
```

## Usage

There are two browser aliases available:
- `puppeteer-core:connect`
- `puppeteer-core:launch`

Parameters can be passed to a browser alias using a URL query string (URL encoded or not):
```
puppeteer-core:browser_alias_name?param1=value&param2=value&param3=value
```

### puppeteer-core:connect

`puppeteer-core:connect` connects to a remote Chromium instance through the DevTools Protocol.

Parameters:
- `url`: the url to connect to the remote Chromium instance (defaults to `http://127.0.0.1:9222`).
- `resolve`: whether or not to resolve the hostname in the url as a workaround to the issue described in [GoogleChrome/puppeteer#2242](https://github.com/GoogleChrome/puppeteer/issues/2242) (defaults to false).

Example:

The command below launches a [headless-shell](https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md) build of Chromium in a Docker container:
```sh
docker run -d --rm -p 9222:9222 --entrypoint '/headless-shell/headless-shell' chromedp/headless-shell --no-sandbox --headless --disable-gpu --disable-dev-shm-usage --remote-debugging-address=0.0.0.0 --remote-debugging-port=9222
```

Run the tests using the the Chromium instance launched above:
```sh
testcafe 'puppeteer-core:connect?url=http://127.0.0.1:9222' 'path/to/test/file.js'
```

### puppeteer-core:launch

`puppeteer-core:launch` downloads (optional) and launches a Chromium executable.

Parameters:
- `revision`: revision of the bundled Chromium to download and launch (see https://omahaproxy.appspot.com for the list of revision). Defaults to the `puppeteer-core` package recommended version.
- `path`: path to a Chromium (or Chrome) executable to run instead of the bundled Chromium (optional).
- `headless`: whether or not to run Chromium headless (defaults to `true`).
- `arg`: extra command line arguments to pass to Chromium (repeat the `arg` parameter to pass multiple arguments).

NOTE: if the `path` parameter is used, `revision` is ignored and Chromium won't be downloaded if the executable is not found.

Example:

Run the tests using the bundled Chromium (it will download it if not found locally):
```sh
testcafe 'puppeteer-core:launch' 'path/to/test/file.js'
```

Run the tests using a specific bundled Chromium revision (it will download it if not found locally):
```sh
testcafe 'puppeteer-core:launch?revision=693954' 'path/to/test/file.js'
```

Run the tests using the bundled Chromium (it will download it if not found locally) and the `--no-sandbox` and `--disable-setuid-sandbox` Chromium arguments:
```sh
testcafe 'puppeteer-core:launch?arg=--no-sandbox&arg=--disable-setuid-sandbox' 'path/to/test/file.js'
```

Run the tests using a specific Chromium executable:
```sh
testcafe 'puppeteer-core:launch?path=/my/path/to/chromium' 'path/to/test/file.js'
```

## Development

Please read the Testcafe [browser provider plugin documentation](https://devexpress.github.io/testcafe/documentation/extending-testcafe/browser-provider-plugin/).

To test the browser provider while developing, you can link the browser provider to TestCafe by using the `npm link` command:

First, link the browser provider package:
```sh
cd testcafe-browser-provider-puppeteer-core
npm link
```

Then, to use the local package in your project:
```sh
cd my-project
npm link testcafe-browser-provider-puppeteer-core
```

## Contributing

[Pull requests welcome](https://github.com/curvegrid/testcafe-browser-provider-puppeteer-core/pulls).
