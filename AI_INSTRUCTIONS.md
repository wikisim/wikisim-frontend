


# Repository Setup and Development Instructions

## Important Notes for AI

- **Do NOT add `allowBuilds` or `esbuild: true` to `pnpm-workspace.yaml`.** These are not used or required in this repository.
- Follow the steps below to set up, run, and test the project. No extra configuration is needed unless specified here.

## Setup

1. Clone the repository:
	```sh
	git clone --recursive git@github.com:wikisim/wikisim-frontend.git
	```
2. Install dependencies:
	```sh
	pnpm install
	```

## Running the Development Server

Start the development environment:
```sh
pnpm run dev
```

## Running Checks and Tests

To run all checks (type checks, lint, etc.):
```sh
pnpm run check
```

To run tests:
```sh
pnpm test
```

---

If you are an AI assistant, please strictly follow these instructions and do not introduce configuration fields not documented here.
