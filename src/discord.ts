import { Client, Events, VoiceBasedChannel } from 'discord.js'
import { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioPlayer, createAudioResource, StreamType, NoSubscriberBehavior, AudioPlayerStatus } from '@discordjs/voice'
import { Readable } from 'stream';
import { FileUserRepository, UserRepository } from "./storage/repository";
import config from './config'
import { REST, Routes } from 'discord.js';
import { CommandRepository } from "./command/command";
import { VoiceCommand } from "./command/voice";
import fs from 'fs-extra';
import path from 'path'
import { TtsEngine } from "./tts/tts";
import { Mutex } from 'async-mutex';

const userRepository: UserRepository = new FileUserRepository('data/users');
const commandRepository: CommandRepository = new CommandRepository();

const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
        maxMissedFrames: Math.round(5000 / 20)
    }
})

async function deployCommands(clientId: string, token: string) {
    const cacheFile = 'data/commands.json'
    
    fs.mkdirpSync(path.dirname(cacheFile))

    const body = commandRepository.all().map(command => command.toJSON());

    if (fs.existsSync(cacheFile)) {
        if (JSON.stringify(body) === JSON.stringify(fs.readJsonSync(cacheFile))) {
            return;
        }
    }

    fs.writeJsonSync(cacheFile, body);

    console.log('Deploying new commands...')

    const rest = new REST({ version: '10' }).setToken(token)
    return rest.put(Routes.applicationCommands(clientId), { body })
}

export class Discord {
    ttsEngine: TtsEngine
    client: Client
    mutex: Mutex = new Mutex()

    constructor(ttsEngine: TtsEngine) {
        this.ttsEngine = ttsEngine
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

        commandRepository.registerCommand(new VoiceCommand(userRepository, this.ttsEngine))
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
            if (message.cleanContent.trim().length === 0) return

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
                console.log(`${member.user.username} chatted: ${message.cleanContent}`)
                const speech = await this.ttsEngine.synthesizeSpeech(user === null
                    ? this.ttsEngine.getDefaultVoiceType()
                    : user.voiceType!, message.cleanContent)
                const stream = Readable.from(speech);

                await this.mutex.acquire();
                console.log(`Playing: ${message.cleanContent}`)
                await player.play(createAudioResource(stream, { inputType: StreamType.OggOpus }))
            } catch (err) {
                console.error(err)
            }
        })

        player.on('stateChange', (_oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle) {
                this.mutex.release();
            }
        });

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
