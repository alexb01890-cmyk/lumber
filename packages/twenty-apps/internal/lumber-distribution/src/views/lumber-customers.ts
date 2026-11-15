import { defineView } from 'twenty-sdk/define';

export default defineView({
  universalIdentifier: '70c53220-572a-4ade-92a4-cb6d753c697f',
  name: 'Lumber customers',
  objectUniversalIdentifier: '20202020-b374-4779-a561-80086cb2e17f',
  type: 'TABLE',
  icon: 'IconBuildingSkyscraper',
  position: 13,
  fields: [
    {
      universalIdentifier: 'ca70bd24-76cd-494c-bf2c-7769bde5868f',
      fieldMetadataUniversalIdentifier: '20202020-4d99-4e2e-a84c-4a27837b1ece',
      position: 0,
      isVisible: true,
      size: 230,
    },
    {
      universalIdentifier: '84818851-ad11-4961-8237-49fbf2282d24',
      fieldMetadataUniversalIdentifier: '3a8ee602-c23a-4596-a10f-538460fd9bde',
      position: 1,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'e03ea092-2d77-44a5-a46c-0bace741171a',
      fieldMetadataUniversalIdentifier: 'cfeb743b-52a7-4cef-b621-2961f5bee8d7',
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '83ed11c5-2db9-48df-8da4-1cb6455b8e82',
      fieldMetadataUniversalIdentifier: 'a04ce7bc-40ea-444b-a1e4-923d9cffff8e',
      position: 3,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '9f3fcaf4-2bca-4463-82ab-488da84b0dc1',
      fieldMetadataUniversalIdentifier: 'a1232948-6770-4ead-92fd-866acfb0eae2',
      position: 4,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '55501772-37d7-4676-938f-5e6669b166d0',
      fieldMetadataUniversalIdentifier: '613a3c41-3cfa-4855-977c-4f173da046e7',
      position: 5,
      isVisible: true,
      size: 170,
    },
  ],
  filters: [
    {
      universalIdentifier: 'c9b1eb11-8b3d-42d8-90b8-d142433bf164',
      fieldMetadataUniversalIdentifier: '3a8ee602-c23a-4596-a10f-538460fd9bde',
      operand: 'IS',
      value: ['CUSTOMER', 'BOTH'],
    },
  ],
});
