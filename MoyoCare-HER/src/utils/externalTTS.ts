// Optional: Google Cloud Text-to-Speech Integration
// Provides more natural-sounding voices for African languages

export interface GoogleTTSOptions {
    apiKey: string;
    language?: string;
    voiceName?: string; // e.g., "en-US-Neural2-A", "yo-NG-Neural2-A"
    rate?: number; // 0.25 to 4.0
    pitch?: number; // -20.0 to 20.0
}

export class GoogleTextToSpeechService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async speak(text: string, options: GoogleTTSOptions = {}): Promise<void> {
        try {
            const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: { text },
                    voice: {
                        languageCode: options.language || 'en-US',
                        name: options.voiceName || this.getDefaultVoice(options.language),
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        pitch: options.pitch || 0,
                        speakingRate: options.rate || 1.0,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Google TTS error: ${response.statusText}`);
            }

            const data = await response.json();
            const audioContent = data.audioContent;

            // Play audio
            const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
            await audio.play();
        } catch (error) {
            console.error('Google TTS error:', error);
            throw error;
        }
    }

    private getDefaultVoice(language?: string): string {
        const voiceMap: Record<string, string> = {
            'yo': 'yo-NG-Neural2-A', // Yoruba Nigeria
            'ig': 'ig-NG-Neural2-A', // Igbo Nigeria
            'ha': 'ha-NG-Neural2-A', // Hausa Nigeria
            'en': 'en-US-Neural2-A', // English US
        };
        return voiceMap[language?.split('-')[0] || 'en'] || 'en-US-Neural2-A';
    }
}

// ElevenLabs TTS - Best for African languages
export interface ElevenLabsTTSOptions {
    apiKey: string;
    voiceId?: string; // ElevenLabs voice ID
    stability?: number; // 0 to 1
    similarityBoost?: number; // 0 to 1
}

export class ElevenLabsTextToSpeechService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async speak(text: string, options: ElevenLabsTTSOptions = {}): Promise<void> {
        try {
            const voiceId = options.voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default voice

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': options.apiKey || this.apiKey,
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: options.stability || 0.5,
                        similarity_boost: options.similarityBoost || 0.75,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`ElevenLabs TTS error: ${response.statusText}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            await audio.play();
        } catch (error) {
            console.error('ElevenLabs TTS error:', error);
            throw error;
        }
    }
}
