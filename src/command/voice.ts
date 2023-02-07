import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { UserRepository } from "../storage/repository";
import { User } from "../storage/user";
import { TtsEngine, VoiceType } from "../tts/tts";
import { Command, CompiledCommandJSON } from "./command";

export class VoiceCommand implements Command {

    userRepository: UserRepository;
    ttsEngine: TtsEngine;

    constructor(userRepository: UserRepository, ttsEngine: TtsEngine) {
        this.userRepository = userRepository;
        this.ttsEngine = ttsEngine;
    }

    getName(): string {
        return "voice";
    }

    toJSON(): CompiledCommandJSON {
        return new SlashCommandBuilder()
            .setName('voice')
            .setDescription('Выберите новый голос для себя')
            .addStringOption(option =>
                option.setName('голос')
                    .setDescription('Голос, которым вы будете говорить')
                    .addChoices(
                        ...Object.values(this.ttsEngine.getVoiceTypes())
                            .map(type => {
                                return { name: type.displayName, value: type.id }
                            })
                    )).toJSON();
    }

    async handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        if (interaction.options.data.length == 1) {
            const voiceTypeId: string = interaction.options.getString('голос')!;
            const voiceType = this.resolveVoiceType(voiceTypeId);

            if (voiceType != null) {
                this.userRepository.createOrUpdate(new User(interaction.user.id, voiceType));
                console.log(`${interaction.user.username} changed voice to ${voiceType.id}`)
                await interaction.reply('Вы изменили голос на ' + voiceType.displayName + '.');
            }
        } else {
            const { voiceType } = this.userRepository.get(interaction.user.id) 
                ?? { voiceType: this.ttsEngine.getDefaultVoiceType() };
                console.log(`${interaction.user.username} asked for current voice type`)
            await interaction.reply('Ваш текущий голос: ' + voiceType?.displayName + '.');
        }
    }

    resolveVoiceType(voiceTypeId: string): VoiceType | null {
        for (const voiceType of Object.values(this.ttsEngine.getVoiceTypes())) {
            if (voiceType.id === voiceTypeId) {
                return voiceType;
            }
        }
        return null;
    }

}
