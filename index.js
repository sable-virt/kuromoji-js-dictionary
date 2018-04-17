'use strict';

const path = require('path');
const {Command, flags} = require('@oclif/command');
const reader = require('./lib/reader');
const exporter = require('./lib/exporter');

require('rxjs/Observable');
require('rxjs/add/operator/switchMap');

class DictCommand extends Command {
  async run() {
    const {flags} = this.parse(DictCommand);
    reader(flags).switchMap((dict) => {
      return exporter(dict, flags);
    }).subscribe(() => {
      console.log(`All done!!`);
    });
  }
}
DictCommand.description = `
    dict [options]
  `;
DictCommand.flags = {
  version: flags.version({char: 'v'}),
  help: flags.help({char: 'h'}),
  outPath: flags.string({
    char: 'o',
    description: 'dist file directory',
    default: 'dist',
  }),
  baseDictPath: flags.string({
    char: 'b',
    description: 'mecab-ipadic tar.gz file path',
    default: path.join(__dirname, 'dict/mecab-ipadic-2.7.0-20070801.tar.gz')
  }),
  notIncludeNeologd: flags.boolean({
    char: 'n',
    description: 'Not include mecab-ipadic-neologd dictionary'
  }),
  customDictPath: flags.string({
    char: 'c',
    description: 'your custom dictionaries(.csv) directory',
    default: null
  }),
  clean: flags.boolean({
    description: 'clean outPath directory',
    default: true
  })
};

module.exports = DictCommand;
