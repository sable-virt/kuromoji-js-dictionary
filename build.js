'use strict';

const path = require('path');
const reader = require('./lib/reader');
const exporter = require('./lib/exporter');
const yargs = require('yargs');

require('rxjs/Observable');
require('rxjs/add/operator/switchMap');

const argv = yargs.usage(`Usage: dict <command> [options]`)
  .command([`$0 [options]`, `build [options]`], `build dictionaries`, (yg) => {
    return yg.options({
      outPath: {
        alias: 'o',
        describe: 'dist file directory',
        default: 'dist',
        type: 'string'
      },
      baseDictPath: {
        alias: 'b',
        describe: 'mecab-ipadic tar.xz file path',
        default: path.join(__dirname, 'dict/mecab-ipadic-2.7.0-20070801.tar.xz'),
        type: 'string'
      },
      useNeologd: {
        alias: 'n',
        describe: 'use mecab-ipadic-NEologd dictionary',
        default: true,
        type: 'boolean'
      },
      customDictPath: {
        alias: 'c',
        describe: 'your custom dictionaries(.csv) directory',
        default: null,
        type: 'string'
      },
      clean: {
        describe: 'clean outPath directory',
        default: true,
        type: 'boolean'
      }
    });
  }, (argv) => {
    reader(argv).switchMap((dict) => {
      return exporter(dict, argv);
    }).subscribe(() => {
      console.log(`All done!!`);
    });
  })
  .help()
  .alias('help', 'h')
  .option('verbose', {
    default: false
  })
  .version()
  .demandCommand(1, 'Required command')
  .argv;