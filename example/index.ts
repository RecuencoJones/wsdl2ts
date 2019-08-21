import { resolve } from 'path';
import { createClientAsync } from 'soap';
import { BricksetAPIv2 } from '../out/wsdl';

const wsdlPath = resolve(__dirname, '../data/brickset.wsdl');

async function main(): Promise<void> {
  const client: BricksetAPIv2 = await createClientAsync(wsdlPath);

  client.describe();

  const result = await client.checkKeyAsync({
    apiKey: 'foo'
  }, {
    postProcess(xml) {
      console.log(xml);

      return xml;
    }
  });

  console.log(result);
}

main()
.catch((err) => {
  console.error(err.Fault);
});
