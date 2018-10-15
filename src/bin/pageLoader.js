import program from 'commander';
import { version, description } from '../../package.json';
import loadPage from '..';

program
  .arguments('<url>')
  .description(description)
  .version(version)
  .option('-o, --output [type]', 'output dir', '.')
  .action((url, { output }) => {
    loadPage(url, output);
  });


program.parse(process.argv);
