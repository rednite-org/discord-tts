import fs, { copySync } from 'fs-extra'
import jose from 'node-jose'
import axios from 'axios'

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
    const jwt = await jose.JWS.createSign({ format: 'compact'}, key).update(JSON.stringify(payload)).final()
    return jwt
}

async function fetchIAM(jwt: string) {
    const { data: iam }= await axios.post('https://iam.api.cloud.yandex.net/iam/v1/tokens', { jwt })
    return iam
}

async function main() {
    let tokenFile = null
    try {
        tokenFile = JSON.parse(fs.readJsonSync('iam_token.json'))
    } catch (err ) {}
    if (tokenFile == null || Date.parse(tokenFile.expiresAt) < Date.now()) {
        const jwt = await fetchJWT()
        tokenFile = await fetchIAM(jwt.toString())
        fs.writeFileSync('iam_token.json', JSON.stringify(tokenFile))
    }

    const token = tokenFile.iamToken
    console.log(token)
}

main().catch(console.error)
