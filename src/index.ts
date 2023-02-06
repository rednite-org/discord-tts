import fs, { copySync } from 'fs-extra'
import jose from 'node-jose'
import axios from 'axios'
import qs from 'qs'

const folderId = 'b1ggv94mt5nrd3bftldp'

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


async function textToSpeech(iamToken: string, text: string) {
    const response = await axios.post('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', qs.stringify({
        lang: 'ru-RU',
        voice: 'filipp',
        folderId,
        text,
    }), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${iamToken}`
        },
        responseType: 'arraybuffer'
    })

    return response.data
}

async function main() {
    const token = await loadToken()

    const speech = await textToSpeech(token.iamToken, 'Привет мир!')

    await fs.writeFile('speech.ogg', speech)

}

main().catch(console.error)
