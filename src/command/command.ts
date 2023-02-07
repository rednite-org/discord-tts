import { CacheType, ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";

export type CompiledCommandJSON = RESTPostAPIChatInputApplicationCommandsJSONBody;

export interface Command {

    getName(): string;

    toJSON(): CompiledCommandJSON;

    handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void>;

}

export class CommandRepository {

    commands: Array<Command> = [];

    registerCommand(command: Command) {
        this.commands.push(command);
    }

    findByName(name: string): Command | null {
        for (const command of this.commands) {
            if (command.getName().toLowerCase() === name.toLowerCase()) {
                return command;
            }
        }
        return null;
    }

    all(): Array<Command> {
        return this.commands;
    }

}
