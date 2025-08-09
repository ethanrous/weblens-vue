<template>
    <div>
        <span> Users </span>
        <Table
            :columns="['username', 'role', 'permissions']"
            :rows="rows"
        />
        <div :class="{ 'flex items-center gap-3': true }">
            <WeblensInput
                v-model="newUsername"
                placeholder="Username"
            />
            <WeblensInput
                v-model="newPassword"
                placeholder="Password"
                password
            />
            <WeblensButton
                label="New User"
                :class="{ 'my-2': true }"
                :disabled="!newUsername || !newPassword"
                @click.stop="handleNewUser"
            >
                <IconUserPlus />
            </WeblensButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IconUserPlus } from '@tabler/icons-vue'
import { useWeblensApi } from '~/api/AllApi'
import Table from '~/components/atom/Table.vue'
import WeblensButton from '~/components/atom/WeblensButton.vue'
import WeblensInput from '~/components/atom/WeblensInput.vue'
import User from '~/types/user'

const newUsername = ref('')
const newPassword = ref('')

const { data: users, refresh } = useAsyncData('users', async () => {
    const { data } = await useWeblensApi().UsersApi.getUsers()
    return data
})
const rows = computed(() => {
    if (!users.value) {
        return []
    }

    return users.value.map((user) => {
        let permissions
        if (!user.activated) {
            permissions = {
                label: 'Activate',
                onclick: async () => {
                    await useWeblensApi().UsersApi.activateUser(user.username, true)
                    refresh()
                },
            }
        }

        return {
            username: user.username,
            role: User.GetPermissionLevelName(user.permissionLevel),
            permissions,
        }
    })
})

async function handleNewUser() {
    if (!newUsername.value || !newPassword.value) {
        return
    }

    await useWeblensApi().UsersApi.createUser({
        username: newUsername.value,
        password: newPassword.value,
        autoActivate: true,
        fullName: '',
    })

    newUsername.value = ''
    newPassword.value = ''
    await refresh()
}
</script>
