import axios from 'axios'
import qs from 'qs'
import { TtsEngine, VoiceType } from './tts'

export const YandexVoiceType: Record<string, VoiceType> = {
    Alena: {
        id: 'alena',
        displayName: 'Алёна'
    },
    Filipp: {
        id: 'filipp',
        displayName: 'Филипп'
    },
    Ermil: {
        id: 'ermil',
        displayName: 'Ермил'
    },
    Jane: {
        id: 'jane',
        displayName: 'Джейн'
    },
    Madirus: {
        id: 'madirus',
        displayName: 'Мадирус'
    },
    Omazh: {
        id: 'omazh',
        displayName: 'Омаж'
    },
    Zahar: {
        id: 'zahar',
        displayName: 'Захар'
    },
}

export class YandexTtsEngine implements TtsEngine {
    folderId: string
    iamToken: string

    constructor(folderId: string, iamToken: string) {
        this.folderId = folderId
        this.iamToken = iamToken
    }

    getDefaultVoiceType(): VoiceType {
        return YandexVoiceType.Zahar as VoiceType;
    }

    getVoiceTypes(): Record<string, VoiceType> {
        return YandexVoiceType;
    }

    getName(): string {
        return "yandex";
    }

    async synthesizeSpeech(voiceType: VoiceType, text: string): Promise<Buffer> {
        const response = await axios.post('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', qs.stringify({
            lang: 'ru-RU',
            voice: voiceType.id,
            folderId: this.folderId,
            text,
        }), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Bearer ${this.iamToken}`
            },
            responseType: 'arraybuffer'
        })

        return response.data
    }
}
