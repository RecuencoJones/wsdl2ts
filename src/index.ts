import { resolve } from 'path';
import { readFileSync } from 'fs';
import axios from 'axios';
import { writeWsdlTypeFile } from './writer';
import { parseWsdlToStatements } from './parser';

export type WSDLTranformOptions = {
  url?: boolean;
};

export async function transform(xmlFilePath: string, outFile: string, { url }: WSDLTranformOptions): Promise<void> {
  const cwd = process.cwd();
  let wsdlContents: string;

  if (url) {
    const { data } = await axios.get(xmlFilePath);

    wsdlContents = data;
  } else {
    wsdlContents = readFileSync(resolve(cwd, xmlFilePath), 'utf8');
  }

  const ast = parseWsdlToStatements(wsdlContents);

  writeWsdlTypeFile(resolve(cwd, outFile), ast);
}
