import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';

const loadPage = (src, dir) => {
  const { host, pathname } = new URL(src);
  const fileName = `${host}${pathname}`.split(/[^\w]{1,}/gm).filter(p => !!p).join('-');
  const fullFileName = `${fileName}.html`;

  const filePath = path.resolve(__dirname, path.join(dir, fullFileName));
  return axios.get(src)
    .then(res => res.data)
    .then(data => fs.writeFile(filePath, data))
    .then(err => !err && filePath);
};

export default loadPage;
