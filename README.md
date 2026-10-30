# Harmonia

An offline-first personal lab for seeing harmonic structure through distinct,
complementary representations. The first study is an interactive Circle of
Thirds, based on a supplied reference diagram. It opens in C major and moves
through paired relative-major/minor readings of each shared pitch collection.

The application has a small pure musical core in `src/domain/`. Preact and SVG
form only its first visual projection in `src/ui/`.

`src/domain/harmonicField.ts` names key choices, pitch collections, triads,
and their functional reading. Natural minor preserves its relative-major
geometry; harmonic minor explicitly raises the leading tone, creating `V` and
`vii°` dominant tension. `src/projections/` holds the source-specific drawing
geometry. `notes/circle-of-thirds.md` records what the reference visibly
establishes and the questions Harmonia deliberately does not answer yet.

## Commands

```sh
bun install
bun run check
bun run build
```

The Cloudflare build command is `bun run build`. Production deployment should
follow the repository's branch policy.

Local development does not retain a service worker or application caches. This keeps refreshes honest while iterating and prevents an installed production-style cache from hiding a newly built interface. The service worker also uses network-first behavior on local hosts while an older registration is being retired.

## Offline contract

The first online visit downloads the complete application. Later launches read the installed application from cache immediately and work in airplane mode. Registration checks for a changed service worker when connectivity exists. A build fingerprint changes the worker whenever an application file changes, and a new version activates only after its complete shell has downloaded and existing application windows have closed.

Application data belongs in browser storage and must remain usable without a network connection. Schema changes must migrate existing data without erasing it.
