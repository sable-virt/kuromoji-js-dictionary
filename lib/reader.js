const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const decompress = require('decompress');
const decompressTarxz = require('decompress-tarxz');
const kuromoji = require('kuromoji');
const readline = require('readline');
const iconv = require('iconv-lite');
const { Observable } = require('rxjs/Observable');
require('rxjs/add/observable/fromPromise');
require('rxjs/add/observable/concat');
require('rxjs/add/operator/switchMap');
require('rxjs/add/operator/do');
require('rxjs/add/operator/combineAll');

const TEMP_DIR = path.join(__dirname, '../.tmp');

module.exports = function reader(op) {

  const dictionaries = [
    op.baseDictPath
  ];

  if (op.useNeologd) {
    const neologdDicts = glob.sync(path.join(__dirname, '../dict/neologd/**/*.tar.xz'));
    dictionaries.push(...neologdDicts);
  }
  if (op.customDictPath) {
    const customDicts = glob.sync(path.join(op.customDictPath, '**/*.tar.xz'));
    dictionaries.push(...customDicts);
  }

  return Observable.concat(...dictionaries.map(dict => decomp(dict)))
    .combineAll()
    .switchMap((files) => {
      const builder = kuromoji.dictionaryBuilder();
      const matrix$ = createReadlineObservable(`${TEMP_DIR}/matrix.def`, op.verbose).do((line) => {
        builder.putCostMatrixLine(line);
      });
      const char$ = createReadlineObservable(`${TEMP_DIR}/char.def`, op.verbose).do(line => {
        builder.putCharDefLine(line);
      });
      const unk$ = createReadlineObservable(`${TEMP_DIR}/unk.def`, op.verbose).do(line => {
        builder.putUnkDefLine(line);
      });
      const tokens = [];
      files.forEach(file => {
        if (path.extname(file.path) === '.csv') {
          tokens.push(createReadlineObservable(`${TEMP_DIR}/${file.path}`, op.verbose).do(line => {
            builder.addTokenInfoDictionary(line);
          }));
        }
      });

      const tokens$ =  Observable.concat(...tokens);

      return Observable.create((obs) => {
        Observable.concat(matrix$, char$, unk$, tokens$).subscribe(() => {
        }, (e) => {
          obs.error(e);
        }, () => {
          if (op.verbose) {
            console.log(`All dictionary files read complete`);
            console.log(`Creating dictionary data...`);
          }
          rimraf.sync(TEMP_DIR);
          const dict = builder.build();
          obs.next(dict);
          obs.complete();
        });
      });
  });
};

function decomp(tarxz) {
  return Observable.fromPromise(decompress(tarxz, TEMP_DIR, {
    filter: file => {
      return file.type === 'file';
    },
    map: file => {
      file.path = path.basename(file.path);
      return file;
    },
    plugins: [
      decompressTarxz()
    ]
  }));
}

function createReadlineObservable(filepath ,verbose) {
  return Observable.create((obs) => {

    const rl = readline.createInterface({
      input: fs.createReadStream(filepath).pipe(iconv.decodeStream('EUC-JP')),
      output: null,
      terminal: false
    });
    rl.on('error', (e) => {
      obs.error(e);
    });
    rl.on('line', (line) => {
      obs.next(line);
    });
    rl.on('close', () => {
      if (verbose) {
        console.log(`Read: ${filepath}`);
      }
      obs.complete();
    });
  });
}
