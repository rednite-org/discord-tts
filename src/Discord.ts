import { TextToSpeech, VoiceType } from "./TextToSpeech";
import { Client, SlashCommandBuilder, Collection, VoiceBasedChannel } from 'discord.js'
import { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioPlayer, NoSubscriberBehavior } from '@discordjs/voice'




const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
        maxMissedFrames: Math.round(5000 / 20)
    }
})



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

                const channel = member.voice.channel

                try {
                    const connection = await this.connectToChannel(channel)
                    connection.subscribe(player)

                    await message.reply('я подключился')
                } catch (err) {
                    console.error(err)
                }

            }

            if (message.content.trim().startsWith('скажи ')) {
                const text = message.content.trim().split('скажи ')[1]
                await message.reply(`говорю ${text}`)

                // const speech = await this.textToSpeech.synthesizeSpeech(VoiceType.Jane, text)

                // await player.play(speech)
            }


        })


        await client.login(token)
    }


    async connectToChannel(channel: VoiceBasedChannel) {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator
        })

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000)
            return connection
        } catch (err) {
            connection.destroy()
            throw err;
        }
    }
}

