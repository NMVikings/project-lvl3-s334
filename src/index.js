import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import path from 'path';
import { promises as fs } from 'fs';

// const log = debug('page-loader');

const mapping = {
  img: 'src',
  script: 'src',
  link: 'href',
};

const createName = str => str.split(/[^\w]{1,}/gm).filter(p => !!p).join('-');

const loadPage = (src, dir) => {
  const { host, pathname } = new URL(src);
  const fileName = createName(`${host}${pathname}`);
  const fullFileName = `${fileName}.html`;
  const assetsFolderName = `${fileName}_files`;
  const outputDir = path.resolve(__dirname, dir);
  const htmlPath = path.join(outputDir, fullFileName);
  const assetsPath = path.join(outputDir, assetsFolderName);
  const assetsInfo = {};

  return axios.get(src)
    .then(res => res.data)
    .then((html) => {
      const $ = cheerio.load(html);

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

            assetsInfo[url] = path.resolve(outputDir, pathToAsset);
          });
      });

      return $.html({ decodeEntities: false });
    })
    .then(data => fs.writeFile(htmlPath, data))
    .then(() => fs.mkdir(assetsPath))
    .then(() => Promise.all(Object.keys(assetsInfo).map((url) => {
      const assetPath = assetsInfo[url];

      return axios.get(url, { responseType: 'arraybuffer' })
        .then(response => fs.writeFile(assetPath, response.data));
    })))
    .then(() => ({ htmlPath, assetsPath }));
};

export default loadPage;
