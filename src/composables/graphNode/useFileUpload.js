import { ref, computed } from 'vue';
import { store } from '../../router/store';
import { API_BASE } from '../../components/constants/config';
import { signInUrl, openPremiumModal } from './usePremium';
import { rocusAlert } from '../useRocusDialog';
import { websites, clusters, addProcessingPlaceholder, removeProcessingPlaceholder, remoteGraphId, effectiveAlbumId } from './useGraphEngine';
import { processWebsite } from './useAIModels';

// Drag-and-drop file upload onto the graph canvas. Signed-in only, full
// stop - dropping while signed out just redirects to sign-in (no attempt to
// hold onto the dropped file across that navigation); the user re-drops
// after landing back on /dashboard.

export const showDropOverlay = ref(false);
let dragCounter = 0;

const ACCEPTED_MIMETYPES = new Set([
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function handleDragEnter(event) {
	if (!event.dataTransfer?.types?.includes('Files')) return;
	dragCounter++;
	showDropOverlay.value = true;
}

export function handleDragOver(event) {
	if (!event.dataTransfer?.types?.includes('Files')) return;
	event.preventDefault();
}

export function handleDragLeave() {
	dragCounter = Math.max(0, dragCounter - 1);
	if (dragCounter === 0) showDropOverlay.value = false;
}

export function handleDrop(event) {
	dragCounter = 0;
	showDropOverlay.value = false;

	const files = Array.from(event.dataTransfer?.files || []);
	if (files.length === 0) return;

	if (!store.user) {
		window.location.href = signInUrl();
		return;
	}

	for (const file of files) {
		uploadFile(file);
	}
}

async function uploadFile(file) {
	if (!ACCEPTED_MIMETYPES.has(file.type)) {
		rocusAlert(`Rocus doesn't support "${file.name}" yet - PDF and DOCX only for now.`);
		return;
	}

	// Shown immediately, for the whole upload+Claude-analysis network round-
	// trip - not just the brief local-embedding step processWebsite() shows
	// its own placeholder for afterward. A quick back-to-back placeholder
	// handoff is expected and harmless.
	const placeholderNode = addProcessingPlaceholder({ metadata: { title: file.name } });

	try {
		const formData = new FormData();
		formData.append('file', file);

		let response, body;
		try {
			response = await fetch(`${API_BASE}/api/upload`, {
				method: 'POST',
				credentials: 'include',
				body: formData,
			});
			body = await response.json().catch(() => ({}));
		} finally {
			removeProcessingPlaceholder(placeholderNode.id);
		}

		if (response.status === 401) {
			window.location.href = signInUrl();
			return;
		}

		if (response.status === 403 && (body.code === 'UPLOAD_PREMIUM_REQUIRED' || body.code === 'UPLOAD_QUOTA_EXCEEDED')) {
			openPremiumModal();
			return;
		}

		if (!response.ok || !body.success) {
			console.error('Upload failed:', body);
			rocusAlert(`Failed to process "${file.name}". Please try again.`);
			return;
		}

		await processWebsite({
			url: `upload://${body.file_id}/${encodeURIComponent(file.name)}`,
			metadata: {
				title: file.name,
				domain: 'Uploaded File',
				description: '',
				keywords: '',
			},
			content: '',
			album: effectiveAlbumId(),
			precomputedAnalysis: { summary: body.summary, topic: body.topic, query: body.search_query },
			is_file: true,
			file_id: body.file_id,
		});
	} catch (err) {
		console.error('Upload error:', err);
		rocusAlert(`Failed to process "${file.name}". Please try again.`);
	}
}

// "My Files" - header panel listing every file this signed-in user has
// uploaded (from any device), with its topic resolved against THIS
// browser's local IndexedDB (topics themselves are never stored server-
// side, same as every other topic in the app) - a file uploaded elsewhere
// just shows its name/date with no topic, rather than erroring.
export const showUploadsPanel = ref(false);
export const uploadedFiles = ref([]);

export const uploadedFilesWithTopics = computed(() =>
	uploadedFiles.value.map((file) => {
		const website = file.website_id ? websites.value[file.website_id] : null;
		const cluster = website?.cluster_id ? clusters.value[website.cluster_id] : null;
		return { ...file, topic: cluster?.topic || null };
	})
);

const NO_TOPIC_LABEL = 'Uploaded elsewhere';

// Groups the flat file list into per-topic sections for the "My Files"
// panel header - named topics first (in whatever order they're first seen),
// with anything unresolvable on this device bucketed under one fallback
// heading at the end rather than mixed in.
export const filesByTopic = computed(() => {
	const groups = new Map();
	for (const file of uploadedFilesWithTopics.value) {
		const key = file.topic || NO_TOPIC_LABEL;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(file);
	}

	const entries = [...groups.entries()];
	entries.sort((a, b) => {
		if (a[0] === NO_TOPIC_LABEL) return 1;
		if (b[0] === NO_TOPIC_LABEL) return -1;
		return 0;
	});

	return entries.map(([topic, files]) => ({ topic, files }));
});

export async function fetchUploadedFiles() {
	try {
		const response = await fetch(`${API_BASE}/api/uploads`, { credentials: 'include' });
		if (!response.ok) return;
		const body = await response.json();
		uploadedFiles.value = body.files || [];
	} catch (err) {
		console.error('Failed to fetch uploaded files:', err);
	}
}

export function toggleUploadsPanel() {
	showUploadsPanel.value = !showUploadsPanel.value;
	if (showUploadsPanel.value) fetchUploadedFiles();
}

// The original file always lives on Rocus's server regardless of whether
// this browser can resolve which local topic it landed in, so a file this
// user uploaded is never a dead end - they can always pull it back down.
//
// Shared-view-aware: /api/uploads/:fileId/download is the owner's OWN
// personal "My Files" route (requireSession + owner_key-only) - it 404s/
// 401s for anyone else. A guest or invited collaborator viewing a shared
// graph needs the separate, shared-graph-scoped route instead. Previously
// this function always hit the personal route regardless of context, so
// downloading a file from the shared view never actually worked for anyone
// but the graph's own owner.
export function downloadFile(fileId) {
	const url = remoteGraphId.value
		? `${API_BASE}/api/shared/${remoteGraphId.value}/uploads/${fileId}/download`
		: `${API_BASE}/api/uploads/${fileId}/download`;
	window.open(url, '_blank');
}
