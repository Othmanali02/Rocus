import { ref, computed } from 'vue';
import { store } from '../../router/store';
import { API_BASE } from '../../components/constants/config';
import { signInUrl, openPremiumModal } from './usePremium';
import { currentAlbum, websites, clusters } from './useGraphEngine';
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
		alert(`Rocus doesn't support "${file.name}" yet - PDF and DOCX only for now.`);
		return;
	}

	try {
		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch(`${API_BASE}/api/upload`, {
			method: 'POST',
			credentials: 'include',
			body: formData,
		});

		const body = await response.json().catch(() => ({}));

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
			alert(`Failed to process "${file.name}". Please try again.`);
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
			album: currentAlbum.value?.id || null,
			precomputedAnalysis: { summary: body.summary, topic: body.topic, query: body.search_query },
			is_file: true,
			file_id: body.file_id,
		});
	} catch (err) {
		console.error('Upload error:', err);
		alert(`Failed to process "${file.name}". Please try again.`);
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
export function downloadFile(fileId) {
	window.open(`${API_BASE}/api/uploads/${fileId}/download`, '_blank');
}
