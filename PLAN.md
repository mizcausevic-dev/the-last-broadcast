# Plan: The Last Broadcast

Status: implemented and tested locally. Not deployed.

Started 2026-10-20T19:12:51Z. Latest full browser run 2026-10-20T20:23:20Z.

## Product

A single-player, client-only mystery. The player is the substitute engineer at fictional station WNBR on Monday 12 October 2026, 6:12 a.m. No accounts, no runtime AI, no network media, no free-text grading, no multiplayer.

The 15 to 25 minute first play is a design target. It was not measured.

## Stack

Vite, TypeScript, and vanilla DOM. Vitest for the engine. Playwright against system Chrome for the browser. No production dependencies. Preview and dev bind to 127.0.0.1.

## Scope that shipped

Four locations, three interviewees, twelve clues, five deductions, notebook, interviews, accusation, local saves, hints, validation, and one authored ending. Optional room tone is synthesized in the page.

## Narrative

The spoiler bible is `spoiler/MYSTERY-BIBLE.md`. It is not imported by the app. The disappearance is not a homicide. Decisive facts are inspectable before any accusation.

## Out of scope

Public deploy, accounts, server authority, analytics, exhaustive state search, and any claim of production readiness.
