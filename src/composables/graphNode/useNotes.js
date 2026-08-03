import { ref, reactive, watch } from 'vue';
import { websites, currentAlbum, rankCandidateClusters, saveToIndexedDB, refreshData, NOTES_HUB_SENTINEL, isReadOnlySharedView, remoteGraphId, refreshRemoteGraphView } from './useGraphEngine';
import { processNote, generateEmbedding } from './useAIModels';

export { NOTES_HUB_SENTINEL };

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

// The "Note"/"File" dropdown opened by left-clicking the "+" - separate from
// showAddNotePrompt (which only ever controls the round "+" button itself),
// positioned at wherever that left-click actually landed on the button
// rather than reusing the original right-click coordinates.
export const showAddTypeMenu = ref(false);
export const addTypeMenuStyle = ref({});

// Live "suggested clusters" - read-only preview of where Create would send
// this note, computed from the exact same rankCandidateClusters() the real
// save uses, so the preview can never promise something the save doesn't
// honor. Debounced so it only runs once you pause typing, never mid-keystroke.
export const noteSuggestions = ref([]);
export const selectedSuggestionClusterId = ref(null);

let suggestionDebounce = null;
const SUGGESTION_DEBOUNCE_MS = 600;

watch(
	() => noteForm.text,
	(text) => {
		clearTimeout(suggestionDebounce);
		const trimmed = text.trim();
		if (trimmed.length < 3) {
			noteSuggestions.value = [];
			return;
		}
		suggestionDebounce = setTimeout(async () => {
			const embedding = await generateEmbedding(trimmed);
			if (!embedding) {
				noteSuggestions.value = [];
				return;
			}
			// The text may have changed again during the async embedding call -
			// drop a stale result rather than showing suggestions for old text.
			if (noteForm.text.trim() !== trimmed) return;
			const albumId = currentAlbum.value?.id || null;
			noteSuggestions.value = rankCandidateClusters(embedding, trimmed, albumId);
		}, SUGGESTION_DEBOUNCE_MS);
	}
);

// Clicking an already-selected chip clears it back to "auto" (let the
// algorithm decide at save time, same as not touching suggestions at all).
export function toggleSuggestion(clusterId) {
	selectedSuggestionClusterId.value =
		selectedSuggestionClusterId.value === clusterId ? null : clusterId;
}

// Right click on empty canvas - shows a small "+" prompt at the click
// point; clicking it opens the create-note modal. Single-shot, no counting -
// bound via @contextmenu.prevent so the native context menu never appears
// over the graph background.
export function handleGraphRightClick(event) {
	// Guarded here, not just by hiding a button - this is a gesture on the
	// graph background itself, so a view-only collaborator or guest needs to
	// be stopped at the handler, not just have some UI element removed.
	if (isReadOnlySharedView.value) return;
	addNotePromptStyle.value = { left: event.pageX + 'px', top: event.pageY + 'px' };
	showAddNotePrompt.value = true;
	showAddTypeMenu.value = false;
}

export function dismissAddNotePrompt() {
	showAddNotePrompt.value = false;
	showAddTypeMenu.value = false;
}

// Left-click on the "+" - opens the Note/File dropdown right where the click
// landed, and hides the "+" itself while the dropdown is open.
export function openAddTypeMenu(event) {
	addTypeMenuStyle.value = { left: event.pageX + 'px', top: event.pageY + 'px' };
	showAddTypeMenu.value = true;
	showAddNotePrompt.value = false;
}

export function closeAddTypeMenu() {
	showAddTypeMenu.value = false;
}

export function confirmAddNoteFromPrompt() {
	openNoteCreator();
}

// Triple-left-click on empty canvas opens the note creator directly,
// skipping the "+" prompt - three background left-clicks within 600ms of
// each other. Node-level clicks already stopPropagation, so this only ever
// sees genuine empty-canvas clicks. The event.button guard matters here:
// browsers are inconsistent about whether a right mouse button press also
// fires a plain "click" event (spec says click is for the primary button,
// but this isn't universally honored across browsers/OSes/pointer devices) -
// without this check, a stray right-click could count toward the triple-
// click alongside intentional left-clicks.
let leftClickTimes = [];
export function handleGraphLeftClick(event) {
	if (event.button !== 0) return;
	if (isReadOnlySharedView.value) return;
	const now = Date.now();
	leftClickTimes = leftClickTimes.filter((t) => now - t < 600);
	leftClickTimes.push(now);
	if (leftClickTimes.length >= 3) {
		leftClickTimes = [];
		openNoteCreator();
	}
}

export function openNoteCreator() {
	clearTimeout(suggestionDebounce);
	editingNoteId.value = null;
	noteForm.text = '';
	noteSuggestions.value = [];
	selectedSuggestionClusterId.value = null;
	showNoteModal.value = true;
	showAddNotePrompt.value = false;
	showAddTypeMenu.value = false;
}

export function openNoteEditor(note) {
	clearTimeout(suggestionDebounce);
	editingNoteId.value = note.id;
	noteForm.text = note.text;
	noteSuggestions.value = [];
	selectedSuggestionClusterId.value = null;
	showNoteModal.value = true;
}

export function closeNoteModal() {
	clearTimeout(suggestionDebounce);
	showNoteModal.value = false;
	editingNoteId.value = null;
	noteForm.text = '';
	noteSuggestions.value = [];
	selectedSuggestionClusterId.value = null;
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

			// Live-push to a shared graph if relevant (no-op internally
			// otherwise) - same missing-sync bug as every other local-only
			// mutation found this session: without this, editing a note's
			// text only ever changed this browser's own local copy, silently
			// reverting for every other collaborator on their next refetch.
			// Dynamic import - this file sits in the same
			// useGraphEngine -> useNotes -> useAIModels -> useSharing eval
			// chain documented in useSharing.js's own initLocalOwnerSync()
			// comment, so it gets the same safe-import treatment
			// useGraphEngine.js itself uses for reaching into useSharing.js.
			const { pushNodeUpdateForAlbum } = await import('./useSharing');
			pushNodeUpdateForAlbum(website.album_id, [
				{ id: editingNoteId.value, type: 'website', data: website },
			]);

			if (remoteGraphId.value) {
				await refreshRemoteGraphView();
			} else {
				await refreshData();
			}
		}
		closeNoteModal();
	} else {
		const forcedClusterId = selectedSuggestionClusterId.value;
		closeNoteModal();
		await processNote(text, forcedClusterId);
	}
}
