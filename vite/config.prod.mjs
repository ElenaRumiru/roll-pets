import { defineConfig } from 'vite';
import { resolve } from 'path';

const platform = process.env.VITE_PLATFORM || 'dev';

const indexMap = {
    dev: 'index.html',
    poki: 'index-poki.html',
    crazygames: 'index-crazygames.html',
    gamedist: 'index-gamedist.html',
    yandex: 'index-yandex.html',
    gamemonetize: 'index-gamemonetize.html',
    gamepix: 'index-gamepix.html',
    addictinggames: 'index-addictinggames.html',
    itchio: 'index-itchio.html',
};

const inputHtml = indexMap[platform] || 'index.html';

import { rename, access } from 'fs/promises';

const outDir = platform === 'dev' ? 'dist' : `dist/${platform}`;

const phasermsg = () => ({
    name: 'phasermsg',
    buildStart() {
        process.stdout.write(`Building for ${platform}...\n`);
    },
    async closeBundle() {
        // Rename platform-specific HTML to index.html so Inspector/portals find it
        if (inputHtml !== 'index.html') {
            const src = resolve(outDir, inputHtml);
            const dst = resolve(outDir, 'index.html');
            try {
                await access(src);
                await rename(src, dst);
            } catch { /* already index.html or missing */ }
        }
        const line = "---------------------------------------------------------";
        const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
        process.stdout.write(`${line}\n${msg}\n${line}\n`);
        process.stdout.write(`✨ Done ✨\n`);
    }
});

export default defineConfig({
    base: './',
    logLevel: 'warning',
    define: {
        'import.meta.env.VITE_PLATFORM': JSON.stringify(platform),
    },
    build: {
        outDir: platform === 'dev' ? 'dist' : `dist/${platform}`,
        rollupOptions: {
            input: resolve(process.cwd(), inputHtml),
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    },
    server: {
        port: 8080
    },
    plugins: [
        phasermsg()
    ]
});
