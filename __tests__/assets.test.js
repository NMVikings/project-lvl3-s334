import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';
import path from 'path';
import { promisify } from 'util';
import tmp from 'tmp';
import { promises as fsPromises } from 'fs';

import loadPage from '../src';

axios.defaults.adapter = httpAdapter;

const getPathToFixture = fileName => path.resolve(__dirname, `__fixtures__/assets/${fileName}`);

describe('my beverage', async () => {
  beforeAll(async () => {
    const testHtml = await fsPromises.readFile(getPathToFixture('data.html'), 'utf-8');
    // const assets = ['css.css', 'js', 'icon.png', 'image.png'];

    nock('https://assets.io')
      .persist(true)
      .get('/courses')
      .reply(200, testHtml)
      .get('/css.css')
      .replyWithFile(200, getPathToFixture('css.css'))
      .get('/js.js')
      .replyWithFile(200, getPathToFixture('js'))
      .get('/icon.png')
      .replyWithFile(200, getPathToFixture('icon.png'))
      .get('/image.png')
      .replyWithFile(200, getPathToFixture('image.png'));
  });

  // test('test simple html', async () => {
  //   const dirPath = await promisify(tmp.dir)();
  //   const { htmlPath, assetsPath } = await loadPage('https://assets.io/courses', dirPath);
  //   const expectedHtml = await fsPromises.readFile(getPathToFixture('expected.html'), 'utf-8');

  //   const fileData = await fsPromises.readFile(htmlPath, 'utf8');
  //   expect(fileData).toBe(expectedHtml);
  // });

  test('Css', async () => {
    const dirPath = await promisify(tmp.dir)();
    const { assetsPath } = await loadPage('https://assets.io/courses', dirPath);
    const expectedCss = await fsPromises.readFile(getPathToFixture('css.css'), 'utf-8');

    const fileData = await fsPromises.readFile(`${assetsPath}/css.css`, 'utf8');
    expect(expectedCss).toBe(fileData);
  });

  test('Js', async () => {
    const dirPath = await promisify(tmp.dir)();
    const { assetsPath } = await loadPage('https://assets.io/courses', dirPath);
    const expectedJs = await fsPromises.readFile(getPathToFixture('js'), 'utf-8');

    const fileData = await fsPromises.readFile(`${assetsPath}/js.js`, 'utf8');
    expect(fileData).toBe(expectedJs);
  });

  test('image', async () => {
    const dirPath = await promisify(tmp.dir)();
    const { assetsPath } = await loadPage('https://assets.io/courses', dirPath);
    const expectedHtml = await fsPromises.readFile(getPathToFixture('image.png'), 'utf-8');

    const fileData = await fsPromises.readFile(`${assetsPath}/image.png`, 'utf8');
    expect(fileData).toBe(expectedHtml);
  });


  test('icon', async () => {
    const dirPath = await promisify(tmp.dir)();
    const { assetsPath } = await loadPage('https://assets.io/courses', dirPath);
    const expectedHtml = await fsPromises.readFile(getPathToFixture('icon.png'), 'utf-8');

    const fileData = await fsPromises.readFile(`${assetsPath}/icon.png`, 'utf8');
    expect(fileData).toBe(expectedHtml);
  });
});
