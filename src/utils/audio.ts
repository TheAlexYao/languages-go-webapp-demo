// Audio utility for pronunciation with enhanced state management
export type AudioState = 'idle' | 'loading' | 'playing' | 'error';

export interface AudioOptions {
  language: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export class PronunciationManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'speechSynthesis' in window;
  }

  private getLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      'Spanish': 'es-ES',
      'French': 'fr-FR', 
      'German': 'de-DE',
      'Italian': 'it-IT',
      'Japanese': 'ja-JP',
      'Thai': 'th-TH',
      'English': 'en-US'
    };
    
    return languageMap[language] || 'en-US';
  }

  private getFlagEmoji(language: string): string {
    const flagMap: Record<string, string> = {
      'Spanish': '🇪🇸',
      'French': '🇫🇷',
      'German': '🇩🇪', 
      'Italian': '🇮🇹',
      'Japanese': '🇯🇵',
      'Thai': '🇹🇭',
      'English': '🇺🇸'
    };
    
    return flagMap[language] || '🔊';
  }

  async speak(
    text: string, 
    options: AudioOptions,
    onStateChange?: (state: AudioState) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        onStateChange?.('error');
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.stop();

      onStateChange?.('loading');

      try {
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.lang = this.getLanguageCode(options.language);
        this.currentUtterance.rate = options.rate || 0.9;
        this.currentUtterance.pitch = options.pitch || 1.0;
        this.currentUtterance.volume = options.volume || 1.0;

        this.currentUtterance.onstart = () => {
          onStateChange?.('playing');
        };

        this.currentUtterance.onend = () => {
          onStateChange?.('idle');
          this.currentUtterance = null;
          resolve();
        };

        this.currentUtterance.onerror = (event) => {
          onStateChange?.('error');
          this.currentUtterance = null;
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        // Small delay to ensure state change is registered
        setTimeout(() => {
          if (this.currentUtterance) {
            speechSynthesis.speak(this.currentUtterance);
          }
        }, 100);

      } catch (error) {
        onStateChange?.('error');
        reject(error);
      }
    });
  }

  stop(): void {
    if (this.currentUtterance) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  isPlaying(): boolean {
    return speechSynthesis.speaking;
  }

  checkSupport(): boolean {
    return this.isSupported;
  }

  getLanguageFlag(language: string): string {
    return this.getFlagEmoji(language);
  }
}

// Create singleton instance
export const pronunciationManager = new PronunciationManager(); 