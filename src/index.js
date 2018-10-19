import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import path from 'path';
import { promises as fs } from 'fs';

const log = debug('page-loader');

// const log = (namespace, message) => debug(`page-loader${namespace}`)(message);

const mapping = {
  img: 'src',
  script: 'src',
  link: 'href',
};

const createName = str => str.split(/[^\w]{1,}/gm).filter(p => !!p).join('-');

const processHtml = (html, { host, assetsFolderName, outputDir }) => {
  const $ = cheerio.load(html);
  const assets = {};

  Object.keys(mapping).forEach((key) => {
    $(key)
      .filter((index, element) => {
        const url = $(element).attr(mapping[key]);

        return url && new URL(url).host.includes(host);
      })
      .each((index, element) => {
        const el = $(element);
        const url = el.attr(mapping[key]);
        const { pathname: assetPathname } = new URL(url);

        const { name, ext, dir: assetPathDir } = path.parse(assetPathname);
        const filename = [createName(path.join(assetPathDir, name)), ext].join('');
        const pathToAsset = `./${path.join(assetsFolderName, filename)}`;
        el.attr(mapping[key], pathToAsset);

        assets[url] = path.resolve(outputDir, pathToAsset);
      });
  });

  return { processedHtml: $.html({ decodeEntities: false }), assets };
};

const loadPage = (src, dir) => {
  const { host, pathname } = new URL(src);
  const fileName = createName(`${host}${pathname}`);
  const assetsFolderName = `${fileName}_files`;
  const outputDir = path.resolve(__dirname, dir);
  const htmlPath = path.join(outputDir, `${fileName}.html`);
  const assetsPath = path.join(outputDir, assetsFolderName);
  const assetsInfo = {};

  return axios.get(src)
    .then((res) => {
      log(`Download html from ${src}`);

      return res.data;
    })
    .then((html) => {
      const { processedHtml, assets } = processHtml(html, { host, assetsFolderName, outputDir });

      Object.keys(assets).forEach((key) => {
        assetsInfo[key] = assets[key];
      });

      log(`Processed html and get ${Object.keys(assetsInfo).length} assets`);

      return processedHtml;
    })
    .then((data) => {
      log(`Save html to ${htmlPath}`);
      return fs.writeFile(htmlPath, data);
    })
    .then(() => {
      log(`Create dir ${assetsPath} for assets`);
      return fs.mkdir(assetsPath);
    })
    .then(() => Promise.all(Object.keys(assetsInfo).map(url => axios.get(url, { responseType: 'arraybuffer' }))))
    .then((responses) => {
      log(`Download ${responses.length} assets`);
      return Promise.all(
        responses.map(({ data, config }) => fs.writeFile(assetsInfo[config.url], data)),
      );
    })
    .then((files) => {
      log(`Save ${files.length} assets to ${assetsPath}`);
      return { htmlPath, assetsPath };
    });
};

export default loadPage;
