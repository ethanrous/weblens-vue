<template>
    <div :class="{ 'flex h-screen w-screen justify-center': true }">
        <div :class="{ 'flex h-full w-[20%] flex-col gap-2 border p-4': true }">
            <h2>{{ towerStore.towerInfo?.name }}</h2>
            <WeblensButton
                label="User"
                @click="toSettingsPage('user')"
            >
                <IconUser />
            </WeblensButton>
            <WeblensButton
                label="Appearance"
                @click="toSettingsPage('appearance')"
            >
                <IconBrush />
            </WeblensButton>
            <WeblensButton
                label="Users"
                @click="toSettingsPage('users')"
            >
                <IconCode />
            </WeblensButton>
            <WeblensButton
                label="Developer"
                @click="toSettingsPage('dev')"
            >
                <IconCode />
            </WeblensButton>

            <WeblensButton
                label="Log Out"
                :class="{ 'mt-auto': true }"
                flavor="danger"
                @click="userStore.logout"
            >
                <IconLogout />
            </WeblensButton>
        </div>
        <div :class="{ 'h-full w-full p-4': true }">
            <NuxtPage />
        </div>
    </div>
</template>

<script setup lang="ts">
import { IconBrush, IconCode, IconLogout, IconUser } from '@tabler/icons-vue'
import WeblensButton from '~/components/atom/WeblensButton.vue'

const towerStore = useTowerStore()
const userStore = useUserStore()

function toSettingsPage(pageName: string) {
    navigateTo({ path: `/settings/${pageName}` })
}
</script>
