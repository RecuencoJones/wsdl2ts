import { load } from 'cheerio';
import {
  SourceFileStructure, StructureKind, TypeAliasDeclarationStructure,
  Writers, MethodSignatureStructure
} from 'ts-morph';

function isPrimitive(typeName: string): boolean {
  switch (typeName) {
  case 'string':
  case 'number':
  case 'boolean':
    return true;
  default:
    return false;
  }
}

export function parseWsdlToStatements(xmlFile: string): SourceFileStructure {
  const $ = load(xmlFile, { xmlMode: true });
  const complexTypeStatements: Array<TypeAliasDeclarationStructure> = [];
  const elementStatements: Array<TypeAliasDeclarationStructure> = [];
  const messageStatements: Array<TypeAliasDeclarationStructure> = [];
  const operationStatements: Array<TypeAliasDeclarationStructure> = [];
  const attrs = $('wsdl\\:definitions').first().attr();
  const xmlNamespaces = Object.keys(attrs).map((key) => key.split(':')[1]).filter(String);

  const relNamespaces = {
    's:complexType': 'ComplexTypes',
    's:element': 'ComplexTypes',
    'wsdl:message': 'Elements',
    'wsdl:part': 'Elements',
    'wsdl:operation': 'Messages',
    'wsdl:input': 'Messages',
    'wsdl:output': 'Messages',
    'wsdl:port': 'Operations'
  };

  function resolveType(type: string, tag: string): string {
    let namespace;
    let resolvedType;

    switch (type) {
    case 'tns:string':
    case 's:string':
      resolvedType = 'string';
      break;
    case 's:int':
    case 's:decimal':
      resolvedType = 'number';
      break;
    case 's:boolean':
      resolvedType = 'boolean';
      break;
    case 's:dateTime':
      resolvedType = 'Date';
      break;
    default:
      const [ typeNamespace, complexTypeName ] = type.split(':');

      if (xmlNamespaces.includes(typeNamespace)) {
        namespace = relNamespaces[tag];
        resolvedType = complexTypeName;
      } else {
        console.warn('Unknown type', type);
      }

      break;
    }

    if (namespace) {
      return `${ namespace }.${ resolvedType }`;
    }

    return resolvedType;
  }

  function parseElementProperties(el: CheerioElement, childSelector = 's\\:element'): TypeAliasDeclarationStructure {
    const $el = $(el);
    const name = $el.attr('name');

    const propTypes = [];
    const writer = Writers.objectType({
      properties: propTypes
    });

    $el.find(childSelector).each((index, prop) => {
      const $prop = $(prop);
      const propName = $prop.attr('name');
      const propType = $prop.attr('element') || $prop.attr('type');

      propTypes.push({
        name: propName,
        type: resolveType(propType, el.tagName)
      });
    });

    return {
      kind: StructureKind.TypeAlias,
      name,
      type: writer,
      isExported: true
    };
  }

  $('wsdl\\:types').children().children().each((index, el) => {
    const $el = $(el);
    const name = $el.attr('name');

    if (isPrimitive(name)) {
      return;
    }

    if (el.tagName === 's:element') {
      const type = $el.attr('type');

      if (type) {
        elementStatements.push({
          kind: StructureKind.TypeAlias,
          name,
          type: resolveType(type, el.tagName),
          isExported: true
        });
      } else {
        elementStatements.push(parseElementProperties(el));
      }
    } else if (el.tagName === 's:complexType') {
      complexTypeStatements.push(parseElementProperties(el));
    } else {
      throw new Error(`Unknown type definition tag ${ el.tagName }`);
    }
  });

  $('wsdl\\:message').each((index, message) => {
    const $message = $(message);
    const $part = $message.find('wsdl\\:part');

    if ($part.attr('name') === 'parameters') {
      const messageName = $message.attr('name');
      const messageType = $part.attr('element') || $part.attr('type');

      messageStatements.push({
        kind: StructureKind.TypeAlias,
        name: messageName,
        type: resolveType(messageType, message.tagName)
      });
    } else {
      messageStatements.push(parseElementProperties(message, 'wsdl\\:part'));
    }
  });

  $('wsdl\\:portType').each((index, portType) => {
    const $portType = $(portType);
    const operationNamespaceName = $portType.attr('name');
    const operationMethods: Array<MethodSignatureStructure> = [];
    const writer = Writers.objectType({
      methods: operationMethods
    });

    $portType.find('wsdl\\:operation').each((index, operation) => {
      const $operation = $(operation);
      const operationName = $operation.attr('name');
      const operationParameters = $operation.find('wsdl\\:input').attr('message');
      const operationReturnType = $operation.find('wsdl\\:output').attr('message');

      operationMethods.push({
        kind: StructureKind.MethodSignature,
        name: operationName,
        parameters: [
          {
            name: 'data',
            type: resolveType(operationParameters, operation.tagName)
          },
          {
            name: 'cb',
            type: `(error: Error, result: ${ resolveType(operationReturnType, operation.tagName) }) => void`
          }, {
            name: 'options',
            hasQuestionToken: true,
            type: 'ISecurity'
          }
        ],
        returnType: 'void'
      });

      operationMethods.push({
        kind: StructureKind.MethodSignature,
        name: `${ operationName }Async`,
        parameters: [
          {
            name: 'data',
            type: resolveType(operationParameters, operation.tagName)
          }, {
            name: 'options',
            hasQuestionToken: true,
            type: 'ISecurity'
          }
        ],
        returnType: `Promise<${ resolveType(operationReturnType, operation.tagName) }>`
      });
    });

    operationStatements.push({
      kind: StructureKind.TypeAlias,
      name: operationNamespaceName,
      type: writer,
      isExported: true
    });
  });

  const moduleName = $('wsdl\\:service').attr('name');
  const defaultBinding = $('wsdl\\:service').find('soap\\:address').parent().attr('binding');

  return {
    kind: StructureKind.SourceFile,
    statements: [
      {
        kind: StructureKind.ImportDeclaration,
        namedImports: [
          'Client',
          'ISecurity'
        ],
        moduleSpecifier: 'soap'
      },
      {
        kind: StructureKind.Namespace,
        name: 'ComplexTypes',
        statements: complexTypeStatements,
        hasDeclareKeyword: true,
        isExported: true
      },
      {
        kind: StructureKind.Namespace,
        name: 'Elements',
        statements: elementStatements,
        hasDeclareKeyword: true,
        isExported: true
      },
      {
        kind: StructureKind.Namespace,
        name: 'Messages',
        statements: messageStatements,
        hasDeclareKeyword: true,
        isExported: true
      },
      {
        kind: StructureKind.Namespace,
        name: 'Operations',
        statements: operationStatements,
        hasDeclareKeyword: true,
        isExported: true
      },
      {
        kind: StructureKind.TypeAlias,
        name: moduleName,
        type: Writers.intersectionType(
          Writers.objectType({
            properties: [
              {
                name: moduleName,
                type: moduleName
              }
            ]
          }),
          resolveType(defaultBinding, 'wsdl:port'),
          'Client'
        ),
        isExported: true
      }
    ]
  };
}
