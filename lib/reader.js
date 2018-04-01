const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const decompress = require('decompress');
const decompressTarxz = require('decompress-tarxz');
const kuromoji = require('kuromoji');
const readline = require('readline');
const { Observable } = require('rxjs/Observable');
require('rxjs/add/observable/fromPromise');
require('rxjs/add/observable/concat');
require('rxjs/add/operator/switchMap');
require('rxjs/add/operator/do');

const TEMP_DIR = path.join(__dirname, '../.tmp');

module.exports = function reader(op) {
  return Observable.fromPromise(decompress(op.baseDictPath, TEMP_DIR, {
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
  })).switchMap((files) => {
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
    if (op.useNeologd) {
      glob.sync('dict/neologd/*.csv').forEach(filepath => {
        tokens.push(createReadlineObservable(filepath, op.verbose).do(line => {
          builder.addTokenInfoDictionary(line);
        }));
      });
    }
    if (op.customDictPath) {
      glob.sync(path.join(process.pwd(), op.customDictPath, `/*.csv`)).forEach(filepath => {
        tokens.push(createReadlineObservable(filepath, op.verbose).do(line => {
          builder.addTokenInfoDictionary(line);
        }));
      });
    }

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

function createReadlineObservable(filepath ,verbose) {
  return Observable.create((obs) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filepath),
      output: null,
      terminal: false
    });
    rl.on('line', (line) => {
      obs.next(line)
    });
    rl.on('close', () => {
      if (verbose) {
        console.log(`Read: ${filepath}`);
      }
      obs.complete();
    });
  });
}
