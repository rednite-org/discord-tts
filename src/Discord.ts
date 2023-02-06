import { TextToSpeech, VoiceType } from "./TextToSpeech";
import { Client, Events, VoiceBasedChannel } from 'discord.js'
import { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioPlayer, createAudioResource, StreamType, NoSubscriberBehavior } from '@discordjs/voice'
import { Readable } from 'stream';
import { FileUserRepository, UserRepository } from "./storage/repository";
import config from './config'
import { REST, Routes } from 'discord.js';
import { CommandRepository } from "./command/command";
import { VoiceTypeCommand } from "./command/voiceTypeCommand";

const userRepository: UserRepository = new FileUserRepository('users');
const commandRepository: CommandRepository = new CommandRepository();

const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
        maxMissedFrames: Math.round(5000 / 20)
    }
})

async function deployCommands(clientId: string, token: string) {
    const rest = new REST({ version: '10' }).setToken(token)

    await rest.put(
        Routes.applicationCommands(clientId),
        {
            body: commandRepository.all().map(command => command.toJSON())
        }
    )
}

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

        commandRepository.registerCommand(new VoiceTypeCommand(userRepository))
        await deployCommands(config.discordClientId, config.discordToken)

        client.once('ready', () => {
            console.log(`bot "${client.user?.username}" is ready`)
        })

        client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;

            for (const command of commandRepository.all()) {
                if (interaction.commandName.toLowerCase() === command.getName().toLowerCase()) {
                    command.handle(interaction);
                    break;
                }
            }
        });

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

                const user = userRepository.get(member.id)
                const speech = await this.textToSpeech.synthesizeSpeech(user === null ? VoiceType.Zahar : user.voiceType!, message.content)
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

