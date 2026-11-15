import { defineView } from 'twenty-sdk/define';

export default defineView({
  universalIdentifier: 'bdb644e6-1d09-49d5-9dae-6d608c13fbbe',
  name: 'Delayed shipments',
  objectUniversalIdentifier: '0826c666-a73a-4052-a44a-0853dac469c8',
  type: 'TABLE',
  icon: 'IconTruckDelivery',
  position: 1,
  fields: [
    {
      universalIdentifier: '3c4d01a1-3b3d-42c4-8e93-3ab87dc53baf',
      fieldMetadataUniversalIdentifier: 'bfbd924d-636b-4f64-96cd-e3c37cd9d7e2',
      position: 0,
      isVisible: true,
      size: 230,
    },
    {
      universalIdentifier: '97370d71-7572-4e95-8c17-a01ea0f111ff',
      fieldMetadataUniversalIdentifier: 'b6ba0380-0e33-456a-b56e-039b9af78903',
      position: 1,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'd26bfcff-39bb-4785-bb00-7a89a7f08254',
      fieldMetadataUniversalIdentifier: '7c14ee70-e536-46b0-bc96-005fb6b3324c',
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '0c760cbe-7c07-4cd1-822a-09b2b794f400',
      fieldMetadataUniversalIdentifier: '9cfbb84f-4649-406e-a47c-945572a461bf',
      position: 3,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '7a67402a-065b-4df6-9619-48102688c46e',
      fieldMetadataUniversalIdentifier: '9fefb5cb-6c3f-4806-aa4c-5919e7eaa556',
      position: 4,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '5b22e10f-c939-4bb7-97f9-40261b4adcd0',
      fieldMetadataUniversalIdentifier: '69fa0e54-cdb6-4282-b58a-9f561ea628bc',
      position: 5,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '33e21425-12a1-4b62-82b7-53154e7ad882',
      fieldMetadataUniversalIdentifier: 'f7b1ff3a-3d39-4276-9e76-0cdfe7c4fb6c',
      position: 6,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '91ce1f19-e869-45f0-977a-38b7a6265d6d',
      fieldMetadataUniversalIdentifier: '89a0d5cb-f698-4c76-9e20-0be4c685d51f',
      position: 7,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: '284f0409-c03c-442f-bccc-b5f6a5b274bf',
      fieldMetadataUniversalIdentifier: '4a9005eb-9c0f-4359-bc03-62bb6386909a',
      position: 8,
      isVisible: true,
      size: 170,
    },
  ],
  filters: [
    {
      universalIdentifier: '494375b5-f10b-491f-b82c-f71ed5af686e',
      fieldMetadataUniversalIdentifier: 'b6ba0380-0e33-456a-b56e-039b9af78903',
      operand: 'IS',
      value: ['DELAYED'],
    },
  ],
});
