import { ref, reactive } from 'vue';
import { websites, saveToIndexedDB, refreshData } from './useGraphEngine';
import { processNote } from './useAIModels';

// UI entry points for creating/editing a note - triple-right-click or the
// left-click "+" prompt on empty canvas. Where the note ends up RENDERED is
// no longer tied to where you clicked (see processNote/assignNoteToCluster
// in useAIModels.js/useGraphEngine.js) - a note joins a real topic cluster
// on a semantic match, or the shared "Notes" hub otherwise. The click
// position here only decides where the creation UI itself appears.

export const showNoteModal = ref(false);
export const editingNoteId = ref(null);
export const noteForm = reactive({ text: '' });

export const showAddNotePrompt = ref(false);
export const addNotePromptStyle = ref({});

// Left click on empty canvas - shows a small "+" prompt at the click point;
// clicking it opens the create-note modal. Bound alongside (not instead of)
// the existing handleBackgroundClick.
export function handleGraphLeftClick(event) {
	addNotePromptStyle.value = { left: event.pageX + 'px', top: event.pageY + 'px' };
	showAddNotePrompt.value = true;
}

export function dismissAddNotePrompt() {
	showAddNotePrompt.value = false;
}

export function confirmAddNoteFromPrompt() {
	openNoteCreator();
}

// Triple-right-click on empty canvas opens the note creator directly,
// skipping the "+" prompt - three background right-clicks within 600ms of
// each other. Node-level right-clicks already stopPropagation, so this only
// ever sees genuine empty-canvas right-clicks.
let rightClickTimes = [];
export function handleGraphRightClick() {
	const now = Date.now();
	rightClickTimes = rightClickTimes.filter((t) => now - t < 600);
	rightClickTimes.push(now);
	if (rightClickTimes.length >= 3) {
		rightClickTimes = [];
		openNoteCreator();
	}
}

export function openNoteCreator() {
	editingNoteId.value = null;
	noteForm.text = '';
	showNoteModal.value = true;
	showAddNotePrompt.value = false;
}

export function openNoteEditor(note) {
	editingNoteId.value = note.id;
	noteForm.text = note.text;
	showNoteModal.value = true;
}

export function closeNoteModal() {
	showNoteModal.value = false;
	editingNoteId.value = null;
	noteForm.text = '';
}

export async function saveNote() {
	const text = noteForm.text.trim();
	if (!text) return;

	if (editingNoteId.value) {
		// Editing only updates the note's text - it does not re-embed or
		// re-cluster, matching the existing title-edit precedent elsewhere
		// (confirmWebsiteEdit). A note that changes meaning entirely won't
		// move to a better-matching cluster until recreated.
		const website = websites.value[editingNoteId.value];
		if (website) {
			website.note_text = text;
			website.ai_summary = text;
			website.title = text.slice(0, 60) || 'Note';
			await saveToIndexedDB();
			await refreshData();
		}
		closeNoteModal();
	} else {
		closeNoteModal();
		await processNote(text);
	}
}
