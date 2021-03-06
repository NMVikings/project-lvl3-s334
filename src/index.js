import url from 'url';
import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import path from 'path';
import Listr from 'listr';
import { promises as fs } from 'fs';

const log = debug('page-loader');

const mapping = {
  img: 'src',
  script: 'src',
  link: 'href',
};

const createName = str => str.split(/[^\w]{1,}/gm).filter(p => !!p).join('-');

const getErrorMessage = (err) => {
  const fsErrors = {
    EACCES: e => `An attempt was made to access a file ${e.path} in a way forbidden by its file access permissions.`,
    ECONNREFUSED: e => `No connection could be made because the ${e.config.url} actively refused it.`,
    EEXIST: e => `An existing file ${e.path} was the target of an operation that required that the target not exist.`,
    ENOENT: e => `No entity (file or directory) could be found by the given path ${e.path}`,
    ENOTDIR: e => `A component of the given pathname ${e.path} existed, but was not a directory as expected.`,
    ENOTFOUND: e => `Invalid url: ${e.config.url}`,
  };

  if (!fsErrors[err.code]) {
    return err;
  }

  return fsErrors[err.code](err);
};

const processHtml = (html, { host, assetsFolderName, outputDir }) => {
  const $ = cheerio.load(html);
  const assets = {};

  Object.keys(mapping).forEach((key) => {
    $(key)
      .filter((index, element) => {
        const link = $(element).attr(mapping[key]);

        if (!link) {
          return false;
        }

        const { host: linkHost } = url.parse(link);

        return linkHost && linkHost.includes(host);
      })
      .each((index, element) => {
        const el = $(element);
        const link = el.attr(mapping[key]);
        const { pathname: assetPathname } = url.parse(link);

        const { name, ext, dir: assetPathDir } = path.parse(assetPathname);
        const filename = [createName(path.join(assetPathDir, name)), ext].join('');
        const pathToAsset = `./${path.join(assetsFolderName, filename)}`;
        el.attr(mapping[key], pathToAsset);

        assets[link] = path.resolve(outputDir, pathToAsset);
      });
  });

  return { processedHtml: $.html({ decodeEntities: false }), assets };
};

const downloadAssets = assetsInfo => new Listr(
  Object.keys(assetsInfo).map(
    src => ({
      title: src,
      task: () => axios.get(src, { responseType: 'arraybuffer' }).then(({ data }) => fs.writeFile(assetsInfo[src], data)),
    }),
  ),
  { concurrent: true },
).run();


const loadPage = (src, dir) => {
  const { host, pathname } = url.parse(src);
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
    .then(() => downloadAssets(assetsInfo))
    .then(() => {
      log(`Save ${Object.keys(assetsInfo).length} assets to ${assetsPath}`);
      return { htmlPath, assetsPath };
    })
    .catch((e) => {
      const msg = e.response
        ? `Failed to load page: ${src}. Server respond with status: ${e.response.status}`
        : getErrorMessage(e);

      throw new Error(msg);
    });
};

export default loadPage;
