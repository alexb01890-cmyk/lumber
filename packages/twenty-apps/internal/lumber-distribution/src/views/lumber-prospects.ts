import { defineView } from 'twenty-sdk/define';

export default defineView({
  universalIdentifier: '330e41b4-6793-4275-ba64-2ee8d2736369',
  name: 'Lumber prospects',
  objectUniversalIdentifier: '20202020-b374-4779-a561-80086cb2e17f',
  type: 'TABLE',
  icon: 'IconBuildingSkyscraper',
  position: 12,
  fields: [
    {
      universalIdentifier: '8ab8db8b-4cbd-488a-8d5f-6d39513cd59a',
      fieldMetadataUniversalIdentifier: '20202020-4d99-4e2e-a84c-4a27837b1ece',
      position: 0,
      isVisible: true,
      size: 230,
    },
    {
      universalIdentifier: 'a34ee4e7-f6b9-4eba-a159-fae671676ced',
      fieldMetadataUniversalIdentifier: '3a8ee602-c23a-4596-a10f-538460fd9bde',
      position: 1,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '40083d3e-a93a-403c-b608-915383f61f32',
      fieldMetadataUniversalIdentifier: 'cfeb743b-52a7-4cef-b621-2961f5bee8d7',
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '20b4d8ae-dc58-4b75-956f-d0cc34ab31fd',
      fieldMetadataUniversalIdentifier: 'a04ce7bc-40ea-444b-a1e4-923d9cffff8e',
      position: 3,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'ffc92801-07a0-4891-ae82-4748f76177cd',
      fieldMetadataUniversalIdentifier: 'a1232948-6770-4ead-92fd-866acfb0eae2',
      position: 4,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '1713f829-47a6-4bf6-94b9-96164bd86a88',
      fieldMetadataUniversalIdentifier: '613a3c41-3cfa-4855-977c-4f173da046e7',
      position: 5,
      isVisible: true,
      size: 170,
    },
  ],
  filters: [
    {
      universalIdentifier: '69855baf-8f41-409f-a87c-c12f2b482a8b',
      fieldMetadataUniversalIdentifier: '3a8ee602-c23a-4596-a10f-538460fd9bde',
      operand: 'IS',
      value: ['PROSPECT'],
    },
  ],
});
