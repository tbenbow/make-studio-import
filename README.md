# Make Studio Importer

AI-powered theme conversion tool for Make Studio. Converts React/Next.js themes into Make Studio blocks and partials.

## Overview

This tool helps convert commercial UI themes (built with Next.js, React, Tailwind) into Make Studio format. It's designed to be used with AI assistants (Claude Code, Cursor, etc.) that handle the conversion logic.

### Workflow

```
1. Drop theme source files → themes/<name>/source/
2. AI converts to Make Studio format → themes/<name>/converted/
3. Validate the conversion → npm run validate
4. Import to staging site → npm run import
5. Review in Make Studio UI
6. Iterate until correct
7. Theme becomes reference for future conversions
```

## Setup

```bash
# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env
# Edit .env with your MongoDB connection string
```

## Usage

### Validate Converted Files

```bash
npm run validate -- --theme=<theme-name>
```

Returns JSON with validation results:
```json
{
  "valid": true,
  "components": { "blocks": 25, "partials": 3 },
  "errors": [],
  "warnings": []
}
```

### Import to Make Studio

```bash
npm run import -- --theme=<theme-name> --site=<siteId>
```

Returns JSON with import results:
```json
{
  "success": true,
  "created": { "blocks": ["Hero", "Features"], "partials": ["Button"] },
  "updated": { "blocks": [], "partials": [] },
  "errors": []
}
```

### Check Theme Status

```bash
npm run status -- --theme=<theme-name>
```

## Adding a New Theme

1. Create theme folder structure:
   ```bash
   cp -r themes/.template themes/<new-theme-name>
   ```

2. Add source files to `themes/<new-theme-name>/source/`

3. Create a staging site in Make Studio and note the site ID

4. Have AI convert the components (see Conversion Guide)

5. Validate and import:
   ```bash
   npm run validate -- --theme=<name>
   npm run import -- --theme=<name> --site=<siteId>
   ```

## Conversion Guide

See `guides/BASE_GUIDE.md` for universal conversion rules.

Each theme should also have its own `THEME_GUIDE.md` documenting:
- Theme-specific color mappings
- Icon library mappings
- Component patterns discovered
- Issues encountered and solutions

## File Structure

```
make-studio-importer/
├── guides/
│   └── BASE_GUIDE.md          # Universal conversion rules
│
├── themes/
│   ├── .template/             # Copy for new themes
│   ├── oatmeal/               # Example completed theme
│   │   ├── THEME_GUIDE.md     # Theme-specific notes
│   │   ├── source/            # Original files
│   │   ├── converted/
│   │   │   ├── blocks/
│   │   │   └── partials/
│   │   └── manifest.json      # Import tracking
│   └── <your-theme>/
│
└── src/
    ├── index.ts               # CLI entry point
    ├── validate.ts            # Validation logic
    └── import.ts              # Import logic
```

## For AI Assistants

This tool is designed for AI-assisted conversion. Key points:

1. **Read `guides/BASE_GUIDE.md` first** - Contains all conversion rules
2. **Check past themes** - Look at `themes/*/THEME_GUIDE.md` for similar patterns
3. **Document as you go** - Update the theme's `THEME_GUIDE.md` with learnings
4. **Output is JSON** - All CLI commands return structured JSON
5. **Iterate** - Run validate/import, check results, fix issues, repeat
