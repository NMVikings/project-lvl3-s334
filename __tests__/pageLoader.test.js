import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import os from 'os';
import path from 'path';
import { promises as fsPromises } from 'fs';

import loadPage from '../src';

const host = 'https://hexlet.io';

axios.defaults.host = host;
axios.defaults.adapter = httpAdapter;

test('Download https://hexlet.io/courses', async () => {
  expect.assertions(1);
  const testHtml = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/test1.html'), 'utf-8');

  nock(host)
    .get('/courses')
    .reply(200, testHtml);


  return fsPromises.mkdtemp(os.tmpDir())
    .then(dirPath => loadPage('https://hexlet.io/courses', dirPath))
    .then(filePath => fsPromises.readFile(filePath, 'utf8')).then((data) => {
      expect(data).toBe(testHtml);
    });
});
