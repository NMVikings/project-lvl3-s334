import program from 'commander';
import { version, description } from '../../package.json';
import loadPage from '..';

program
  .arguments('<url>')
  .description(description)
  .version(version)
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .action((url, { output }) => {
    loadPage(url, output).then((filePath) => {
      console.log(filePath);
    });
  });


program.parse(process.argv);
