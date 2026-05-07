# AGENTS.md

## Project

agentkick is a node-cli project prepared with AgentKick.

## Purpose

This repository must be understandable by autonomous coding agents before they modify code.

## Architecture

- Stack: node-cli
- Package manager: npm
- Launch target: GitHub
- Agent metadata: .agentkick.json

## Commands

- Test: npm test
- Build: npm run build
- Doctor: agentkick doctor

## Agent Operating Rules

- Understand the current code path before editing.
- Prefer small, reviewable changes over broad rewrites.
- Do not introduce secrets into committed files.
- Preserve existing user changes and do not revert unrelated work.
- After code edits, run the narrowest useful verification command.
- If verification cannot run, state the exact blocker.
- Never modify generated, vendor, build, or lock files unless the task explicitly requires it.
- Do not change deployment, auth, billing, permissions, or database schema without calling out migration impact.
- Treat broad filesystem, shell, and MCP permissions as security risks.

## Forbidden By Default

- Committing secrets, tokens, private keys, or real credentials.
- Hiding failing tests or deleting tests to make checks pass.
- Rewriting large unrelated areas during a focused fix.
- Adding dependencies without explaining why the existing stack is insufficient.

## Review Expectations

- Findings and risks first.
- Use file paths and concrete behavior, not vague advice.
- Prefer reproducible commands over assumptions.

## Stack Notes

- Generic: document missing commands before assuming test, build, or deploy behavior.
