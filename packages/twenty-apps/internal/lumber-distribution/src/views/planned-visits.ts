import { defineView } from 'twenty-sdk/define';

export default defineView({
  universalIdentifier: '7e82143d-c61f-4823-98a5-10dfbdda165e',
  name: 'Planned site visits',
  objectUniversalIdentifier: '100c3020-24c2-4089-8bd8-baac4489cadd',
  type: 'TABLE',
  icon: 'IconMapPin',
  position: 1,
  fields: [
    {
      universalIdentifier: '0c89c087-4e60-4d55-b3a9-f5b4b3d22a1b',
      fieldMetadataUniversalIdentifier: '8ea32c22-889b-41fc-8e8b-f869df747eee',
      position: 0,
      isVisible: true,
      size: 230,
    },
    {
      universalIdentifier: '57339191-e83a-4829-8ebd-a2727ce656d1',
      fieldMetadataUniversalIdentifier: '171a7a7d-fe64-4603-afbf-d1ec4eede52d',
      position: 1,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'a24fc523-860b-4112-9916-205b0fe19f56',
      fieldMetadataUniversalIdentifier: '8b04b9d2-3db9-49d2-bd69-b29064731423',
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'e8ebf235-a9dc-4718-b4b3-9e546364d80f',
      fieldMetadataUniversalIdentifier: '3235edc9-e8a9-4e94-8a22-ba1bcdd45683',
      position: 3,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '5a34e7eb-63b7-4daf-8327-0edf9440e052',
      fieldMetadataUniversalIdentifier: 'c6d9582d-ff05-4ab9-a6e8-38424ab59464',
      position: 4,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'b777dfd0-ffc9-4ff4-afa9-d3b25817b1d9',
      fieldMetadataUniversalIdentifier: '77e902b7-c0bd-43a2-b3be-de9c4c640e4c',
      position: 5,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '0198fce8-e520-403b-b3ec-7e5e346d3f69',
      fieldMetadataUniversalIdentifier: 'c9f78e61-11b2-4549-ba7b-a300c368cb69',
      position: 6,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '645ab76c-e221-4b7f-a286-54d1b06804e4',
      fieldMetadataUniversalIdentifier: '0dcfdecf-4679-4388-9f7a-ae15f76d0b73',
      position: 7,
      isVisible: true,
      size: 170,
    },
  ],
  filters: [
    {
      universalIdentifier: '640f2d6e-194e-43e8-8c3a-16bbcd0eac54',
      fieldMetadataUniversalIdentifier: '171a7a7d-fe64-4603-afbf-d1ec4eede52d',
      operand: 'IS',
      value: ['PLANNED'],
    },
  ],
});
