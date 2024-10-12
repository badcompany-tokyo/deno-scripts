import { parseArgs } from 'jsr:@std/cli@1.0.6/parse-args';
import { join } from 'jsr:@std/path@1.0.6';
import { isBinaryFile } from 'npm:isbinaryfile@5.0.0';

const help = () =>
  console.log(`
Usage: yurusearch [word] [rootpath?]
Options:
  -h, --help  : Show help
`);

const flags = parseArgs(Deno.args, {
  boolean: ['help'],
  alias: {
    help: 'h',
  },
});

const exclude = [
  'node_modules',
  '.git',
  '.vscode',
  'testssl',
  '.cargo',
  '.cpan',
  '.local',
  '.cpanm',
  '.cpam',
  '.npm',
  '.pyenv',
  '.rbenv',
  '.rustup',
  '.volta',
  'vendor',
  'lib',
  '.lib',
  '.cache',
  '.config',
  '.deno',
];

const searchFiles = async (dir: string, word: string) => {
  const files = Deno.readDir(dir);
  for await (const file of files) {
    const fileName = file.name;
    const filePath = join(dir, fileName);
    if (exclude.includes(fileName)) continue;
    if (file.isDirectory) {
      await searchFiles(filePath, word);
      continue;
    }
    if (file.isFile && !(await isBinaryFile(filePath))) {
      try {
        const content = await Deno.readTextFile(filePath);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(word)) {
            console.log('-------------------------');
            console.log(`${filePath}:${index + 1}`);
            console.log(line);
          }
        });
      } catch (e) {
        console.error(e as Error);
      }
    }
  }
};

if (flags.help) {
  help();
  Deno.exit(0);
}

const word = (flags._[0] ?? '').toString();
const path = (flags._[1] ?? Deno.cwd()).toString();

if (!word) {
  console.log('A word arg is required.');
  help();
  Deno.exit(1);
}

console.log(`word:${word} root:${path}`);

if (!(await Deno.stat(path)).isDirectory) {
  console.log(`${path} is not a directory`);
  Deno.exit(1);
}

searchFiles(path, word);
