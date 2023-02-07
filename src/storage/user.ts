import { VoiceType } from "../tts/tts";

export class User {

    id: string;
    voiceType: VoiceType | null;

    constructor(id: string, voiceType: VoiceType | null) {
        this.id = id;
        this.voiceType = voiceType;
    }
    
}
