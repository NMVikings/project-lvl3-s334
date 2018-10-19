#! /usr/bin/env node

import program from 'commander';
import { version, description } from '../../package.json';
import loadPage from '..';

program
  .arguments('<url>')
  .description(description)
  .version(version)
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .action((url, { output }) => {
    loadPage(url, output)
      .then(({ htmlPath }) => {
        console.info(htmlPath);
      })
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
  });


program.parse(process.argv);
