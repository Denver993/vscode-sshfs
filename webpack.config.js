
//@ts-check
'use strict';

const { join, resolve, dirname } = require('path');
const fs = require('fs');
const webpack = require('webpack');

/**
 * @template T
 * @param { (cb: (e?: Error | null, r?: T) => void) => any } func
 * @return { Promise<T> }
 */
function wrap(func) {
    return new Promise((res, rej) => {
        try {
            // @ts-ignore
            func((e, r) => e ? rej(e) : res(r));
        } catch (e) {
            rej(e);
        }
    });
}

class CopyPuttyExecutable {
    /**
     * @param {webpack.Compiler} compiler
     */
    apply(compiler) {
        const path = require.resolve('ssh2/util/pagent.exe');
        // @ts-ignore
        const target = join(compiler.options.output.path, '../util/pagent.exe');
        compiler.hooks.beforeRun.tapPromise('CopyPuttyExecutable-BeforeRun', () => new Promise((resolve, reject) => {
            fs.exists(path, exists => exists ? resolve() : reject(`Couldn't find executable at: ${path}`));
        }));
        compiler.hooks.emit.tapPromise('CopyPuttyExecutable-Emit', async () => {
            /** @type {Buffer} */
            const data = await wrap(cb => fs.readFile(path, cb));
            await wrap(cb => fs.exists(dirname(target), res => cb(null, res))).then(
                exists => !exists && wrap(cb => fs.mkdir(dirname(target), cb))
            );
            await wrap(cb => compiler.outputFileSystem.writeFile(target, data, cb));
            console.log(`[CopyPuttyExecutable] Wrote '${path}' to '${target}'`);
        });
    }
}

class ProblemMatcherReporter {
    /**
     * @param {webpack.Compiler} compiler
     */
    apply(compiler) {
        compiler.hooks.beforeCompile.tap('ProblemMatcherReporter-BeforeCompile', () => {
            console.log('Compilation starting');
        });
        compiler.hooks.afterCompile.tap('ProblemMatcherReporter-AfterCompile', () => {
            console.log('Compilation finished');
        });
    }
}

/**@type {webpack.Configuration}*/
const config = {
    mode: 'development',
    target: 'node',
    node: false,
    entry: './src/extension.ts',
    output: {
        path: resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        devtoolModuleFilenameTemplate: '../[resource-path]',
        clean: true,
    },
    devtool: 'source-map',
    performance: {
        hints: 'warning'
    },
    externals: {
        vscode: 'commonjs vscode',
        request: 'commonjs request',
        'source-map-support/register': 'commonjs source-map-support/register',
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.ts$/,
            include: /src/,
            use: [{
                loader: 'ts-loader',
            }]
        }]
    },
    plugins: [
        new CopyPuttyExecutable(),
        new ProblemMatcherReporter(),
    ],
    optimization: {
        splitChunks: {
            minSize: 0,
            cacheGroups: {
                default: false,
                defaultVendors: false,
            },
        },
    },
    stats: {
        ids: true,
        assets: false,
        chunks: false,
        entrypoints: true,
        modules: true,
        groupModulesByPath: true,
        modulesSpace: 50,
        excludeModules(name, { issuerPath }) {
            if (name.startsWith('external ')) return true;
            const issuer = issuerPath && (issuerPath[issuerPath.length - 1].name || '').replace(/\\/g, '/');
            if (!issuer) return false;
            if (issuer.startsWith('./.yarn/')) return true;
            if (issuer.startsWith('../')) {
                const lower = issuer.toLowerCase();
                if (lower.includes('/yarn/berry/cache/')) return true;
                if (lower.includes('/.yarn/berry/cache/')) return true;
            }
            return false;
        },
    },
}

module.exports = config;
