import { TextToSpeech, VoiceType } from "./TextToSpeech";
import { Client, SlashCommandBuilder, Collection, VoiceBasedChannel } from 'discord.js'
import { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioPlayer, createAudioResource, StreamType, NoSubscriberBehavior } from '@discordjs/voice'
import { Readable } from 'stream';




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
            if (message.content.trim().length === 0) return

            const member = message.member

            if (!member) return

            const speechless = member.roles.cache.find(x => x.name.toLowerCase().includes("немые"))

            if (!speechless) return

            const channel = member.voice.channel

            if (!channel) return

            try {
                const connection = await this.connectToChannel(channel)
                connection.subscribe(player)

        
                const speech = await this.textToSpeech.synthesizeSpeech(VoiceType.Zahar, message.content)
                const stream = Readable.from(speech);

                await player.play(createAudioResource(stream, {
                    inputType: StreamType.OggOpus,
                }))
            } catch (err) {
                console.error(err)
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

