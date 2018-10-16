import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import path from 'path';
import { promisify } from 'util';
import tmp from 'tmp';
import { promises as fsPromises } from 'fs';

import loadPage from '../src';

axios.defaults.adapter = httpAdapter;

test('Download https://hexlet.io/courses', async () => {
  const testHtml = await fsPromises.readFile(path.resolve(__dirname, '__fixtures__/test1.html'), 'utf-8');

  nock('https://hexlet.io')
    .get('/courses')
    .reply(200, testHtml);

  const dirPath = await promisify(tmp.dir)();
  const filePath = await loadPage('https://hexlet.io/courses', dirPath);
  const fileData = await fsPromises.readFile(filePath, 'utf8');
  expect(fileData).toBe(testHtml);
});
