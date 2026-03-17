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

const phasermsg = () => ({
    name: 'phasermsg',
    buildStart() {
        process.stdout.write(`Building for ${platform}...\n`);
    },
    buildEnd() {
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
