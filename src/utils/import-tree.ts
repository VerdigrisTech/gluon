import { extname, join } from "path";
import { readdir, stat } from "fs-extra";
import klaw from "klaw";
import { obj } from "through2";

const filterByJsFiles = obj(function (item, enc, next) {
  const extension = extname(item.path);
  if (extension === ".js" || extension === ".ts") {
    this.push(item);
  }
  next();
});

export default function (path: string) {
  return new Promise<Array<{}>>(async function (resolve, reject) {
    const items = [];
    const onError = (err: Error) => reject(err);
    const onSuccess = () => {
      resolve(Promise.all(items.map(async item => {
        const resolvedModule: { path: string, module: any } = {
          path: item.path,
          module: await import(item.path)
        };
        return resolvedModule;
      })));
    };

    klaw(path)
      .pipe(filterByJsFiles)
      .on('data', item => items.push(item))
      .on('error', onError)
      .on('end', onSuccess);
  });
};
