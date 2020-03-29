const { program } = require('commander');
const { pipeline } = require('stream');
const through2 = require('through2');
const fs = require('fs');

const keyCodes = {
  a: 97,
  A: 65,
  z: 122,
  Z: 90,
}

program
  .option('-a, --action <type>', 'start encoding/decoding')
  .option('-s, --shift <number>', 'shift code')
  .option('-i, --input <name>', 'input file name')
  .option('-o, --output <name>', 'output file name');

program.parse(process.argv);
process.stdin.setEncoding('utf8');

if ((program.action !== 'decode' && program.action !== 'encode') || !program.shift) {
  console.error('[ERROR] Missing required arguments');
  process.exit(1);
};

function getInputStream() {
  if (program.input) {
    return fs.createReadStream(program.input)
      .on('error', error => process.stderr.write('[ERROR] Input file doesn\'t exist or you can\'t read it\n'));
  }

  return process.stdin;
}

function getOutputStream() {
  if (program.output) {
    return fs.createWriteStream(program.output)
      .on('error', error => process.stderr.write('[ERROR] Output file doesn\'t exist or you can\'t read it\n'));
  }

  return process.stdout;
}

function shifter(min, max, value, shift) {
  value += shift;

  if (value < min) {
    value = 26 + value;
  }

  if (value > max) {
    value = -26 + value;
  }

  return value;
}

function transformStreamByCaesarCipher(chunk, enc, callback) {
  const shift = (program.action === 'encode' ? 1 : -1) * program.shift;

  for (var i = 0; i < chunk.length; i++) {
    if (chunk[i] >= keyCodes.a && chunk[i] <= keyCodes.z) {
      chunk[i] = shifter(keyCodes.a, keyCodes.z, chunk[i], shift);
    } 
    
    else if (chunk[i] >= keyCodes.A && chunk[i] <= keyCodes.Z) {
      chunk[i] = shifter(keyCodes.A, keyCodes.Z, chunk[i], shift);
    }
  }

  this.push(chunk);
  callback();
}


pipeline(
  getInputStream(),
  through2(transformStreamByCaesarCipher),
  getOutputStream(),
  (err) => {
    if (err) {
      console.error('Pipeline failed.', err);
    } else {

      console.log('Pipeline succeeded.');
    }
  }
);