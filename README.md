# Vue Tong-its

A modern browser-based Tong-its card game built with Vue 3, Vite, and Tailwind CSS.

## Overview

This project implements the classic Filipino card game Tong-its using Vue 3 `<script setup>` single-file components and a responsive Tailwind CSS interface. It supports game setup, card drawing, meld creation, meld extension, discard logic, and public meld selection.

## Features

- Vue 3 composition API with single-file components
- Responsive layout optimized for landscape screens
- Touch-friendly card interactions and mobile support
- Turn-based draw, meld, add-to-meld, and discard gameplay
- Public meld selection between players
- Custom hand sorting and card selection

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- `pnpm` installed globally

### Install dependencies

```bash
pnpm install
```

### Run the development server

```bash
pnpm dev
```

Open the URL shown in the terminal to play locally.

### Build for production

```bash
pnpm build
```

### Preview production build

```bash
pnpm preview
```

## Project Structure

- `src/App.vue` — main game component and UI logic
- `src/assets/styles/main.css` — Tailwind CSS entry point
- `index.html` — Vite application entry
- `vite.config.js` — Vite configuration

## Technologies

- Vue 3
- Vite
- Tailwind CSS
- JavaScript

## Notes

This repository is intended for showcasing a playable Tong-its game UI and game flow in a modern frontend environment.
