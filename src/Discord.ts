import { TextToSpeech } from "./TextToSpeech";
import { Client, SlashCommandBuilder, Collection, Events } from 'discord.js'


const commands = new Collection()

commands.set('connect', new SlashCommandBuilder()
    .setName("connect")
    .setDescription("Connect bot to current voice chat"))


export class Discord {
    textToSpeech: TextToSpeech
    client: Client

    constructor(textToSpeech: TextToSpeech) {
        this.textToSpeech = textToSpeech
        const client = new Client({
            intents: [
                "Guilds",
                "GuildMessages",
                "GuildVoiceStates",

                "MessageContent",
            ]
        })
        this.client = client
    }

    async init(token: string) {
        const client = this.client

        client.once('ready', () => {
            console.log(`bot "${client.user?.username}" is ready`)
        })


        client.on('messageCreate', async message => {
            if (message.content.trim() === '!play') {
                const member = message.member

                if (!member) return

                if (!member.voice.channel) {
                    await message.reply('Вы должны находиться в голосовом чате!')
                    return
                }

                // const connection = await member.voice.channel;

            }


        })


        await client.login(token)
    }
}

