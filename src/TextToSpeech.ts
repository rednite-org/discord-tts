import axios from 'axios'
import qs from 'qs'

export enum VoiceType {
    Alena = "alena",
    Filipp = "filipp",
    Ermil = "ermil",
    Jane = "jane",
    Madirus = "madirus",
    Omazh = "omazh",
    Zahar = "zahar"
}

export class TextToSpeech {
    folderId: string
    iamToken: string

    constructor(folderId: string, iamToken: string) {
        this.folderId = folderId
        this.iamToken = iamToken
    }

    async synthesizeSpeech(voiceType: VoiceType, text: string) {
        const response = await axios.post('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', qs.stringify({
            lang: 'ru-RU',
            voice: voiceType,
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