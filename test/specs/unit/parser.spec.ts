import { parseWsdlToStatements } from '../../../src/parser';

describe('parseWsdlToStatements', () => {
  it('should parse XML without types', () => {
    const sourceFile = parseWsdlToStatements(`
<wsdl:definitions xmlns:tns="https://my.api">
  <wsdl:message name="OperationIn">
    <wsdl:part name="parameters" type="s:string" />
  </wsdl:message>
  <wsdl:message name="OperationOut">
    <wsdl:part name="parameters" type="s:string" />
  </wsdl:message>
  <wsdl:portType name="SomeBinding">
    <wsdl:operation name="Operation1">
      <wsdl:input message="tns:OperationIn" />
      <wsdl:output message="tns:OperationOut" />
    </wsdl:operation>
  </wsdl:portType>
  <wsdl:service name="Spec">
    <wsdl:port binding="tns:SomeBinding">
      <soap:address/>
    </wsdl:port>
  </wsdl:service>
</wsdl:definitions>
    `);

    expect(sourceFile).toMatchObject({
      statements: [
        {},
        {
          name: 'ComplexTypes'
        },
        {
          name: 'Elements'
        },
        {
          name: 'Messages',
          statements: [
            { name: 'OperationIn' },
            { name: 'OperationOut' }
          ]
        },
        {
          name: 'Operations',
          statements: [{ name: 'SomeBinding' }]
        },
        {
          name: 'Spec'
        }
      ]
    });
  });

  it('should parse XML without complex types', () => {
    const sourceFile = parseWsdlToStatements(`
<wsdl:definitions xmlns:tns="https://my.api">
  <wsdl:types>
    <s:schema>
      <s:element name="Operation" type="s:string"/>
      <s:element name="OperationResponse" type="s:string"/>
    </s:schema>
  </wsdl:types>
  <wsdl:message name="OperationIn">
    <wsdl:part name="parameters" element="tns:Operation" />
  </wsdl:message>
  <wsdl:message name="OperationOut">
    <wsdl:part name="parameters" element="tns:OperationResponse" />
  </wsdl:message>
  <wsdl:portType name="SomeBinding">
    <wsdl:operation name="Operation1">
      <wsdl:input message="tns:OperationIn" />
      <wsdl:output message="tns:OperationOut" />
    </wsdl:operation>
  </wsdl:portType>
  <wsdl:service name="Spec">
    <wsdl:port binding="tns:SomeBinding">
      <soap:address/>
    </wsdl:port>
  </wsdl:service>
</wsdl:definitions>
    `);

    expect(sourceFile).toMatchObject({
      statements: [
        {},
        {
          name: 'ComplexTypes'
        },
        {
          name: 'Elements',
          statements: [
            { name: 'Operation' },
            { name: 'OperationResponse' }
          ]
        },
        {
          name: 'Messages',
          statements: [
            { name: 'OperationIn' },
            { name: 'OperationOut' }
          ]
        },
        {
          name: 'Operations',
          statements: [{ name: 'SomeBinding' }]
        },
        {
          name: 'Spec'
        }
      ]
    });
  });

  it('should parse XML with complex types', () => {
    const sourceFile = parseWsdlToStatements(`
<wsdl:definitions xmlns:tns="https://my.api">
  <wsdl:types>
    <s:schema>
      <s:complexType name="Operation">
        <s:sequence>
          <s:element name="specs" type="s:string" />
        </s:sequence>
      </s:complexType>
      <s:element name="OperationResponse" type="s:string"/>
    </s:schema>
  </wsdl:types>
  <wsdl:message name="OperationIn">
    <wsdl:part name="parameters" element="tns:Operation" />
  </wsdl:message>
  <wsdl:message name="OperationOut">
    <wsdl:part name="parameters" element="tns:OperationResponse" />
  </wsdl:message>
  <wsdl:portType name="SomeBinding">
    <wsdl:operation name="Operation1">
      <wsdl:input message="tns:OperationIn" />
      <wsdl:output message="tns:OperationOut" />
    </wsdl:operation>
  </wsdl:portType>
  <wsdl:service name="Spec">
    <wsdl:port binding="tns:SomeBinding">
      <soap:address/>
    </wsdl:port>
  </wsdl:service>
</wsdl:definitions>
    `);

    expect(sourceFile).toMatchObject({
      statements: [
        {},
        {
          name: 'ComplexTypes',
          statements: [{ name: 'Operation' }]
        },
        {
          name: 'Elements',
          statements: [{ name: 'OperationResponse' }]
        },
        {
          name: 'Messages',
          statements: [
            { name: 'OperationIn' },
            { name: 'OperationOut' }
          ]
        },
        {
          name: 'Operations',
          statements: [{ name: 'SomeBinding' }]
        },
        {
          name: 'Spec'
        }
      ]
    });
  });
});
