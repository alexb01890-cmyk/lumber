import { defineView } from 'twenty-sdk/define';

export default defineView({
  universalIdentifier: '914cfc5c-b7f2-435e-af33-2d1a0975a5f2',
  name: 'Lumber suppliers',
  objectUniversalIdentifier: '20202020-b374-4779-a561-80086cb2e17f',
  type: 'TABLE',
  icon: 'IconBuildingSkyscraper',
  position: 14,
  fields: [
    {
      universalIdentifier: 'dda77a42-3848-402a-9f6d-494f3fda011a',
      fieldMetadataUniversalIdentifier: '20202020-4d99-4e2e-a84c-4a27837b1ece',
      position: 0,
      isVisible: true,
      size: 230,
    },
    {
      universalIdentifier: 'a5735e0b-10fc-4145-91fd-e70ccd2a3fe7',
      fieldMetadataUniversalIdentifier: '3a8ee602-c23a-4596-a10f-538460fd9bde',
      position: 1,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '4fd86b13-dc46-48b1-9fc3-cd5e1f0bab75',
      fieldMetadataUniversalIdentifier: 'cfeb743b-52a7-4cef-b621-2961f5bee8d7',
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'b4b2ee80-99df-42a4-b9e4-f4083cb5dd64',
      fieldMetadataUniversalIdentifier: 'a04ce7bc-40ea-444b-a1e4-923d9cffff8e',
      position: 3,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '6a4996bb-ce8d-4989-a1be-935eff18bb5a',
      fieldMetadataUniversalIdentifier: 'a1232948-6770-4ead-92fd-866acfb0eae2',
      position: 4,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '3bec16d7-2029-4833-b0be-c9d5f9d51ec1',
      fieldMetadataUniversalIdentifier: '613a3c41-3cfa-4855-977c-4f173da046e7',
      position: 5,
      isVisible: true,
      size: 170,
    },
  ],
  filters: [
    {
      universalIdentifier: '75be18d4-09bd-474e-9e0e-8f1a3f60ba0a',
      fieldMetadataUniversalIdentifier: '3a8ee602-c23a-4596-a10f-538460fd9bde',
      operand: 'IS',
      value: ['SUPPLIER', 'BOTH'],
    },
  ],
});
