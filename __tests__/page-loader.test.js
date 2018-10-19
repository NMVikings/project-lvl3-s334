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

describe('Errors', () => {
  test('HTTP error', async () => {
    nock('https://assets.io')
      .get('/courses')
      .reply(405, null);

    const dirPath = await promisify(tmp.dir)();
    await expect(loadPage('https://assets.io/courses', dirPath)).rejects.toThrowErrorMatchingSnapshot();
  });

  test('EACCES', async () => {
    const testHtml = await fsPromises.readFile(getPathToFixture('mock-assets.html'), 'utf-8');
    nock('https://assets.io')
      .get('/courses')
      .reply(200, testHtml);

    const dirPath = path.resolve('noacces');
    await fsPromises.mkdir(dirPath);
    await fsPromises.chmod(dirPath, 770);
    await expect(loadPage('https://assets.io/courses', dirPath)).rejects.toThrowErrorMatchingSnapshot();
    await fsPromises.rmdir(dirPath);
  });

  test('ECONNREFUSED', async () => {
    nock.enableNetConnect();

    const dirPath = await promisify(tmp.dir)();
    await expect(loadPage('.', dirPath)).rejects.toThrowErrorMatchingSnapshot();
  });

  test('EEXIST', async () => {
    const testHtml = await fsPromises.readFile(getPathToFixture('mock-assets.html'), 'utf-8');
    nock('https://assets.io')
      .get('/courses')
      .reply(200, testHtml);


    const dirPath = path.resolve('exists');
    const assetsPath = path.join(dirPath, 'assets-io-courses_files');
    const htmlPath = path.join(dirPath, 'assets-io-courses.html');
    await fsPromises.mkdir(dirPath);
    await fsPromises.mkdir(assetsPath);
    await expect(loadPage('https://assets.io/courses', dirPath)).rejects.toThrowErrorMatchingSnapshot();
    await fsPromises.unlink(htmlPath);
    await fsPromises.rmdir(assetsPath);
    await fsPromises.rmdir(dirPath);
  });

  test('ENOENT', async () => {
    const testHtml = await fsPromises.readFile(getPathToFixture('mock-assets.html'), 'utf-8');
    nock('https://assets.io')
      .get('/courses')
      .reply(200, testHtml);

    const dirPath = 'bla-bla';
    await expect(loadPage('https://assets.io/courses', dirPath)).rejects.toThrowErrorMatchingSnapshot();
  });

  test('ENOTDIR', async () => {
    const testHtml = await fsPromises.readFile(getPathToFixture('mock-assets.html'), 'utf-8');
    nock('https://assets.io')
      .get('/courses')
      .reply(200, testHtml);

    const filePath = path.resolve('noacces');
    await fsPromises.writeFile(filePath);
    await expect(loadPage('https://assets.io/courses', filePath)).rejects.toThrowErrorMatchingSnapshot();
    await fsPromises.unlink(filePath);
  });

  test('ENOTFOUND', async () => {
    nock.enableNetConnect();

    await expect(loadPage('https://invalid-url.com', path.resolve(''))).rejects.toThrowErrorMatchingSnapshot();
  });
});
