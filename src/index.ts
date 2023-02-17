
import config from './config'
import { Discord } from './discord'
import { YandexTtsEngine } from './tts/yandex'
import { TtsEngine } from './tts/tts'

async function main() {
    const ttsEngine: TtsEngine = new YandexTtsEngine(config.folderId)
    const discord = new Discord(ttsEngine)
    await discord.init(config.discordToken)
}

main().catch(console.error)
