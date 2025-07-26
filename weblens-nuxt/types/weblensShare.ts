import type { PermissionsInfo, PermissionsParams, ShareInfo, UserInfo } from '@ethanrous/weblens-api'
import { useWeblensApi } from '~/api/AllApi'

export default class WeblensShare implements ShareInfo {
    shareId: string = ''
    accessors: UserInfo[] = []
    private _permissions: Record<string, PermissionsInfo> = {}
    expires: number = 0
    private _public: boolean = false
    fileId: string = ''
    shareName: string = ''
    wormhole: boolean = false
    owner: string = ''
    timelineOnly: boolean = false

    constructor(init: ShareInfo) {
        this.assign(init)
    }

    private assign(init: ShareInfo) {
        if (!init) {
            return
        }

        this.shareId = init.shareId || ''
        this.fileId = init.fileId || ''
        this.shareName = init.shareName || ''
        this.expires = init.expires || 0
        this._public = init.public ?? false
        this.wormhole = init.wormhole ?? false
        this.owner = init.owner || ''

        if (init.accessors) {
            this.accessors = init.accessors
        }

        if (init.permissions) {
            this._permissions = init.permissions
        }
    }

    Id(): string {
        return this.shareId
    }

    IsPublic() {
        return this._public
    }

    public get public(): boolean {
        return this._public
    }

    public get permissions(): Record<string, PermissionsParams> {
        return this._permissions
    }

    IsWormhole() {
        return this.wormhole
    }

    GetFileId(): string {
        return this.fileId
    }

    GetAccessors(): UserInfo[] {
        return this.accessors
    }

    GetLink(): string {
        return `${window.location.origin}/files/share/${this.shareId}${this.timelineOnly ? '?timeline=true' : ''}`
    }

    private async createShare() {
        if (this.shareId) {
            return
        }

        const { data: shareInfo } = await useWeblensApi().SharesApi.createFileShare({
            fileId: this.fileId,
            public: this._public,
            wormhole: this.wormhole,
        })

        this.assign(shareInfo)
    }

    public checkPermission(permission: keyof PermissionsParams, username?: string): boolean {
        if (!username) {
            username = useUserStore().user.username
        }

        if (this.owner === username) {
            return true
        }

        if (!this._permissions[username]) {
            return false
        }

        const perms = this._permissions[username]
        return !!perms[permission]
    }

    public async addAccessor(username: string) {
        await this.createShare()

        const newInfo = (
            await useWeblensApi().SharesApi.addUserToShare(this.shareId, {
                username: username,
            })
        ).data

        if (!newInfo.accessors) {
            return
        }

        this.accessors = newInfo.accessors
    }

    public async removeAccessor(username: string) {
        const newInfo = (await useWeblensApi().SharesApi.removeUserFromShare(this.shareId, username)).data

        if (!newInfo.accessors) {
            return
        }

        this.accessors = newInfo.accessors
    }

    public async toggleIsPublic() {
        return this.setPublic(!this._public)
    }

    public async toggleTimelineOnly() {
        return this.setTimelineOnly(!this.timelineOnly)
    }

    public async setPublic(isPublic: boolean) {
        await this.createShare()

        if (this._public === isPublic) {
            return
        }

        await useWeblensApi().SharesApi.setSharePublic(this.shareId, isPublic)
        this._public = isPublic
    }

    public async setTimelineOnly(timelineOnly: boolean) {
        await this.createShare()

        if (this.timelineOnly === timelineOnly) {
            return
        }

        // await useWeblensApi().SharesApi.setTimelineOnly(this.shareId, timelineOnly)
        this.timelineOnly = timelineOnly
    }

    public async updateAccessorPerms(user: string, perms: PermissionsParams) {
        await useWeblensApi().SharesApi.updateShareAccessorPermissions(this.shareId, user, perms)
    }
}
