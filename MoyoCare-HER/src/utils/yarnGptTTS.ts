// YarnGPT Text-to-Speech Integration
// Nigerian Text-to-Speech AI for Yoruba, Igbo, Hausa, and English
// https://www.yarngpt.ai/

export interface YarnGPTOptions {
    apiKey: string;
    language?: 'en' | 'yo' | 'ig' | 'ha'; // English, Yoruba, Igbo, Hausa
    voice?: string; // Specific voice name (e.g., "Idera", "Kofi", etc.)
    speed?: number; // 0.5 to 2.0 (default: 1.0)
}

export interface YarnGPTVoice {
    id: string;
    name: string;
    language: string;
    gender: 'male' | 'female';
    accent?: string;
}

export class YarnGPTTextToSpeechService {
    private apiKey: string;
    private baseUrl = 'https://yarngpt.ai/api/v1/tts';
    private availableVoices: YarnGPTVoice[] = [];

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.initializeVoices();
    }

    private initializeVoices() {
        // YarnGPT available voices
        this.availableVoices = [
            // English
            { id: 'kofi', name: 'Kofi', language: 'en', gender: 'male' },
            { id: 'ada', name: 'Ada', language: 'en', gender: 'female' },

            // Yoruba
            { id: 'idera', name: 'Idera', language: 'yo', gender: 'female', accent: 'Nigerian' },
            { id: 'ayo', name: 'Ayo', language: 'yo', gender: 'male', accent: 'Nigerian' },

            // Igbo
            { id: 'chisom', name: 'Chisom', language: 'ig', gender: 'male', accent: 'Nigerian' },
            { id: 'amara', name: 'Amara', language: 'ig', gender: 'female', accent: 'Nigerian' },

            // Hausa
            { id: 'musa', name: 'Musa', language: 'ha', gender: 'male', accent: 'Nigerian' },
            { id: 'zainab', name: 'Zainab', language: 'ha', gender: 'female', accent: 'Nigerian' },
        ];
    }

    getVoicesForLanguage(language: string): YarnGPTVoice[] {
        const langMap: Record<string, string> = {
            'en': 'en',
            'yo': 'yo',
            'ig': 'ig',
            'ha': 'ha',
        };
        const targetLang = langMap[language] || 'en';
        return this.availableVoices.filter(v => v.language === targetLang);
    }

    getAllVoices(): YarnGPTVoice[] {
        return this.availableVoices;
    }

    async speak(text: string, options: YarnGPTOptions): Promise<void> {
        try {
            const langMap: Record<string, string> = {
                'en': 'en',
                'yo': 'yo',
                'ig': 'ig',
                'ha': 'ha',
            };

            const language = langMap[options.language || 'en'] || 'en';
            const voicesForLang = this.getVoicesForLanguage(language);

            // Use provided voice or default to first female voice for that language
            let voiceName = options.voice;
            if (!voiceName && voicesForLang.length > 0) {
                const femaleVoice = voicesForLang.find(v => v.gender === 'female');
                voiceName = femaleVoice ? femaleVoice.name : voicesForLang[0].name;
            }

            const payload = {
                text,
                voice: voiceName || 'Idera',
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(`YarnGPT API error: ${error.message || response.statusText}`);
            }

            // Get audio blob from response
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Play the audio
            const audio = new Audio(audioUrl);
            audio.volume = 1;

            return new Promise((resolve, reject) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                audio.onerror = () => {
                    URL.revokeObjectURL(audioUrl);
                    reject(new Error('Audio playback error'));
                };
                audio.play().catch(reject);
            });
        } catch (error) {
            console.error('YarnGPT TTS error:', error);
            throw error;
        }
    }

    async synthesizeAndGetBlob(text: string, options: YarnGPTOptions): Promise<Blob> {
        try {
            const langMap: Record<string, string> = {
                'en': 'en',
                'yo': 'yo',
                'ig': 'ig',
                'ha': 'ha',
            };

            const language = langMap[options.language || 'en'] || 'en';
            const voicesForLang = this.getVoicesForLanguage(language);

            let voiceName = options.voice;
            if (!voiceName && voicesForLang.length > 0) {
                const femaleVoice = voicesForLang.find(v => v.gender === 'female');
                voiceName = femaleVoice ? femaleVoice.name : voicesForLang[0].name;
            }

            const payload = {
                text,
                voice: voiceName || 'Idera',
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(`YarnGPT API error: ${error.message || response.statusText}`);
            }

            return await response.blob();
        } catch (error) {
            console.error('YarnGPT synthesis error:', error);
            throw error;
        }
    }

    isSupported(): boolean {
        return !!this.apiKey;
    }
}