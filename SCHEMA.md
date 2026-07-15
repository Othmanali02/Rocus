# Rocus export format (`.rocus`, v2.0.0)

A `.rocus` file is a single JSON document. It is produced by "Export Data"
and consumed by "Import Data" in the Rocus UI, but it is meant to be
readable by anything: **a reader Rocus did not write should be able to
consume this file without asking Rocus what anything means.**

This document is the source of truth for the file's shape. If you can't
write a reader from this document alone, the document is wrong - file an
issue rather than reverse-engineering the app's source.

## Top-level shape

```jsonc
{
  "version": "2.0.0",
  "exportDate": "2026-07-15T09:35:25.905Z", // ISO-8601, when this file was written
  "albums": [ /* Album[] */ ],
  "clusters": [ /* Cluster[] */ ],
  "websites": [ /* Website[] */ ],
  "embeddings": { /* websiteId -> Embedding */ },
  "_app_settings": { "theme": { "id": "default-dark", "isDark": true } }
}
```

- `version` is a plain [semver](https://semver.org)-shaped string for **the
  file format**, not the app release. Bump it whenever a field is added,
  renamed, removed, or reinterpreted.
- `_app_settings` is intentionally namespaced with a leading underscore:
  it's Rocus's own display configuration (which theme was active), not
  portable user data. A reader can ignore it entirely and lose nothing
  about the user's actual bookmarks/clusters/albums.

No `$type` tag exists yet on individual records (a planned addition -
see "Known gaps" below). Until then, a record's type is determined by
which top-level array it's in.

## Website

One entry per bookmarked page.

| Field           | Type                  | Required | Authoritative? | Notes |
|-----------------|-----------------------|----------|-----------------|-------|
| `id`            | string                | yes      | yes             | Locally-generated, install-scoped. Not a stable cross-install identity (see "Known gaps"). |
| `url`           | string                | yes      | yes             | Not normalized (case, trailing slash, tracking params as-is). |
| `title`         | string                | yes      | yes             | |
| `domain`        | string                | yes      | derived         | Derived from `url` at process time; may drift if `url` is edited elsewhere. |
| `ai_label`      | string \| null        | yes      | **no**          | Model-generated caption (Web-LLM), not a controlled classification. Treat as a hint, not ground truth. |
| `ai_label_dirty`| boolean               | yes      | -               | `true` if `ai_label` still shows raw-generation artifacts (e.g. a leading quote character) from before this was fixed. Never re-derived automatically - don't trust `ai_label` on a `dirty` record. |
| `ai_summary`    | string                | yes      | no              | Model-generated 2-3 sentence summary. |
| `metadata`      | object                | yes      | yes             | Free-form page metadata captured at process time (title/description/etc. as scraped). Shape not further specified - treat as opaque. |
| `album_id`      | string \| null        | yes      | yes             | `null` means "no album" (the website's own view). See `Cluster.album_id` for the field that's actually authoritative for grouping - this one may not agree with it for uncategorized sites. |
| `cluster_id`    | string \| null        | yes      | derived         | Which cluster this website currently belongs to. Derived from `Cluster.websites` (the reverse pointer); if the two disagree, `Cluster.websites` wins. `null` if never assigned. |
| `processed_at`  | string (ISO-8601)     | yes      | yes             | When this bookmark was first processed. |

Dropped from the export entirely (present in the app's own storage, never
in the file): `search_query` - an internal prompt used to seed a Google
search for similar links. It's an implementation detail, not user data.

## Cluster

A group of websites the app has decided are related. Roughly "a folder
Rocus made for you," not something the user necessarily created by hand.

| Field                 | Type            | Required | Authoritative? | Notes |
|-----------------------|-----------------|----------|-----------------|-------|
| `id`                  | string          | yes      | yes             | Locally-generated, install-scoped. |
| `ai_label`            | string \| null  | yes      | **no**          | Same caveat as `Website.ai_label` - this is the cluster's display name, generated the same way (or renamed by hand via the UI, in which case it's just as reliable as any user-entered text). |
| `ai_label_dirty`      | boolean         | yes      | -               | Same meaning as `Website.ai_label_dirty`. |
| `websites`            | string[]        | yes      | **yes**         | Website ids in this cluster. This is the authoritative membership list - `Website.cluster_id` is derived from it, not the other way around. |
| `album_id`            | string \| null  | yes      | **yes**         | The authoritative field for "which album is this cluster in" (see "Known gaps" for `Album.cluster_ids`, which is not authoritative and may be removed). |
| `manual_connections`  | string[]        | yes      | yes             | Cluster ids the user explicitly connected by hand (as opposed to a computed similarity edge). The most reliable signal in the file, and currently the thinnest - see "Known gaps". |
| `similar_links`       | object          | yes      | no              | `{ websiteId -> [{ title, url, snippet, domain }] }` - cached external search results ("you might also like"), not edges into this file's own graph. See "Known gaps" for a planned split between cached-external-results and in-library references. |

## Album

A user-created folder that clusters can be placed into.

| Field         | Type              | Required | Authoritative? | Notes |
|---------------|-------------------|----------|-----------------|-------|
| `id`          | string            | yes      | yes             | |
| `name`        | string            | yes      | yes             | |
| `icon`        | string            | yes      | yes             | An emoji (`"📁"`), or an `http(s):`/`data:` URI. Never a bare filename - Rocus's own 3 built-in icons are mapped to emoji at export time specifically so this file never references an asset path only Rocus can resolve. |
| `cluster_ids` | string[]          | yes      | **no - dead**   | Currently always empty in practice; `Cluster.album_id` is what's actually written and read for membership. Don't rely on this field; it may be removed. |
| `created_at`  | string (ISO-8601) | yes      | yes             | |
| `updated_at`  | string (ISO-8601) \| null | yes | yes         | `null` if the album has never been edited since creation. |

## Embeddings

```jsonc
"embeddings": {
  "<websiteId>": {
    "model": "Xenova/all-MiniLM-L6-v2", // or "unknown" for pre-2.0.0 vectors
    "dim": 384,
    "normalized": true,   // null if unknown (legacy vectors)
    "created_at": "2026-06-27T09:35:25.905Z", // null if unknown (legacy vectors)
    "v": [ /* dim floats */ ]
  }
}
```

- Keyed by `Website.id`.
- `model: "unknown"` means this vector predates provenance tracking (a
  v1.0.0 export, or a vector generated before this field existed). Never
  compare an `"unknown"` vector against a vector from a known model and
  assume the cosine similarity means anything - they may not even share
  a coordinate space.
- A reader that wants to embed a new document into the same space as a
  given vector should load exactly the model named in `model`, using
  `pooling: "mean"` and normalizing the output when `normalized: true`.

## Versioning & migration

- `version` is `"2.0.0"` as of this document. `"1.x.x"` files are the
  pre-provenance/pre-`ai_label`/pre-declared-fields format: bare `topic`
  instead of `ai_label`/`ai_label_dirty`, bare `[float]` embeddings, a
  top-level `theme` instead of `_app_settings.theme`, `search_query`
  present on websites, and no guarantee that every declared field here
  is actually present.
- Rocus migrates `1.x.x -> 2.0.0` on import automatically
  (`migrateToCurrentVersion` in `src/composables/graphNode/rocusExportFormat.js`).
  A reader implementing its own import should do the same: treat a
  missing `ai_label`/`_app_settings` as "this is a 1.x file" and apply
  the equivalent mapping described above field-by-field.

## Known gaps (not yet implemented)

These are known, tracked follow-ups - the format above is honest about
their absence rather than pretending they're solved:

- **No `$type` tag and no cross-install identity.** Two exports from two
  different installs cannot currently be merged - `id` values are only
  meaningful within the install that generated them, and there's no
  normalized-URL-based identity to dedupe on.
- **`Album.cluster_ids` is a dead field.** `Cluster.album_id` is what's
  actually authoritative; `cluster_ids` should either be removed or
  computed at read time, never persisted.
- **`Cluster.similar_links` mixes cached external search results with
  potential in-library edges.** A URL in `similar_links` that happens to
  match another bookmark in the same export is not currently
  distinguished from one that doesn't.
