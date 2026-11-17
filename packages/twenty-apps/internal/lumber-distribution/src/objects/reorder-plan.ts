import { defineObject, FieldType } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineObject({
  universalIdentifier: LUMBER_OBJECTS.reorder.universalIdentifier,
  nameSingular: 'reorderPlan',
  namePlural: 'reorderPlans',
  labelSingular: 'Reorder plan',
  labelPlural: 'Reorder plans',
  icon: 'IconRepeat',
  labelIdentifierFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.reorder.fields.name,
  fields: [
    {
      universalIdentifier: LUMBER_OBJECTS.reorder.fields.name,
      name: 'name',
      label: 'Name',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: false,
      defaultValue: "''",
    },
    {
      universalIdentifier: LUMBER_OBJECTS.reorder.fields.status,
      name: 'status',
      label: 'Status',
      type: FieldType.SELECT,
      icon: 'IconList',
      isNullable: false,
      ...{
        options: [
          {
            id: '47183923-f27e-4246-89cc-52e07ed7bbcc',
            value: 'ACTIVE',
            label: 'Active',
            color: 'green',
            position: 0,
          },
          {
            id: 'e791bd1f-533b-4592-810c-6f428c35b76d',
            value: 'PAUSED',
            label: 'Paused',
            color: 'orange',
            position: 1,
          },
          {
            id: 'fb0bc20e-48e4-4bb2-8eeb-386401456ceb',
            value: 'ENDED',
            label: 'Ended',
            color: 'gray',
            position: 2,
          },
        ],
        defaultValue: "'ACTIVE'",
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.reorder.fields.repeatMonths,
      name: 'repeatMonths',
      label: 'Repeat every (months)',
      type: FieldType.NUMBER,
      icon: 'IconNumber',
      isNullable: true,
      ...{
        universalSettings: {
          dataType: 'int',
          decimals: 0,
        },
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.reorder.fields.nextNeedAt,
      name: 'nextNeedAt',
      label: 'Next expected need at',
      type: FieldType.DATE_TIME,
      icon: 'IconCalendar',
      isNullable: true,
    },
    {
      universalIdentifier: LUMBER_OBJECTS.reorder.fields.reviewAt,
      name: 'reviewAt',
      label: 'Review / contact by',
      type: FieldType.DATE_TIME,
      icon: 'IconCalendar',
      isNullable: true,
    },
    {
      universalIdentifier: LUMBER_OBJECTS.reorder.fields.leadTimeDays,
      name: 'leadTimeDays',
      label: 'Planning lead time (days)',
      type: FieldType.NUMBER,
      icon: 'IconNumber',
      isNullable: true,
      ...{
        universalSettings: {
          dataType: 'float',
          decimals: 4,
        },
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.reorder.fields.expectedQuantity,
      name: 'expectedQuantity',
      label: 'Indicative quantity',
      type: FieldType.NUMBER,
      icon: 'IconNumber',
      isNullable: true,
      ...{
        universalSettings: {
          dataType: 'float',
          decimals: 4,
        },
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.reorder.fields.quantityUnit,
      name: 'quantityUnit',
      label: 'Quantity unit',
      type: FieldType.SELECT,
      icon: 'IconList',
      isNullable: true,
      ...{
        options: [
          {
            id: '294b9e1e-4592-4dbd-9b8e-d84eb5607238',
            value: 'BOARD_FEET',
            label: 'Board feet',
            color: 'blue',
            position: 0,
          },
          {
            id: '7fee453c-b54e-4d7b-9d29-c07fbd2c716a',
            value: 'THOUSAND_BOARD_FEET',
            label: 'Thousand board feet (MBF)',
            color: 'sky',
            position: 1,
          },
          {
            id: 'a9f6b215-675c-4a16-aff6-bf084aa34607',
            value: 'LINEAR_FEET',
            label: 'Linear feet',
            color: 'green',
            position: 2,
          },
          {
            id: 'e58e93f4-347e-42d2-8ad8-06c35429ffa2',
            value: 'PIECES',
            label: 'Pieces',
            color: 'purple',
            position: 3,
          },
          {
            id: '809cee15-d27c-4b73-b07a-3d833311ebdf',
            value: 'BUNDLES',
            label: 'Bundles',
            color: 'orange',
            position: 4,
          },
          {
            id: 'b5e28238-8c76-4d5e-9dd5-187ac1894053',
            value: 'CUBIC_METERS',
            label: 'Cubic meters',
            color: 'cyan',
            position: 5,
          },
          {
            id: 'cf5e3b3d-bc44-46c4-9dfd-1d7f69edafea',
            value: 'OTHER',
            label: 'Other — specify in notes',
            color: 'gray',
            position: 6,
          },
        ],
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.reorder.fields.notes,
      name: 'notes',
      label: 'Planning notes',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: true,
      ...{
        description:
          'Confirm quantity, price and availability with the customer before creating a new order.',
      },
    },
  ],
});
