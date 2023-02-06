import { config } from 'dotenv'

config()

export const folderId = getenv('FOLDER_ID')
export const discordToken = getenv('DISCORD_TOKEN') 


function getenv(name: string, defaultValue?: string) {
    const value = process.env[name] 

    if (defaultValue === undefined && value === undefined) {
        throw new Error(`You must specify ${name} envs`)
    } 

    return (value ?? defaultValue) as string
}

export default {
    folderId,
    discordToken
}