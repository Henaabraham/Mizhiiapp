import { config } from 'dotenv';
config();
// Polyfill import.meta.env
(globalThis as any).import = { meta: { env: { VITE_OPENROUTER_API_KEY: process.env.VITE_OPENROUTER_API_KEY, VITE_DEBUG_GEMINI: 'true' } } };

import { analyzeScene } from './src/services/gemini.ts';

const image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function run() {
    try {
        console.log("Running street mode with OpenRouter API...");
        const res = await analyzeScene(image, 'street');
        console.log("STREET RESULT:", res);
    } catch (e) {
        console.error("ERROR:", e);
    }
}
run();
