<template>
    <div
        ref="inputRef"
        :class="{ 'relative w-max': true }"
    >
        <WeblensInput
            v-model:value="search"
            placeholder="Search Users..."
        />
        <div
            v-if="users?.length && focused"
            :class="{ 'bg-card-background-secondary absolute z-10 w-full rounded p-1 shadow': true }"
        >
            <div
                v-for="user in users"
                :key="user.username"
                :class="{ 'hover:bg-card-background-hover cursor-pointer rounded p-0.5': true }"
                @click="emit('selectUser', user)"
            >
                <div>
                    <strong>{{ user.fullName }}</strong> ({{ user.username }})
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import WeblensInput from '../atom/WeblensInput.vue'
import type { UserInfo } from '~/api/swag'
import { useFocusWithin } from '@vueuse/core'
import { useWeblensApi } from '~/api/AllApi'

const search = ref<string>('')
const inputRef = ref<HTMLInputElement>()
const focused = useFocusWithin(inputRef.value)

const props = defineProps<{
    excludeFn?: (user: UserInfo) => boolean
}>()

const { data: users } = useAsyncData(
    'userSearch-' + search.value,
    async () => {
        if (search.value.length < 2) {
            return []
        }

        return useWeblensApi()
            .UsersApi.searchUsers(search.value)
            .then((response) => {
                const users = response.data
                if (props.excludeFn) {
                    return users.filter(props.excludeFn)
                }
                return users
            })
            .catch((error) => {
                console.error('Error fetching user search results:', error)
                return []
            })
    },
    { watch: [search] },
)

const emit = defineEmits<{
    (e: 'selectUser', value: UserInfo): void
}>()

// watchEffect(() => {
//     if (!users.value || !props.excludeFn) {
//         return
//     }
//
//     users.value = users.value?.filter(props.excludeFn)
// })
</script>
