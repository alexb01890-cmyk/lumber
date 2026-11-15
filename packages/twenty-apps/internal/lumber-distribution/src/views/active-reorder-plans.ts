import { defineView } from 'twenty-sdk/define';

export default defineView({
  universalIdentifier: '703b129b-9240-4aed-ad6d-3ac6b959afa9',
  name: 'Active reorder plans',
  objectUniversalIdentifier: '32d05b14-1d3b-49b9-85d5-14f3051d894b',
  type: 'TABLE',
  icon: 'IconRepeat',
  position: 1,
  fields: [
    {
      universalIdentifier: '6fb5641c-7258-4689-b6d7-6bc55e823bbd',
      fieldMetadataUniversalIdentifier: '1ced4ee3-24d6-4229-b744-d75a701a3e58',
      position: 0,
      isVisible: true,
      size: 230,
    },
    {
      universalIdentifier: '41df62a3-084e-41e2-87db-b128a89153dd',
      fieldMetadataUniversalIdentifier: '48fa6526-bd17-41d7-8792-d7005afa224a',
      position: 1,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '22be92d4-f100-4cf0-a49f-2980230aff61',
      fieldMetadataUniversalIdentifier: '725c5cd3-aaba-4a60-b001-4ae6d526f142',
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'c2d6e94a-52e1-4ed4-8ad0-c003a5752156',
      fieldMetadataUniversalIdentifier: 'b1ed0e06-e739-4642-b624-cf20d6a0fc23',
      position: 3,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '01796e24-114b-4348-b474-2e6eae2a6609',
      fieldMetadataUniversalIdentifier: 'bffc8dd6-1388-400b-9b46-87b5e6ec5ece',
      position: 4,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'f744a56d-a12c-4f2c-a5b7-c3e28421e037',
      fieldMetadataUniversalIdentifier: 'a0cfff3d-5bbb-4162-be39-1541c82701ca',
      position: 5,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '025fe4ed-7f02-4333-a0b3-c98b386761b2',
      fieldMetadataUniversalIdentifier: '50a3b218-d24e-492e-8cdd-2ab22470aa8e',
      position: 6,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '34ad512d-28ae-4eb0-8c99-5fb7682171bd',
      fieldMetadataUniversalIdentifier: 'e4a5cb57-ec3f-4910-a67c-b38c337c1eca',
      position: 7,
      isVisible: true,
      size: 170,
    },
  ],
  filters: [
    {
      universalIdentifier: 'fa5cc9df-ffa7-4aa8-9984-da6ea5be01ee',
      fieldMetadataUniversalIdentifier: '48fa6526-bd17-41d7-8792-d7005afa224a',
      operand: 'IS',
      value: ['ACTIVE'],
    },
  ],
});
