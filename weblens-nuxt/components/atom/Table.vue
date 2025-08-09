<template>
    <div :class="{ 'rounded border': true }">
        <table :class="{ 'w-full caption-bottom border-separate border-spacing-0 text-sm xl:table-fixed': true }">
            <thead :class="{ 'sticky top-0 [&_tr]:border-b': true }">
                <tr
                    :class="{
                        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors': true,
                    }"
                >
                    <th
                        v-for="column in props.columns"
                        :key="column"
                        :class="{
                            'text-text-secondary bg-background relative h-10 w-max border-r border-b px-2 align-middle font-medium whitespace-nowrap first:text-left last:w-full last:max-w-1/2 last:border-r-0 last:text-right [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]': true,
                        }"
                    >
                        {{ camelCaseToWords(column) }}
                    </th>
                </tr>
            </thead>
            <tbody :class="{ '[&_tr:last-child]:border-0': true }">
                <tr
                    v-for="(row, index) in props.rows"
                    :key="index"
                    :class="{
                        'hover:bg-muted/50 data-[state=selected]:bg-muted even:bg-accent/25 cursor-pointer border-b transition-colors': true,
                    }"
                >
                    <td
                        v-for="column in props.columns"
                        :key="column"
                        :class="{
                            'overflow-hidden p-4 text-center align-middle overflow-ellipsis first:text-left last:text-right [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]': true,
                        }"
                    >
                        <span v-if="typeof row[column] === 'string'">
                            {{ row[column] }}
                        </span>
                        <WeblensButton
                            v-else-if="row[column]?.tableType === 'button'"
                            :label="row[column].label"
                            :flavor="row[column].flavor ?? 'primary'"
                        >
                            <component :is="row[column].icon" />
                        </WeblensButton>
                        <WeblensCheckbox
                            v-else-if="row[column]?.tableType === 'checkbox'"
                            :class="{ 'inline-block': true }"
                            :label="row[column].label"
                            :checked="row[column].checked"
                            @changed="row[column].onchanged"
                        />
                        <span v-else>unknown cell type</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
import type { TableColumns } from '~/types/table'
import WeblensButton from './WeblensButton.vue'
import WeblensCheckbox from './WeblensCheckbox.vue'
import { camelCaseToWords } from '~/util/string'

const props = defineProps<{
    columns: string[]
    rows: TableColumns
}>()
</script>
