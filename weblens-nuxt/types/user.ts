import type { UserInfo } from '~/api/swag'
import { Optional } from '~/util/option'

export enum UserPermissions {
    Public = 0,
    Basic = 1,
    Admin = 2,
    Owner = 3,
    System = 4,
}

export default class User implements UserInfo {
    fullName: string = ''
    homeId: string = ''
    homeSize: number = 0
    permissionLevel: number = 0
    token?: string
    trashId: string = ''
    trashSize: number = 0
    username: string = ''
    activated: boolean = false

    isLoggedIn: Optional<boolean>

    constructor(info?: UserInfo, isLoggedIn?: boolean) {
        if (info) {
            Object.assign(this, info)
        }

        this.isLoggedIn = new Optional(isLoggedIn)
    }

    public doThing() {

    }
}
