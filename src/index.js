import axios from 'axios';
import cheerio from 'cheerio';
// import sanitizeHtml from 'sanitize-html';
import path from 'path';
import { promises as fs, createWriteStream } from 'fs';

const mapping = {
  img: 'src',
  script: 'src',
  link: 'href',
};

const saveFile = (filePath, data) => fs.writeFile(filePath, data);
const saveImage = (filePath, data) => data.pipe(createWriteStream(filePath));

const filesInfo = {
  '.css': {
    write: saveFile,
    responseType: 'file',
  },
  '.png': {
    write: saveImage,
    responseType: 'stream',
  },
  '.jpg': {
    write: saveImage,
    responseType: 'stream',
  },
  '.svg': {
    write: saveImage,
    responseType: 'stream',
  },
  '.gif': {
    write: saveImage,
    responseType: 'stream',
  },
  '.rss': {
    write: saveFile,
    responseType: 'file',
  },
  '.js': {
    write: saveFile,
    responseType: 'file',
  },
};

const loadPage = (src, dir) => {
  const { host, pathname } = new URL(src);
  const fileName = `${host}${pathname}`.split(/[^\w]{1,}/gm).filter(p => !!p).join('-');
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
            const filename = path.join(assetPathDir, name).split(/[^\w]{1,}/gm).filter(p => !!p).join('-') + ext;
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
      const { ext } = path.parse(assetPath);
      const { write, responseType } = filesInfo[ext];

      return axios({ method: 'get', url, responseType })
        .then(response => write(assetPath, response.data));
    })))
    .then(() => ({ htmlPath, assetsPath }));
};

export default loadPage;
