const fs = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const rimraf = require('rimraf');
const { Observable } = require('rxjs/Observable');
require('rxjs/add/operator/map');
require('rxjs/add/observable/bindNodeCallback');

const zgip = Observable.bindNodeCallback(zlib.gzip);
const outputFile = Observable.bindNodeCallback(fs.outputFile);

module.exports = function exportFiles(dic, op) {
  const base_buffer = toBuffer(dic.trie.bc.getBaseBuffer());
  const check_buffer = toBuffer(dic.trie.bc.getCheckBuffer());
  const token_info_buffer = toBuffer(dic.token_info_dictionary.dictionary.buffer);
  const tid_pos_buffer = toBuffer(dic.token_info_dictionary.pos_buffer.buffer);
  const tid_map_buffer = toBuffer(dic.token_info_dictionary.targetMapToBuffer());
  const connection_costs_buffer = toBuffer(dic.connection_costs.buffer);
  const unk_buffer = toBuffer(dic.unknown_dictionary.dictionary.buffer);
  const unk_pos_buffer = toBuffer(dic.unknown_dictionary.pos_buffer.buffer);
  const unk_map_buffer = toBuffer(dic.unknown_dictionary.targetMapToBuffer());
  const char_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.character_category_map);
  const char_compat_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.compatible_category_map);
  const invoke_definition_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.invoke_definition_map.toBuffer());

  const outDir = path.join(process.cwd(), op.outPath);
  if (op.clean) {
    rimraf.sync(outDir);
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirsSync(outDir);
  }

  return Observable.create(obs => {
    Observable.concat(
      exportFile(`${outDir}/base.dat.gz`, base_buffer),
      exportFile(`${outDir}/check.dat.gz`, check_buffer),
      exportFile(`${outDir}/tid.dat.gz`, token_info_buffer),
      exportFile(`${outDir}/tid_pos.dat.gz`, tid_pos_buffer),
      exportFile(`${outDir}/tid_map.dat.gz`, tid_map_buffer),
      exportFile(`${outDir}/cc.dat.gz`, connection_costs_buffer),
      exportFile(`${outDir}/unk.dat.gz`, unk_buffer),
      exportFile(`${outDir}/unk_pos.dat.gz`, unk_pos_buffer),
      exportFile(`${outDir}/unk_map.dat.gz`, unk_map_buffer),
      exportFile(`${outDir}/unk_char.dat.gz`, char_map_buffer),
      exportFile(`${outDir}/unk_compat.dat.gz`, char_compat_map_buffer),
      exportFile(`${outDir}/unk_invoke.dat.gz`, invoke_definition_map_buffer)
    ).subscribe((filepath) => {
      if (op.verbose) {
        console.log(`Write: ${filepath}`);
      }
    }, (e) => {
      obs.error(e);
    }, () => {
      obs.next();
      obs.complete();
    });
  })
};

function toBuffer (typed) {
  const ab = typed.buffer;
  const buffer = new Buffer(ab.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0, len = buffer.length; i < len; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}
function exportFile(filepath, buffer) {
  return zgip(buffer).switchMap((result) => {
    return outputFile(filepath, result);
  }).map(() => {
    return filepath;
  });
}
