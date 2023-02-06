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

    const result = await jose.JWK.asKey(authorizedKey.private_key, 'pem', { kid: authorizedKey.id, alg: 'PS256' })

    const jwt = await jose.JWS.createSign({ format: 'compact'}, result).update(JSON.stringify(payload)).final()

    return jwt
}

async function fetchIAM(jwt: string) {
    const {data: iam }= await axios.post('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
        jwt
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    })

    return iam
}

async function main() {
    const jwt = await fetchJWT()
    const iam = await fetchIAM(jwt.toString())
    console.log(iam)
}

main().catch(console.error)
