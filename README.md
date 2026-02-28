<p align="center">
  <img src="./img.png" alt="Project Banner" width="100%">
</p>

# Mizhi: AI Vision Assistant 🎯

## Basic Details

### Team Name: Team Imposters

### Team Members
- Member 1: Ishaani Raj Padickal - CEC
- Member 2: Hena Mariam Abraham - CEC

### Hosted Project Link
https://mizhiiapp.vercel.app/

### Project Description
Mizhi is an accessible, AI-powered vision assistant web app that uses real-time camera feeds to help visually impaired individuals navigate streets and identify Indian currency. 

### The Problem statement
Visually impaired individuals face daily challenges in safe mobility on busy streets and in reliably identifying currency denominations during transactions without relying on others.

### The Solution
Mizhi solves this by turning any smartphone into a real-time auditory and haptic assistant. It uses a custom-built React frontend communicating directly with powerful free-tier Vision AI APIs (via OpenRouter) to instantly detect street obstacles (vehicles, potholes, barriers) and recognize Indian currency, reading the results aloud to the user.

---

## Technical Details

### Technologies/Components Used

**For Software:**
- **Languages used:** TypeScript, HTML, CSS
- **Frameworks used:** React, Vite, Tailwind CSS
- **Libraries used:** lucide-react, motion
- **APIs used:** OpenRouter AI Vision API (Gemma 3 / Qwen Models)
- **Tools used:** Git, VS Code

---

## Features

List the key features of your project:
- **Street Smart Mode**: Detects oncoming traffic, obstacles, and pitfalls (like auto-rickshaws, bikes, or potholes) and provides real-time auditory warnings.
- **Money Sense Mode**: Accurately recognizes Indian currency denominations (e.g., ₹10, ₹100, ₹500) and announces them aloud.
- **Accessibility First**: Features high-contrast, oversized touch targets, text-to-speech (TTS) integration, and device vibration (haptics) for critical warnings.
- **Highly Optimized Edge Computing**: Directly calls REST APIs avoiding heavy SDKs to prevent Vite module bundling issues, taking photos efficiently every 8 seconds to prevent API rate limits on free tiers.

---

## Implementation

### For Software:

#### Installation
```bash
npm install
```

#### Configuration
Create a `.env` file in the root directory and add your OpenRouter API key:
```env
VITE_OPENROUTER_API_KEY=sk-or-v1-...your_key_here...
```

#### Run
```bash
npm run dev
```

## Additional Documentation

### Processing Workflows:

#### Custom AI Service (`src/services/gemini.ts`)
The core vision functionality is completely modularized in `gemini.ts`. It takes a Base64 image and a `mode` parameter ('street' or 'money') and shapes a robust JSON-forcing prompt to the OpenRouter free vision endpoint.

---

## Team Contributions

- Ishaani Raj Padickal: Frontend routing, UI/UX design, camera capture logic.
- Hena Mariam Abraham: AI API integration, text-to-speech and haptics accessibility features.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ at TinkerHub