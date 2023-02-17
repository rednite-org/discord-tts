import axios from 'axios'
import qs from 'qs'
import fs from 'fs-extra'
import jose from 'node-jose'
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

async function fetchJWT() {
    const authorizedKey = fs.readJsonSync('keys/authorized_key.json')

    const now = Math.floor(new Date().getTime() / 1000);

    const payload = {
        aud: "https://iam.api.cloud.yandex.net/iam/v1/tokens",
        iss: authorizedKey.service_account_id,
        iat: now,
        exp: now + 3600
    };

    const key = await jose.JWK.asKey(authorizedKey.private_key, 'pem', { kid: authorizedKey.id, alg: 'PS256' })
    const jwt = await jose.JWS.createSign({ format: 'compact' }, key).update(JSON.stringify(payload)).final()
    return jwt
}

async function fetchIAM(jwt: string) {
    const { data: iam } = await axios.post('https://iam.api.cloud.yandex.net/iam/v1/tokens', { jwt })
    return iam
}

async function loadToken(): Promise<{ iamToken: string, expiresAt: string }> {
    const filename = 'keys/iam_token.json'

    if ((await fs.exists(filename))) {
        const data = await fs.readJson(filename)

        if (Date.parse(data.expiresAt) > Date.now()) {
            // TODO: Do refresh 
            return data
        }
    }

    const jwt = await fetchJWT()
    const token = await fetchIAM(jwt.toString())
    await fs.writeJSON(filename, token, { spaces: 2 })

    return token
}

export class YandexTtsEngine implements TtsEngine {
    folderId: string

    iamToken: string | null = null 
    expiresAt: number = Date.now()

    constructor(folderId: string) {
        this.folderId = folderId
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
        if (this.iamToken == null || (this.expiresAt - 10000) <= Date.now()) {
            const tokenData = await loadToken()
            this.iamToken = tokenData.iamToken
            this.expiresAt = Date.parse(tokenData.expiresAt)
        }

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
