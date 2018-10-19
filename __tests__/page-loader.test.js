import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import path from 'path';
import { promisify } from 'util';
import tmp from 'tmp';
import { promises as fsPromises } from 'fs';

import loadPage from '../src';

axios.defaults.adapter = httpAdapter;

const getPathToFixture = fileName => path.resolve(__dirname, `__fixtures__/${fileName}`);

test('Html https://hexlet.io/courses', async () => {
  const testHtml = await fsPromises.readFile(getPathToFixture('/mock-hexlet.html'), 'utf-8');
  const expectedHtml = await fsPromises.readFile(getPathToFixture('expected-hexlet.html'), 'utf-8');

  nock('https://hexlet.io')
    .get('/courses')
    .reply(200, testHtml);

  const dirPath = await promisify(tmp.dir)();
  const { htmlPath } = await loadPage('https://hexlet.io/courses', dirPath);


  const fileData = await fsPromises.readFile(htmlPath, 'utf8');
  expect(fileData).toBe(expectedHtml);
});

test('Assets', async () => {
  const testHtml = await fsPromises.readFile(getPathToFixture('mock-assets.html'), 'utf-8');

  nock('https://assets.io')
    .get('/courses')
    .reply(200, testHtml)
    .get('/image.png')
    .replyWithFile(200, getPathToFixture('image.png'));

  const dirPath = await promisify(tmp.dir)();
  const { assetsPath } = await loadPage('https://assets.io/courses', dirPath);

  const expected = await fsPromises.readFile(getPathToFixture('image.png'), 'utf-8');
  const received = await fsPromises.readFile(`${assetsPath}/image.png`, 'utf8');

  expect(received).toBe(expected);
});
