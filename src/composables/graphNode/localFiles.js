/*
 * Copyright (C) 2025-2026 Othman Ali
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

// Local-mode files: text extraction and storage entirely on this device.
// Nothing here talks to a server. PDF parsing (pdf.js) and DOCX unzipping
// (fflate) are loaded lazily, only when a file is actually added.

const MAX_CHARS = 20000; // summarization only reads the first 2,500
const CACHE_NAME = "rocus-local-files";
const cacheKey = (key) => `/local-files/${key}`;

export const PDF_TYPE = "application/pdf";
export const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function extractFileText(file) {
	const raw = file.type === PDF_TYPE ? await extractPdf(file) : await extractDocx(file);
	return raw
		.replace(/[ \t ]+/g, " ")
		.replace(/ *\n */g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim()
		.slice(0, MAX_CHARS);
}

// pdf.js parses in a Web Worker. It's bundled through Vite's ?worker import so
// it ships as a .js file: loading pdf.js's own .mjs worker by URL broke on
// rocus.io, whose nginx serves .mjs as application/octet-stream with nosniff,
// so the browser refused to run it and every PDF failed. One worker, reused.
let pdfWorker = null;

async function extractPdf(file) {
	const pdfjs = await import("pdfjs-dist");
	if (!pdfWorker) {
		const { default: PdfWorker } = await import("pdfjs-dist/build/pdf.worker.min.mjs?worker");
		pdfWorker = new PdfWorker();
	}
	pdfjs.GlobalWorkerOptions.workerPort = pdfWorker;

	const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
	let text = "";
	try {
		const doc = await task.promise;
		for (let i = 1; i <= doc.numPages && text.length < MAX_CHARS; i++) {
			const page = await doc.getPage(i);
			const content = await page.getTextContent();
			for (const item of content.items) {
				if (typeof item.str !== "string") continue;
				text += item.str + (item.hasEOL ? "\n" : " ");
			}
			text += "\n";
			page.cleanup();
		}
	} finally {
		await task.destroy();
	}
	return text;
}

async function extractDocx(file) {
	const { unzipSync, strFromU8 } = await import("fflate");
	const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
		filter: (f) => f.name === "word/document.xml",
	});
	const xml = entries["word/document.xml"];
	if (!xml) throw new Error("Not a Word document (no word/document.xml)");
	return decodeXmlEntities(
		strFromU8(xml)
			.replace(/<w:tab\/>/g, " ")
			.replace(/<w:br\/>/g, "\n")
			.replace(/<\/w:p>/g, "\n")
			.replace(/<[^>]+>/g, "")
	);
}

function decodeXmlEntities(s) {
	return s
		.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
		.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&amp;/g, "&");
}

// The original file is kept in this browser's Cache Storage so "View File"
// works on this device. It is never uploaded; on any other device (or for a
// shared-graph viewer) the file simply isn't there.
export async function storeLocalFile(key, file) {
	const cache = await caches.open(CACHE_NAME);
	await cache.put(cacheKey(key), new Response(file, { headers: { "content-type": file.type || "application/octet-stream" } }));
}

export async function readLocalFile(key) {
	try {
		const cache = await caches.open(CACHE_NAME);
		const res = await cache.match(cacheKey(key));
		return res ? await res.blob() : null;
	} catch {
		return null;
	}
}

export async function deleteLocalFile(key) {
	try {
		const cache = await caches.open(CACHE_NAME);
		await cache.delete(cacheKey(key));
	} catch {
		// nothing stored, or storage unavailable
	}
}
