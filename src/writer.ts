import { Project, SourceFileStructure } from 'ts-morph';

export function writeWsdlTypeFile(outFile: string, source: SourceFileStructure): void {
  const project = new Project();

  const wsdl = project.createSourceFile(outFile, source, { overwrite: true });

  wsdl.formatText();
  wsdl.save();
}
