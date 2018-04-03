const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const kuromoji = require('kuromoji');
const linebyline = require('linebyline');
const iconv = require('iconv-lite');
const tar = require('tar');
const { Observable } = require('rxjs/Observable');
require('rxjs/add/observable/fromPromise');
require('rxjs/add/observable/forkJoin');
require('rxjs/add/observable/concat');
require('rxjs/add/operator/switchMap');
require('rxjs/add/operator/do');
require('rxjs/add/operator/combineAll');

const TEMP_DIR = path.join(__dirname, '../.tmp');

module.exports = function reader(op) {
  const dictionaries = [
    op.baseDictPath
  ];
  if (!op.notIncludeNeologd) {
    const neologdDicts = glob.sync(path.join(__dirname, '../dict/neologd/**/*.tar.gz'));
    dictionaries.push(...neologdDicts);
  }
  if (op.customDictPath) {
    const customDicts = glob.sync(path.join(op.customDictPath, '**/*.tar.gz'));
    dictionaries.push(...customDicts);
  }

  fs.mkdirsSync(TEMP_DIR);
  console.log('unpack tar files...');

  return Observable.forkJoin(...dictionaries.map(dict => untar(dict, op.verbose)))
    .map(res => glob.sync(`${TEMP_DIR}/**/*.csv`))
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
        if (path.extname(file) === '.csv') {
          tokens.push(createReadlineObservable(file, op.verbose).do(line => {
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
          console.log(`All dictionary files read complete`);
          console.log(`Creating dictionary data...`);

          rimraf.sync(TEMP_DIR);
          const dict = builder.build();
          obs.next(dict);
          obs.complete();
        });
      });
  });
};

function untar(tarfile, verbose) {
  return Observable.fromPromise(tar.x({
    file: tarfile,
    cwd: TEMP_DIR,
    strip: true
  })).map(() => {
    if (verbose) console.log(`unpack ${tarfile}`);
    return tarfile;
  });
}

function createReadlineObservable(filepath ,verbose) {
  return Observable.create((obs) => {
    const rl = linebyline(filepath, {
      retainBuffer: true
    });
    rl.on('error', (e) => {
      obs.error(e);
    });
    rl.on('line', (buf) => {
      obs.next(iconv.decode(buf, 'euc-jp'));
    });
    rl.on('close', () => {
      if (verbose) {
        console.log(`Read: ${filepath}`);
      }
      obs.complete();
    });
  });
}
