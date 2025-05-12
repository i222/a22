<!-- ui-vue/src/views/TrackSelector.vue -->
<template>
	<n-list bordered>
		<n-list-item v-for="(track, index) in tracks" :key="index">
			<n-checkbox
				:label="track.format"
				:checked="selectedIndexes.includes(index)"
				@update:checked="(checked) => toggleSelection(index, checked)"
			/>
		</n-list-item>
	</n-list>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { MediaFile } from 'a22-share';

const props = defineProps<{
	tracks: MediaFile.Track[];
	modelValue: MediaFile.Track[];
}>();

const emit = defineEmits(['update:modelValue']);

const selectedIndexes = ref<number[]>([]);

watch(
	() => props.modelValue,
	() => {
		selectedIndexes.value = props.tracks
			.map((track, i) => (props.modelValue.includes(track) ? i : -1))
			.filter(i => i !== -1);
	},
	{ immediate: true }
);

function toggleSelection(index: number, checked: boolean) {
	if (checked) {
		if (!selectedIndexes.value.includes(index)) {
			selectedIndexes.value.push(index);
		}
	} else {
		selectedIndexes.value = selectedIndexes.value.filter(i => i !== index);
	}
	emit('update:modelValue', selectedIndexes.value.map(i => props.tracks[i]));
}
</script>
