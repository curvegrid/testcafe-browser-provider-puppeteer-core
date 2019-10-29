// Copyright (c) 2019 Curvegrid Inc.
//
// Use of this source code is governed by an MIT-style
// license that can be found in the LICENSE file.

/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const puppeteer = require('puppeteer-core');

const browserNames = ['connect', 'launch'];

export default {
    // support for multi browsers
    isMultiBrowser: true,
    // regex for parsing the browser name and options
    _browserRegex:  null,
    // opened browsers
    _browsers:      {},
    // opened pages
    _pages:         {},

    // Initialization
    async init () {
        // build a regex that looks like /^(connect|launch)[?]?(.+)?$/
        this._browserRegex = new RegExp('^(' + browserNames.join('|') + ')[?]?(.+)?$');
    },

    // Required methods
    async openBrowser (id, pageUrl, browserName) {
        const match = browserName.match(this._browserRegex);

        if (!match)
            throw new Error('Invalid browser name: ' + browserName);

        if (!(browserName in this._browsers)) {
            const action = match[1];
            const params = querystring.parse(match[2]);

            switch (action) {
                case 'connect':
                    this._browsers[browserName] = await puppeteer.connect({
                        browserURL: params.url || 'http://127.0.0.1:9222'
                    });
                    break;

                case 'launch':
                    // if no path specified we make sure we have a local browser
                    if (!params.path)
                        await this._downloadBrowser(params.revision);

                    var args = this._toArray(params.arg);

                    args.push(pageUrl);

                    this._browsers[browserName] = await puppeteer.launch({
                        headless:       !(params.headless === 'false'),
                        executablePath: params.path,
                        args:           args
                    });
                    this._pages[id] = (await this._browsers[browserName].pages())[0];
                    this._pages[id].browserName = browserName;
                    return;
            }
        }

        // use a new browser context for 'connect' action and subsequent calls to openBrowser
        const browserContext = await this._browsers[browserName].createIncognitoBrowserContext();

        this._pages[id] = await browserContext.newPage();
        this._pages[id].browserName = browserName;
        await this._pages[id].goto(pageUrl);
    },

    async closeBrowser (id) {
        const browserName = this._pages[id].browserName;
        const browserContext = await this._pages[id].browserContext();

        // close the page
        await this._pages[id].close();
        delete this._pages[id];

        // close the context (the default browser context cannot be closed)
        if (browserContext.isIncognito())
            await browserContext.close();

        // if it's the last page, close the browser
        if ((await this._browsers[browserName].pages()).length === 0) {
            await this._browsers.close();
            delete this._browsers[browserName];
        }
    },

    // Optional methods for multi-browser support
    async getBrowserList () {
        return browserNames;
    },

    async isValidBrowserName (browserName) {
        return browserName.match(this._browserRegex) !== null;
    },

    // Optional extra methods
    async canResizeWindowToDimensions (_id, _width, _height) {
        return true;
    },

    async resizeWindow (id, width, height, _currentWidth, _currentHeight) {
        await this._pages[id].setViewport({ width, height });
    },

    async maximizeWindow (id) {
        // Same logic and env var as testcafe, see:
        // https://github.com/DevExpress/testcafe/blob/master/src/browser/provider/utils/get-maximized-headless-window-size.js
        const sizeString = process.env.MAXIMIZED_HEADLESS_WINDOW_SIZE || '1920x1080';

        const { 0: width, 1: height } = sizeString.split('x').map(str => Number(str));

        this.resizeWindow(id, width, height);
    },

    async takeScreenshot (id, filePath, _pageWidth, _pageHeight, fullPage) {
        const dir = path.dirname(filePath);

        fs.mkdirSync(dir, { recursive: true });
        await this._pages[id].screenshot({
            path:     filePath,
            fullPage: fullPage
        });
    },

    // Private methods
    async _downloadBrowser (revision) {
        const downloadHost = process.env.PUPPETEER_DOWNLOAD_HOST; // defaults to https://storage.googleapis.com if null
        const browserFetcher = puppeteer.createBrowserFetcher({ host: downloadHost });

        // same logic as puppeteer
        revision = revision || process.env.PUPPETEER_CHROMIUM_REVISION || require('puppeteer-core/package.json').puppeteer.chromium_revision;
        const revisionInfo = browserFetcher.revisionInfo(revision);

        // do nothing if the revision is already downloaded.
        if (revisionInfo.local)
            return;

        await browserFetcher.download(revisionInfo.revision, this._downloadProgressCallback(revision));
    },

    _downloadProgressCallback (revision) {
        let bar = null;

        let lastDownloadedBytes = 0;

        return function (downloadedBytes, totalBytes) {
            if (!bar) {
                const ProgressBar = require('progress');
                const totalMegaBytes = Math.round(totalBytes / 1024 / 1024 * 10) / 10;

                bar = new ProgressBar(`Downloading Chromium r${revision} - ${totalMegaBytes} MB [:bar] :percent :etas `, {
                    complete:   '=',
                    incomplete: ' ',
                    width:      20,
                    total:      totalBytes,
                    stream:     process.stdout
                });
            }
            bar.tick(downloadedBytes - lastDownloadedBytes);
            lastDownloadedBytes = downloadedBytes;
        };
    },

    _toArray (input) {
        if (Array.isArray(input))
            return input;
        if (!input)
            return [];
        return [input];
    },
};
