# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web platform for making international school teacher salaries and benefits transparent. Teachers submit anonymized salary data; users browse aggregated salary/package information by school. An admin panel handles submission moderation.

**Status:** Pre-implementation — `setup.md` contains the full project specification, `international_schools_list.txt` has 2,426 schools across 169 countries, and `design inspo.webp` provides UI reference.

## Core Functional Requirements (from setup.md)

### Three modules:
1. **Submit My Salary** — Anonymous, dated submissions with school (autocomplete from database), position level (5 tiers: classroom teacher → senior leader - head), gross pay, accommodation, and optional fields (net pay, pension, child places, medical insurance). Submissions go to review queue before publishing.
2. **View Salaries** — Browse schools by country or search. School pages show average gross pay headline (teachers only, excluding senior leadership) and individual submissions organized by position level.
3. **Admin Review** — Password-protected. Accept/deny submissions, archive/restore denied entries, handle new school submissions (highlight in red, option to match to existing school).

### Key technical requirements:
- **Currency system:** Four options per school — local currency (mapped per country) + USD/GBP/EUR. Convert at submission time. Cache daily exchange rates.
- **School search:** Normalize queries — lowercase, strip punctuation, collapse whitespace, expand tokens (e.g., "int" → "international"). Fallback for unlisted schools with confirmation checkbox.
- **Currency preference:** Ask once on first visit, persist, changeable via top-right menu.
- **Database:** Supabase for submission data and school list (country, currency, aliases).

## Design Direction

Clean layout with bright colors. Reference: `design inspo.webp` (modern education platform aesthetic — card-based, blue/yellow accent palette, generous whitespace).
