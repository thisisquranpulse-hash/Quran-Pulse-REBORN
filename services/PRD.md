# Product Requirement Document (PRD)
## Project Code: NurQuran Pulse (v6.0)
**"The Cognitive Spiritual Ecosystem"**

---

## 1. Executive Summary & Vision
**NurQuran Pulse** is a paradigm-shifting Islamic super-application that bridges the gap between 1,400 years of Divine Wisdom and the cutting-edge capabilities of Generative AI. 

Unlike static Quran apps, Pulse is a **living, breathing companion**. It utilizes Multimodal AI (Text, Vision, Audio, Video) to act as a personal tutor, a creative studio, and a spiritual guide. It transforms the user experience from passive reading to **active, cognitive engagement**.

**Key Differentiators:**
*   **Gemini Live Integration:** Real-time, low-latency voice conversations with an AI Ustaz persona.
*   **Generative Creative Studio:** On-demand generation of Islamic art (Imagen 3) and videos (Veo) based on user reflection.
*   **Cognitive Iqra' Hub:** Real-time pronunciation scoring using audio signal processing and AI analysis.
*   **Context-Aware RAG:** Answers questions using real-world grounding (Google Search & Maps) for finding mosques or verifying Hadith.

---

## 2. User Personas

| Persona | Archetype | Needs | Pulse Solution |
| :--- | :--- | :--- | :--- |
| **The Seeker** | New Convert / Learner | Needs clear, contextual explanations without judgment. | **Unified Assistant (Deep Mode)** provides detailed breakdowns of verses and Fiqh. |
| **The Student** | Kids / Teens | Needs engaging, gamified learning methods. | **Iqra Hub** with AI voice scoring and **Veo Video Generation** for visual learning. |
| **The Practicing Muslim** | Daily User | Needs accuracy for prayer times and Quran recitation. | **Dynamic Prayer Dashboard** & **Neural Verse Studio** for Tafsir. |
| **The Content Creator** | Da'wah Influencer | Needs tools to share Islamic messages. | **Creative Studio** to generate 4K images and 1080p videos from verses. |

---

## 3. Functional Requirements

### 3.1. The Neural Quran Engine (Reader)
*   **Core Reading:** High-performance virtualization for infinite scrolling of Madani/Uthmani script.
*   **Verse Studio (AI Analysis):** A slide-over "Lab" that analyzes a specific verse.
    *   *Input:* Selected Verse.
    *   *AI Processing:* Extracts Core Themes, Historical Context (Asbab al-Nuzul), Linguistic nuances (Balaghah), and Key Root Words.
    *   *Output:* Structured JSON rendered as a beautiful infographic.
*   **Smart TTS (Storyteller Mode):**
    *   Uses **Gemini 2.5 Flash TTS** to read translations not robotically, but with a specific "Storytelling" or "Khutbah" persona.

### 3.2. Unified Assistant (Omni-Modal)
*   **Text Chat (RAG):**
    *   **Fast Mode:** Gemini 2.5 Flash Lite for instant Fiqh answers.
    *   **Deep Mode:** Gemini 3 Pro (Thinking) for complex theological questions.
    *   **Search Grounding:** Fetches live data for "Recent fatwas" or "News".
    *   **Maps Grounding:** Locates "Nearest Mosque" with rating and directions.
*   **Live Tutor (Voice):**
    *   Utilizes **Gemini Live API** (WebSockets) for continuous, interruptible voice conversation.
    *   **Visualizer:** Real-time audio frequency visualization.
    *   **Personas:** Selectable voice profiles (Zephyr, Charon, etc.).

### 3.3. Iqra' Cognitive Hub (Education)
*   **Digital Flipbook:** Interactive Iqra books (Levels 1-6) simulating physical page turning.
*   **AI Tajwid Validator:**
    *   Users record their voice reading a line.
    *   AI analyzes the audio blob against the expected text.
    *   Returns a 0-100 score and specific feedback (e.g., "Your 'Ha' sound was too light").
*   **Digital Tasbih:** Haptic-feedback enabled counter with sync to local storage.

### 3.4. Creative Studio (Generative Media)
*   **Image Gen:** Uses **Gemini 3 Pro / Imagen** to create 1:1, 16:9, or 9:16 Islamic art based on prompts.
*   **Video Gen (Veo):** Integration with **Veo 3.1** to generate short cinematic clips (e.g., "A peaceful mosque at sunset") for social sharing.
*   **Key Management:** Handles rigorous checking of Paid API keys for Veo usage.

### 3.5. Media Analyzer & Library
*   **Multimodal Input:** Users can upload an image of a text or a video.
*   **Analysis:** AI extracts text, translates it, or explains the Fiqh related to the visual content.
*   **Hadith Engine:** Specialized search tool that finds authentic Hadith based on vague user queries (Semantic Search).

### 3.6. Dynamic Prayer Dashboard
*   **Environmental UI:** The background changes dynamically based on time (Dawn, Day, Dusk, Night) with animated celestial bodies (Sun/Moon/Stars).
*   **Data Sources:** Hybrid fetching strategy:
    *   **Primary:** JAKIM E-Solat (via proxy) for Malaysia.
    *   **Fallback:** Aladhan API (Global).
*   **Qibla Compass:** Uses device magnetometer and geolocation to point towards Mecca.

---

## 4. Non-Functional Requirements

### 4.1. Performance
*   **Code Splitting:** React `lazy` loading for heavy modules (Creative Studio, Live Tutor).
*   **Caching Strategy (IndexedDB):**
    *   Audio blobs for TTS are cached to prevent re-generation costs.
    *   Quran text and translations cached for offline access.
    *   Iqra progress synced locally first, then cloud.

### 4.2. Security
*   **Auth:** Supabase Auth (Email + Google OAuth).
*   **Row Level Security (RLS):** User data (recordings, saved images) is strictly siloed in Supabase.
*   **API Security:** API Keys are accessed via Environment Variables; Veo keys are user-supplied for cost management.

### 4.3. Offline Capability (PWA)
*   **Service Workers:** Caches UI shell, fonts, and critical assets.
*   **Offline Mode:** App detects network status. Read-only features (Quran, Cached Audio) remain functional; AI features show "Offline" badges.

---

## 5. UI/UX Design System
**Theme:** "Noor" (Light) & "Layl" (Dark) - Deep Navy/Black background with Neon Cyan/Blue accents.

*   **Typography:**
    *   *Display:* Lexend (Modern, clean).
    *   *Body:* Plus Jakarta Sans.
    *   *Script:* Noto Sans Arabic (Optimized for legibility).
*   **Visual Language:**
    *   **Glassmorphism:** Panels use `backdrop-blur` and semi-transparent borders.
    *   **Neon Glows:** Active states glow with `#0EA5E9` (Cyan) or `#4285F4` (Google Blue).
    *   **Micro-interactions:** Buttons scale on press; Audio visualizers react to volume.

---

## 6. Technical Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + Vite |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Animations |
| **State/Storage** | React Hooks + IndexedDB (Dexie style logic) |
| **Backend/Auth** | Supabase (PostgreSQL) |
| **GenAI Core** | Google GenAI SDK (`@google/genai`) |
| **LLM Models** | Gemini 2.5 Flash, Gemini 3.0 Pro, Gemini Live |
| **Media Models** | Imagen 3, Veo 3.1 |
| **PWA** | Vite PWA Plugin |

---

## 7. Roadmap & Future Iterations

*   **v6.1:** Community Khatam (Global leaderboard for reading).
*   **v6.2:** AR Qibla (Augmented Reality view for finding Qibla).
*   **v6.5:** Multi-User Live Classrooms (Teacher can hear student's audio stream via WebRTC/Live API).
