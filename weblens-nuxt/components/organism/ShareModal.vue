<template>
    <div
        :class="{
            'fullscreen-modal p-48 transition': true,
            'pointer-events-none opacity-0': !menuStore.isSharing,
        }"
    >
        <div
            ref="modal"
            :class="{
                'bg-card-background-primary flex h-full w-full flex-col gap-4 rounded border p-4': true,
            }"
            @click.stop
        >
            <div :class="{ 'flex items-center gap-1': true }">
                <h4>Share</h4>
                <FileIcon
                    :file="file"
                    :with-name="true"
                />
            </div>

            <div :class="{ 'flex w-full': true }">
                <UserSearch
                    :exclude-fn="excludeFn"
                    @select-user="(u) => share?.addAccessor(u.username)"
                />
                <WeblensButton
                    :label="share?.IsPublic() ? 'Public' : 'Private'"
                    :type="share?.IsPublic() ? 'default' : 'outline'"
                    :class="{
                        'mr-2 ml-auto': true,
                    }"
                    @click="toggleIsPublic"
                >
                    <IconLock v-if="!share?.IsPublic()" />
                    <IconLockOpen v-else />
                </WeblensButton>
                <WeblensButton
                    label="Timeline Only"
                    :type="share?.timelineOnly ? 'default' : 'outline'"
                    @click="toggleTimelienOnly"
                >
                    <IconPhoto v-if="share?.timelineOnly" />
                    <IconPhotoOff v-else />
                </WeblensButton>
            </div>
            <div :class="{ 'flex flex-col items-center': true }">
                <div
                    v-for="user of share?.accessors"
                    :key="user.username"
                    :class="{ 'bg-card-background-secondary flex w-full items-center gap-1 rounded p-2': true }"
                >
                    <h5>{{ user.fullName }} ({{ user.username }})</h5>
                    <WeblensButton
                        flavor="danger"
                        :class="{ 'ml-auto': true }"
                        @click.stop="share?.removeAccessor(user.username)"
                    >
                        <IconTrash />
                    </WeblensButton>
                </div>
            </div>
            <CopyBox
                :text="share?.Id() ? share?.GetLink() : undefined"
                :class="{ 'mt-auto': true }"
            />
            <div :class="{ 'flex gap-2': true }">
                <WeblensButton
                    label="Cancel"
                    flavor="secondary"
                    fill-width
                    @click.stop="menuStore.setSharing(false)"
                />
                <WeblensButton
                    label="Share"
                    fill-width
                >
                    <IconUserPlus />
                </WeblensButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IconLock, IconLockOpen, IconPhoto, IconPhotoOff, IconTrash, IconUserPlus } from '@tabler/icons-vue'
import WeblensButton from '../atom/WeblensButton.vue'
import type WeblensFile from '~/types/weblensFile'
import FileIcon from '../atom/FileIcon.vue'
import UserSearch from '../molecule/UserSearch.vue'
import CopyBox from '../molecule/CopyBox.vue'
import type { UserInfo } from '~/api/swag'
import { onClickOutside } from '@vueuse/core'

const menuStore = useContextMenuStore()

const modal = ref<HTMLDivElement>()
onClickOutside(modal, () => {
    if (menuStore.isSharing) menuStore.setSharing(false)
})

const props = defineProps<{
    file: WeblensFile
}>()

const { data: share } = useAsyncData(
    'share-' + props.file.Id(),
    async () => {
        return await props.file.GetShare()
    },
    { deep: false, watch: [() => props.file.Id()] },
)

function excludeFn(u: UserInfo) {
    if (share.value?.accessors.includes(u)) {
        return false
    }

    return true
}

async function toggleIsPublic() {
    if (!share.value) {
        console.error('No share to toggle isPublic')
        return
    }

    await share.value.toggleIsPublic()
}

async function toggleTimelienOnly() {
    if (!share.value) {
        console.error('No share to toggle isPublic')
        return
    }

    await share.value.toggleTimelineOnly()
}
</script>
