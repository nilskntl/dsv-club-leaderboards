'use strict';
/**
 * Test context factory.
 *
 * Google Apps Script source files use class declarations and global variables with no
 * module system. To load them in Node.js we concatenate all files into one script and
 * run it in a vm context, then explicitly export every class/constant onto that context
 * so tests can destructure them.
 *
 * `UrlFetchApp.fetch` is synchronous in Apps Script. We replicate that with sync-request
 * so the source code runs unmodified — no async/await wrapping needed.
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const request = require('sync-request');

const ROOT = path.join(__dirname, '..');

const SRC_FILES = [
    'src/app-script/leaderboard/calendar-date.js',
    'src/app-script/leaderboard/time.js',
    'src/app-script/leaderboard/person.js',
    'src/app-script/leaderboard/result.js',
    'src/app-script/leaderboard/discipline.js',
    'src/app-script/leaderboard/leaderboard.js',
    'src/app-script/requests/request-handler.js',
    'src/app-script/sheet/sheet.js',
];

// Names that must be reachable from tests after loading
const EXPORTS = [
    'CalendarDate', 'Time', 'Person', 'Result',
    'Discipline', 'Leaderboard', 'RequestHandler', 'Sheet',
    'STROKES', 'GENDERS', 'LANES', 'DISCIPLINES', 'DISTANCES',
];

/**
 * Creates an isolated vm context with all source classes loaded.
 *
 * Each call returns a fresh context — useful for integration tests that mutate
 * leaderboard state. Unit tests should use the lazy `getContext()` singleton instead.
 *
 * @param {{ verbose?: boolean }} [options]
 * @returns {object} Context with all source classes as properties.
 */
function createContext({ verbose = !!process.env.VERBOSE } = {}) {
    const context = {
        Logger: {
            log(msg) {
                if (verbose) process.stdout.write('  [LOG] ' + String(msg) + '\n');
            }
        },

        // Apps Script code logs via console.log/warn/error (visible in Web App / trigger
        // executions, with matching severity in Cloud Logging). All are gated on verbose so
        // test output stays quiet unless VERBOSE is set.
        console: {
            log(...args) {
                if (verbose) process.stdout.write('  [LOG] ' + args.map(String).join(' ') + '\n');
            },
            warn(...args) {
                if (verbose) process.stdout.write('  [WARN] ' + args.map(String).join(' ') + '\n');
            },
            error(...args) {
                if (verbose) process.stdout.write('  [ERROR] ' + args.map(String).join(' ') + '\n');
            }
        },

        // Utilities.sleep is a no-op in tests — callers must add their own delays if needed
        Utilities: {
            sleep(_ms) {}
        },

        // Synchronous HTTP adapter that mirrors the Apps Script UrlFetchApp API.
        // Apps Script's fetch is blocking; sync-request replicates that behaviour.
        UrlFetchApp: {
            fetch(url, options = {}) {
                const method = (options.method || 'GET').toUpperCase();
                const reqOptions = { headers: { ...(options.headers || {}) } };

                if (options.payload) {
                    if (typeof options.payload === 'string') {
                        reqOptions.body = options.payload;
                        if (options.contentType) {
                            reqOptions.headers['Content-Type'] = options.contentType;
                        }
                    } else {
                        // Object payload → form-encoded, matching Apps Script default behaviour
                        reqOptions.form = options.payload;
                    }
                }

                try {
                    const res = request(method, url, reqOptions);
                    return {
                        // getBody() throws for non-2xx; access body directly so callers
                        // can inspect getResponseCode() and handle errors themselves
                        getContentText: () => res.body ? res.body.toString('utf8') : '',
                        getResponseCode: () => res.statusCode,
                    };
                } catch (e) {
                    if (options.muteHttpExceptions) {
                        return { getContentText: () => '', getResponseCode: () => 0 };
                    }
                    throw e;
                }
            }
        }
    };

    vm.createContext(context);

    // Concatenate all source files so class declarations are in a single shared scope.
    // (class/const/let do not persist across separate vm.runInContext calls.)
    const srcCode = SRC_FILES
        .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8'))
        .join('\n\n');

    // Assign each class/constant to `this` (= the context object) so tests can access them.
    const exportCode = EXPORTS.map(name => `this.${name} = ${name};`).join('\n');

    vm.runInContext(srcCode + '\n\n' + exportCode, context);

    return context;
}

// Shared singleton for unit tests — avoids reloading source files on every test file.
let _shared = null;
function getContext() {
    if (!_shared) _shared = createContext();
    return _shared;
}

module.exports = { createContext, getContext };
