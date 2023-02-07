import { User } from "./user";
import fs from 'fs-extra'
import path from 'node:path';

export interface UserRepository {

    createOrUpdate(user: User): void;

    get(id: string): User | null;

}

export class FileUserRepository implements UserRepository {

    folderName: string;

    constructor(folderName: string) {
        this.folderName = folderName

        fs.mkdirpSync(folderName)
    }

    createOrUpdate(user: User): void {
        fs.writeJsonSync(this.constructPath(user.id), user);
    }

    get(id: string): User | null {
        const path = this.constructPath(id);
        if (fs.existsSync(path)) {
            return fs.readJsonSync(path);
        } 
        return null;
    }

    constructPath(id: string): string {
        return path.join(this.folderName, id + '.json');
    }

}
