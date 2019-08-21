import * as yargs from 'yargs';
import { transform } from './index';

export type TransformCommandArgs = {
  wsdl: string;
  out: string;
  url: boolean;
};

yargs
  .command({
    command: '$0 <wsdl>',
    aliases: 'transform',
    describe: 'Transform a WSDL specification to TypeScript typings. Works best with `soap` module.',
    builder: (yargs) =>
      yargs.positional('wsdl', {
        describe: 'Path to WSDL file'
      })
      .option('url', {
        alias: 'u',
        describe: 'Use URL instead of file.',
        type: 'boolean'
      })
      .option('out', {
        alias: [ 'o', 'output' ],
        describe: 'Path to TypeScript output file',
        normalize: true,
        required: true
      }),
    handler({ wsdl, out, url }: yargs.Arguments<TransformCommandArgs>) {
      transform(wsdl, out, { url });
    }
  })
  .help()
  .wrap(null)
  .argv;
