import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { UserRepository } from "../storage/repository";
import { User } from "../storage/user";
import { VoiceType } from "../TextToSpeech";
import { Command, CompiledCommandJSON } from "./command";

export class VoiceTypeCommand implements Command {

    userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
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
                        ...Object.entries(VoiceType)
                            .map(type => {
                                return { name: type[0], value: type[1] }
                            })
                    )).toJSON();
    }

    async handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        const voiceTypeName: string = interaction.options.getString('голос')!;
        let voiceType: VoiceType | null = null;
        for (var currentType of Object.entries(VoiceType)) {
            if (currentType[0].toLowerCase() === voiceTypeName.toLowerCase()) {
                voiceType = currentType[1];
                break;
            }
        }
        if (!voiceType) {
            return
        }
        this.userRepository.createOrUpdate(new User(interaction.user.id, voiceType));
        await interaction.reply('Вы изменили голос на ' + voiceType + '.');
    }

}
