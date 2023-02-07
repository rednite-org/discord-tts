import fs from 'fs-extra'
import jose from 'node-jose'
import axios from 'axios'
import config from './config'
import { Discord } from './discord'
import { YandexTtsEngine } from './tts/yandex'
import { TtsEngine } from './tts/tts'

async function fetchJWT() {
    const authorizedKey = fs.readJsonSync('authorized_key.json')

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
    const filename = 'iam_token.json'

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

async function main() {
    const token = await loadToken()
    const ttsEngine: TtsEngine = new YandexTtsEngine(config.folderId, token.iamToken)
    const discord = new Discord(ttsEngine)
    await discord.init(config.discordToken)
}

main().catch(console.error)
