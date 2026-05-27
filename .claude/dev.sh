#!/bin/bash
# Wrapper that sets up Homebrew PATH before launching dev server.
# Used by the Claude Code Preview tool.
eval "$(/opt/homebrew/bin/brew shellenv)"
cd /Users/nealpyles/Projects/funnelcloser
exec /opt/homebrew/bin/pnpm dev
