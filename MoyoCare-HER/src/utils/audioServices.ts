// Speech-to-Text (STT) utility using Web Speech API
const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export interface STTOptions {
    language?: string;
    onResult?: (text: string) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
}

export class SpeechToTextService {
    private recognition: any;
    private isListening = false;

    constructor() {
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser');
        } else {
            this.recognition = new SpeechRecognition();
            this.setupRecognition();
        }
    }

    private setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };
    }

    start(options: STTOptions = {}) {
        if (!this.recognition) {
            options.onError?.('Speech Recognition not supported');
            return;
        }

        if (options.language) {
            // Map language codes to speech recognition locales
            const langMap: Record<string, string> = {
                en: 'en-US',
                yo: 'yo-NG',
                ig: 'ig-NG',
                ha: 'ha-NG',
            };
            this.recognition.lang = langMap[options.language] || 'en-US';
        }

        let finalTranscript = '';

        this.recognition.onresult = (event: any) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            if (interimTranscript || finalTranscript) {
                options.onResult?.(finalTranscript || interimTranscript);
            }
        };

        this.recognition.onerror = (event: any) => {
            options.onError?.(event.error);
        };

        options.onStart?.();
        this.recognition.start();
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    abort() {
        if (this.recognition) {
            this.recognition.abort();
            this.isListening = false;
        }
    }

    isSupported(): boolean {
        return !!SpeechRecognition;
    }

    isListeningNow(): boolean {
        return this.isListening;
    }
}

// Text-to-Speech (TTS) utility using Web Speech API
const SpeechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

export interface TTSOptions {
    language?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onError?: (error: string) => void;
}

export class TextToSpeechService {
    private isPlaying = false;

    speak(text: string, options: TTSOptions = {}) {
        if (!SpeechSynthesis) {
            options.onError?.('Text-to-Speech not supported');
            return;
        }

        // Stop any ongoing speech
        SpeechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        if (options.language) {
            const langMap: Record<string, string> = {
                en: 'en-US',
                yo: 'yo-NG',
                ig: 'ig-NG',
                ha: 'ha-NG',
            };
            utterance.lang = langMap[options.language] || 'en-US';
        }

        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;

        utterance.onend = () => {
            this.isPlaying = false;
            options.onEnd?.();
        };

        utterance.onerror = (event: any) => {
            this.isPlaying = false;
            options.onError?.(event.error);
        };

        this.isPlaying = true;
        SpeechSynthesis.speak(utterance);
    }

    stop() {
        if (SpeechSynthesis) {
            SpeechSynthesis.cancel();
            this.isPlaying = false;
        }
    }

    pause() {
        if (SpeechSynthesis && this.isPlaying) {
            SpeechSynthesis.pause();
        }
    }

    resume() {
        if (SpeechSynthesis && this.isPlaying) {
            SpeechSynthesis.resume();
        }
    }

    isSupported(): boolean {
        return !!SpeechSynthesis;
    }

    isPlayingNow(): boolean {
        return this.isPlaying;
    }
}
