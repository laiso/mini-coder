# Mini Coder CLI

A CLI tool powered by Claude 3 that helps with coding tasks.

## Prerequisites

- Node.js 18 or higher
- An Anthropic API key

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```
3. Set up your Anthropic API key:
```bash
export ANTHROPIC_API_KEY=your-api-key
```

## Usage

Run the CLI with:

```bash
npm run build
node dist/cli.js [options]
```

### Options

- `-p, --path <directory>`: Project root directory path (default: current working directory)
- `-i, --instruction <file>`: Path to instruction file
- `-e, --entry <file>`: Entry point file path

### Example

1. Create an instruction file `task.txt`:
```txt
Please refactor the User class in src/models/user.ts to use TypeScript interfaces
```

2. Run the CLI:
```bash
npm run build
node dist/cli.js -p ./my-project -i task.txt -e src/models/user.ts
# or
./bin/mini-coder
```

### Options

- `-p, --path <directory>` - Specify project root directory path (default: current working directory)
- `-i, --instruction <file>` - Path to instruction file (required)
- `-e, --entry <file>` - Entry point file path (optional)

### Examples

```sh
# Run with instruction file using current directory
mini-coder -i instruction.txt

# Run with custom project directory
mini-coder -p /path/to/project -i instruction.txt

# Run with entry point file
mini-coder -p /path/to/project -i instruction.txt -e src/index.ts
```

### Validation

The CLI performs these validations:

- Verifies the project directory exists and is a valid directory
- If provided, verifies the entry point file exists
- Checks that the instruction file can be read

### Configuration

The tool automatically configures an MCP filesystem server pointing to the specified project directory for file access.

If any validation fails, the program will exit with an error message explaining the issue.

## Testing

### Step 1: Create an Issue
1. Open the GitHub issue create page: [New Issue](https://github.com/laiso/mini-coder/issues/new)
2. Add the following details in the issue body to report the design:

### Step 2: Implement the Design
1. Once the issue is created, start working on the design implementation.
2. Reference the issue number in the commit messages to link the implementation with the issue.

Make sure to review and merge the design implementation into the main branch and close the issue once the implementation is merged.