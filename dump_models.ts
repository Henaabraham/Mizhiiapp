import { config } from 'dotenv';
import fs from 'fs';
config();

async function run() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.VITE_GEMINI_API_KEY}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        const flashModels = data.models.filter((m: any) => m.name.includes('flash')).map((m: any) => m.name);
        fs.writeFileSync('flash_models.json', JSON.stringify(flashModels, null, 2));
        console.log("Wrote flash_models.json");
    } catch (e) {
        console.error(e);
    }
}
run();
