// YarnGPT Text-to-Speech Integration
// Nigerian Text-to-Speech AI for Yoruba, Igbo, Hausa, and English
// https://www.yarngpt.ai/

export interface YarnGPTOptions {
    apiKey: string;
    language?: 'en' | 'yo' | 'ig' | 'ha'; // English, Yoruba, Igbo, Hausa
    voiceId?: string; // Specific voice ID (male/female variants)
    speed?: number; // 0.5 to 2.0 (default: 1.0)
    pitch?: number; // -20.0 to 20.0 (default: 0)
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
    private baseUrl = 'https://api.yarngpt.ai/v1';
    private availableVoices: YarnGPTVoice[] = [];

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.initializeVoices();
    }

    private initializeVoices() {
        // Common YarnGPT voices - these are typical available voices
        // You may need to adjust based on actual API response
        this.availableVoices = [
            // English
            { id: 'en-male-1', name: 'Kofi (Male)', language: 'en', gender: 'male' },
            { id: 'en-female-1', name: 'Ada (Female)', language: 'en', gender: 'female' },

            // Yoruba
            { id: 'yo-male-1', name: 'Ayo (Male)', language: 'yo', gender: 'male', accent: 'Nigerian' },
            { id: 'yo-female-1', name: 'Fola (Female)', language: 'yo', gender: 'female', accent: 'Nigerian' },

            // Igbo
            { id: 'ig-male-1', name: 'Chisom (Male)', language: 'ig', gender: 'male', accent: 'Nigerian' },
            { id: 'ig-female-1', name: 'Amara (Female)', language: 'ig', gender: 'female', accent: 'Nigerian' },

            // Hausa
            { id: 'ha-male-1', name: 'Musa (Male)', language: 'ha', gender: 'male', accent: 'Nigerian' },
            { id: 'ha-female-1', name: 'Zainab (Female)', language: 'ha', gender: 'female', accent: 'Nigerian' },
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
            let voiceId = options.voiceId;
            if (!voiceId && voicesForLang.length > 0) {
                const femaleVoice = voicesForLang.find(v => v.gender === 'female');
                voiceId = femaleVoice ? femaleVoice.id : voicesForLang[0].id;
            }

            const response = await fetch(`${this.baseUrl}/tts/synthesize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-API-Key': this.apiKey,
                },
                body: JSON.stringify({
                    text,
                    language,
                    voice_id: voiceId,
                    speed: options.speed || 1.0,
                    pitch: options.pitch || 0,
                    format: 'mp3',
                    output: 'url', // Get URL instead of base64 for better performance
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`YarnGPT API error: ${error.message || response.statusText}`);
            }

            const data = await response.json();
            const audioUrl = data.audio_url || data.url;

            if (!audioUrl) {
                throw new Error('No audio URL returned from YarnGPT');
            }

            // Play the audio
            const audio = new Audio(audioUrl);
            audio.volume = 1;
            await audio.play();

            // Wait for audio to finish
            return new Promise((resolve, reject) => {
                audio.onended = () => resolve();
                audio.onerror = () => reject(new Error('Audio playback error'));
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

            let voiceId = options.voiceId;
            if (!voiceId && voicesForLang.length > 0) {
                const femaleVoice = voicesForLang.find(v => v.gender === 'female');
                voiceId = femaleVoice ? femaleVoice.id : voicesForLang[0].id;
            }

            const response = await fetch(`${this.baseUrl}/tts/synthesize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-API-Key': this.apiKey,
                },
                body: JSON.stringify({
                    text,
                    language,
                    voice_id: voiceId,
                    speed: options.speed || 1.0,
                    pitch: options.pitch || 0,
                    format: 'mp3',
                    output: 'blob',
                }),
            });

            if (!response.ok) {
                const error = await response.json();
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
