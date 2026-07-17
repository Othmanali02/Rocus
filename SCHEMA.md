# Rocus export format (`.rocus`, v3.0.0)

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
  "version": "3.0.0",
  "exportDate": "2026-07-15T09:35:25.905Z", // ISO-8601, when this file was written
  "albums": [ /* Album[] */ ],
  "clusters": [ /* Cluster[] */ ],
  "websites": [ /* Website[] */ ],
  "edges": [ /* Edge[] */ ],
  "embeddings": { /* uri -> Embedding */ },
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

Every record (`Website`, `Cluster`, `Album`, and each entry in `edges`)
carries a `$type` tag (`io.rocus.bookmark`, `io.rocus.cluster`,
`io.rocus.album`, `io.rocus.link`) so a reader can identify a record's
kind without relying on which array it came from - useful if a future
version ever mixes record types together.

## Identity: `local_id` vs `uri`

Every record has a `local_id` - Rocus's own internally-generated id for it,
carried over unchanged from the app's storage. It is **only unique within
the install that wrote this file.** Two exports from two different
installs (or two exports of the same library taken far enough apart that
data was recreated) can reuse the same `local_id` for unrelated records.
Cross-references *within* this file (`Cluster.websites`, `Cluster.album_id`,
`Website.cluster_id`, `Edge.from`/`Edge.to`) are `local_id`s - fine for
navigating one document, not for matching two documents against each other.

`Website` additionally has a `uri`: the bookmark's URL, normalized (see
below). This *is* meaningful across installs and across time - two
bookmarks of the same page, from any two exports, normalize to the same
`uri`. This is the field to dedupe on if you're comparing or merging two
exports; `local_id` is not.

Clusters and albums have no equivalent portable identity - they're
locally-computed groupings (a cluster is "pages Rocus decided are
related," not something with an existence outside this app), so there's
nothing honest to normalize them to. They only have `local_id`.

### URL normalization

```
normalizeUrl(url):
  - lowercase the hostname
  - drop the fragment (#...)
  - drop known tracking params (utm_*, gclid, fbclid, msclkid, mc_cid,
    mc_eid, ref, ref_src, igshid, spm) and sort the remaining ones
  - strip a trailing slash from the path (except the root "/")
```

Not a full canonicalization spec (scheme, default ports, `www.` etc. are
left alone) - just the handful of differences that come up from ordinary
browsing (a shared link with `?utm_source=...`, a bookmarked page visited
again with a trailing slash). A URL that fails to parse is passed through
unchanged rather than dropped.

## Website

One entry per bookmarked page.

| Field           | Type                  | Required | Authoritative? | Notes |
|-----------------|-----------------------|----------|-----------------|-------|
| `$type`         | string                | yes      | -               | Always `"io.rocus.bookmark"`. |
| `local_id`      | string                | yes      | yes             | Locally-generated, install-scoped. See "Identity" above. |
| `uri`           | string                | yes      | yes             | `normalizeUrl(url)`. The portable, cross-install identity for this bookmark. |
| `url`           | string                | yes      | yes             | As stored - not normalized. |
| `title`         | string                | yes      | yes             | |
| `domain`        | string                | yes      | derived         | Derived from `url` at process time; may drift if `url` is edited elsewhere. |
| `ai_label`      | string \| null        | yes      | **no**          | Model-generated caption (Web-LLM), not a controlled classification. Treat as a hint, not ground truth. |
| `ai_label_dirty`| boolean               | yes      | -               | `true` if `ai_label` still shows raw-generation artifacts (e.g. a leading quote character) from before this was fixed. Never re-derived automatically - don't trust `ai_label` on a `dirty` record. |
| `ai_summary`    | string                | yes      | no              | Model-generated 2-3 sentence summary. |
| `metadata`      | object                | yes      | yes             | Free-form page metadata captured at process time (title/description/etc. as scraped). Shape not further specified - treat as opaque. |
| `album_id`      | string \| null        | yes      | see below       | `Cluster.album_id`'s `local_id`, inherited whenever this website is in a cluster; only this website's own stored value when it isn't. See "Album membership" below. |
| `cluster_id`    | string \| null        | yes      | derived         | The owning cluster's `local_id`. Derived from `Cluster.websites` (the reverse pointer); if the two disagree, `Cluster.websites` wins. `null` if never assigned. |
| `processed_at`  | string (ISO-8601)     | yes      | yes             | When this bookmark was first processed. |

Dropped from the export entirely (present in the app's own storage, never
in the file): `search_query` - an internal prompt used to seed a Google
search for similar links. It's an implementation detail, not user data.

## Cluster

A group of websites the app has decided are related. Roughly "a folder
Rocus made for you," not something the user necessarily created by hand.

| Field                 | Type            | Required | Authoritative? | Notes |
|-----------------------|-----------------|----------|-----------------|-------|
| `$type`               | string          | yes      | -               | Always `"io.rocus.cluster"`. |
| `local_id`            | string          | yes      | yes             | Locally-generated, install-scoped. No portable identity - see "Identity" above. |
| `ai_label`            | string \| null  | yes      | **no**          | Same caveat as `Website.ai_label` - this is the cluster's display name, generated the same way (or renamed by hand via the UI, in which case it's just as reliable as any user-entered text). |
| `ai_label_dirty`      | boolean         | yes      | -               | Same meaning as `Website.ai_label_dirty`. |
| `websites`            | string[]        | yes      | **yes**         | Website `local_id`s in this cluster. This is the authoritative membership list - `Website.cluster_id` is derived from it, not the other way around. |
| `album_id`            | string \| null  | yes      | **yes**         | The authoritative field for "which album is this cluster in". See `Album.cluster_ids`, which is derived from this field, not the reverse. |
| `similar_links`       | object          | yes      | no              | `{ websiteId -> [{ "ref": uri }] }` - cached "Discover Similar" search results that turned out to already be bookmarks somewhere in this same export. `ref` is a `Website.uri` - look it up in `websites` rather than treating it as a copy of that bookmark's data. |
| `suggestions`         | object          | yes      | no              | `{ websiteId -> [{ title, url, snippet, domain }] }` - cached search results that are genuinely external (no match found in this export's bookmarks). Not edges into this file's own graph - just cached suggestions, may be stale. |

## Edges

Cluster-to-cluster connections, promoted to a flat top-level list instead
of being duplicated inside each cluster (the app stores a manual
connection on both sides internally; this list has exactly one entry per
pair regardless).

```jsonc
{
  "$type": "io.rocus.link",
  "from": "cluster-local-id-1",
  "to": "cluster-local-id-2",
  "source": "manual"
}
```

- `from`/`to` are `Cluster.local_id`s (not `uri` - clusters don't have
  one; see "Identity" above). The relationship is symmetric; which side
  is `from` vs `to` carries no meaning.
- `source` is always `"manual"` today (a connection the user drew by
  hand). Computed similarity connections are not part of the export -
  they're re-derived from `embeddings` on every load, not stored.
- A manual connection referencing a cluster that no longer exists (the
  app doesn't currently clean up the other side when a cluster is
  deleted) is silently omitted rather than exported as a broken edge.

## Album

A user-created folder that clusters can be placed into.

| Field         | Type              | Required | Authoritative? | Notes |
|---------------|-------------------|----------|-----------------|-------|
| `$type`       | string            | yes      | -               | Always `"io.rocus.album"`. |
| `local_id`    | string            | yes      | yes             | Locally-generated, install-scoped. No portable identity - see "Identity" above. |
| `name`        | string            | yes      | yes             | |
| `icon`        | string            | yes      | yes             | An emoji (`"📁"`), or an `http(s):`/`data:` URI. Never a bare filename - Rocus's own 3 built-in icons are mapped to emoji at export time specifically so this file never references an asset path only Rocus can resolve. |
| `cluster_ids` | string[]          | yes      | derived         | Computed at export time from every `Cluster` whose `album_id` matches this album - **not** read from the app's own storage, which never actually keeps this in sync (see "Album membership" below). |
| `created_at`  | string (ISO-8601) | yes      | yes             | |
| `updated_at`  | string (ISO-8601) \| null | yes | yes         | `null` if the album has never been edited since creation. |

## Album membership

`Cluster.album_id` is the only field the app ever actually writes when a
user changes album membership - it's the single source of truth.
`Album.cluster_ids` is computed from it at export time (see above) rather
than trusted from storage, because the app's own `createAlbum`/
`updateAlbum` never populate it (it's permanently `[]` internally).

`Website.album_id` is a second, independent copy that can drift from its
cluster's: adding an existing website to a cluster (the "Add websites to
cluster" action) never updates that website's own `album_id`. This export
resolves the conflict rather than passing it through: **`Cluster.album_id`
wins whenever a website has a `cluster_id`**; only a truly uncategorized
website (no cluster at all) falls back to its own `album_id`. Re-importing
this file and exporting again heals any such drift, since the exported
value becomes the new stored value.

## Embeddings

```jsonc
"embeddings": {
  "<local_id>": {
    "model": "Xenova/all-MiniLM-L6-v2", // or "unknown" for pre-2.0.0 vectors
    "dim": 384,
    "normalized": true,   // null if unknown (legacy vectors)
    "created_at": "2026-06-27T09:35:25.905Z", // null if unknown (legacy vectors)
    "v": [ /* dim floats */ ]
  }
}
```

- Keyed by `Website.local_id` (not `uri` - this mirrors internal storage,
  which is keyed by the app's own id; embeddings have no meaning outside
  the install that generated them regardless of the key used).
- `model: "unknown"` means this vector predates provenance tracking (a
  v1.0.0 export, or a vector generated before this field existed). Never
  compare an `"unknown"` vector against a vector from a known model and
  assume the cosine similarity means anything - they may not even share
  a coordinate space.
- A reader that wants to embed a new document into the same space as a
  given vector should load exactly the model named in `model`, using
  `pooling: "mean"` and normalizing the output when `normalized: true`.

## Versioning & migration

- `"1.x.x"` files are the pre-provenance/pre-`ai_label`/pre-declared-fields
  format: bare `topic` instead of `ai_label`/`ai_label_dirty`, bare
  `[float]` embeddings, a top-level `theme` instead of `_app_settings.theme`,
  `search_query` present on websites, and no guarantee that every declared
  field here is actually present.
- `"2.x.x"` files have `ai_label`/embeddings-with-provenance/
  `_app_settings`/declared fields, but records still use a bare `id`
  (no `$type`/`local_id`/`uri`), `Cluster.similar_links` mixes in-library
  and external results together undifferentiated, manual connections are
  a per-cluster `manual_connections` array (duplicated on both sides)
  instead of a top-level `edges` list, and `Album.cluster_ids` is exported
  as-is from storage (always empty) instead of computed.
- Rocus migrates `1.x.x -> 2.0.0 -> 3.0.0` on import automatically
  (`migrateToCurrentVersion` in `src/composables/graphNode/rocusExportFormat.js`).
  A reader implementing its own import should do the same: treat a
  missing `_app_settings` as "this is a 1.x file" and a missing `local_id`
  as "this is a 2.x file", applying the equivalent mapping described above
  field-by-field.
