# toast-finance-bot

## Overview

Toast Finance Bot is an n8n + Qdrant automation scaffold intended to orchestrate financial workflows such as data ingestion, document analysis, and conversational reporting. The project is configured to use Google OAuth (not service accounts) for connecting to Google Workspace resources, OpenAI for language models and embeddings, and Telegram for chat operations. This repository currently ships with an infrastructure scaffold so that you can quickly bootstrap your own workflows and integrations.

## Project Structure

- `docker-compose.yml`: Launches n8n and Qdrant containers with sane defaults.
- `.env.example`: Reference environment variables required by the runtime.
- `n8n/`: Placeholder directory where future n8n workflow export JSON files can live.
- `prompts/`: System prompt templates for planner and narrator agents.
- `functions/`: Custom JavaScript utilities to be imported into n8n workflows.
- `docs/`: Documentation resources including checklists and FAQs.
- `scripts/`: Space for future operational scripts (e.g., seeding, migrations, tooling).

## Prerequisites

- Docker and Docker Compose installed locally.
- An OpenAI API key with access to the `gpt-4o-mini` chat model and the `text-embedding-3-large` embedding model.
- Google Cloud project with OAuth credentials suitable for installed or web applications (no service accounts). Note the client ID and secret for later configuration inside n8n.
- Telegram bot token (via BotFather) if you plan to wire Telegram messaging into your flows.

## Setup

1. **Clone this repository**
   ```bash
   git clone <your-fork-url>
   cd toast-finance-bot
   ```
2. **Create an `.env` file** based on the example:
   ```bash
   cp .env.example .env
   ```
   Populate each variable, paying special attention to secrets such as `N8N_ENCRYPTION_KEY`, `OPENAI_API_KEY`, and Google-specific IDs. Keep the Qdrant URL pointed at `http://qdrant:6333` unless you have a custom deployment.
3. **Prepare Google OAuth credentials**
   - Create OAuth client credentials in Google Cloud Console.
   - Download the client JSON and configure the client ID/secret within n8n after the first launch.
   - Ensure the authorized redirect URIs include your n8n host (e.g., `http://localhost:5678/rest/oauth2-credential/callback`).
4. **Configure Telegram (optional)**
   - Talk to BotFather, create a bot, and copy the API token.
   - Add the token to your `.env` file.

## Running the Stack

1. **Start services**
   ```bash
   docker compose up -d
   ```
2. **Access n8n UI** at [http://localhost:5678](http://localhost:5678). The first load will prompt you to configure credentials and encryption keys.
3. **Verify Qdrant** by visiting [http://localhost:6333](http://localhost:6333) or using `curl`:
   ```bash
   curl http://localhost:6333/collections
   ```
4. **Stop services** when finished:
   ```bash
   docker compose down
   ```

## First-Run Checklist

Use this checklist to ensure your environment is ready for workflow development:

- [ ] Duplicate `.env.example` to `.env` and fill out all required values.
- [ ] Provide a strong `N8N_ENCRYPTION_KEY` before launching n8n.
- [ ] Start the stack with `docker compose up -d`.
- [ ] Complete the n8n initial setup wizard, including admin credentials.
- [ ] Configure Google OAuth credentials within n8n (OAuth2 credentials with client ID/secret and proper redirect URI).
- [ ] Add OpenAI API credentials in n8n's credential manager.
- [ ] Connect Telegram bot credentials if applicable.
- [ ] Create or import your initial n8n workflows into the `n8n/` directory for version control.
- [ ] Validate vector storage by creating a sample Qdrant collection and inserting an embedding via n8n.
- [ ] Document any environment-specific notes inside `docs/` for future operators.

## Next Steps

- Build workflow blueprints in `n8n/` and export them as JSON for version control.
- Implement reusable helper functions in `functions/` to keep n8n workflows lean.
- Draft prompt engineering assets inside `prompts/` to support your planner/narrator agents.
- Expand the documentation in `docs/` with operational guides, runbooks, and troubleshooting notes.

