export class VoiceType {
    id: string;
    displayName: string;

    constructor(id: string, displayName: string) {
        this.id = id;
        this.displayName = displayName;
    }
}

export interface TtsEngine {

    getName(): string;

    getDefaultVoiceType(): VoiceType;
    
    getVoiceTypes(): Record<string, VoiceType>;

    synthesizeSpeech(voiceType: VoiceType, text: string): Promise<Buffer>;

}
