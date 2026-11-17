import { defineObject, FieldType } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineObject({
  universalIdentifier: LUMBER_OBJECTS.commission.universalIdentifier,
  nameSingular: 'lumberCommission',
  namePlural: 'lumberCommissions',
  labelSingular: 'Commission',
  labelPlural: 'Commissions',
  icon: 'IconPercentage',
  labelIdentifierFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.commission.fields.name,
  fields: [
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.name,
      name: 'name',
      label: 'Name',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: false,
      defaultValue: "''",
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.status,
      name: 'status',
      label: 'Status',
      type: FieldType.SELECT,
      icon: 'IconList',
      isNullable: false,
      ...{
        options: [
          {
            id: 'f9848d1d-5553-46b4-b874-d09fb57c0f75',
            value: 'TBD',
            label: 'Terms TBD',
            color: 'gray',
            position: 0,
          },
          {
            id: 'fc13d56b-95cd-43ae-9b3c-f69a5844bfbf',
            value: 'PROPOSED',
            label: 'Terms proposed',
            color: 'orange',
            position: 1,
          },
          {
            id: 'ba5f7a8d-a107-4dce-b76d-ec479d9d317a',
            value: 'CONFIRMED',
            label: 'Terms confirmed',
            color: 'green',
            position: 2,
          },
        ],
        defaultValue: "'TBD'",
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.commissionRate,
      name: 'commissionRate',
      label: 'Commission rate (%)',
      type: FieldType.NUMBER,
      icon: 'IconNumber',
      isNullable: true,
      ...{
        description:
          'Leave unset until agreed. Zero is an agreed zero rate, not TBD.',
        universalSettings: {
          dataType: 'float',
          decimals: 4,
        },
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.eligibleBasis,
      name: 'eligibleBasis',
      label: 'Eligible commission basis',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: true,
      ...{
        description:
          'Specify whether freight, taxes, discounts and other charges qualify.',
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.eligibleAmount,
      name: 'eligibleAmount',
      label: 'Eligible amount',
      type: FieldType.CURRENCY,
      icon: 'IconCurrencyDollar',
      isNullable: true,
      ...{
        description:
          'Agreed commissionable amount, which may differ from customer order value.',
        universalSettings: {
          format: 'full',
          decimals: 2,
        },
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.expectedCommission,
      name: 'expectedCommission',
      label: 'Expected commission',
      type: FieldType.CURRENCY,
      icon: 'IconCurrencyDollar',
      isNullable: true,
      ...{
        description:
          'Calculated from confirmed commission terms; not money received.',
        universalSettings: {
          format: 'full',
          decimals: 2,
        },
        disabledFieldPermissionActions: ['canUpdateFieldValue'],
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.receivedCommission,
      name: 'receivedCommission',
      label: 'Commission received',
      type: FieldType.CURRENCY,
      icon: 'IconCurrencyDollar',
      isNullable: true,
      ...{
        description:
          'Cumulative commission actually received; delivery or customer payment does not imply receipt.',
        universalSettings: {
          format: 'full',
          decimals: 2,
        },
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.receivedAt,
      name: 'receivedAt',
      label: 'Latest commission receipt at',
      type: FieldType.DATE_TIME,
      icon: 'IconCalendar',
      isNullable: true,
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.yourSharePercent,
      name: 'yourSharePercent',
      label: 'Your proposed share (%)',
      type: FieldType.NUMBER,
      icon: 'IconNumber',
      isNullable: true,
      ...{
        universalSettings: {
          dataType: 'float',
          decimals: 4,
        },
        defaultValue: 50,
      },
    },
    {
      universalIdentifier:
        LUMBER_OBJECTS.commission.fields.partnerPoolSharePercent,
      name: 'partnerPoolSharePercent',
      label: 'Partner pool proposed share (%)',
      type: FieldType.NUMBER,
      icon: 'IconNumber',
      isNullable: true,
      ...{
        universalSettings: {
          dataType: 'float',
          decimals: 4,
        },
        defaultValue: 50,
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.splitConfirmed,
      name: 'splitConfirmed',
      label: 'Split agreement confirmed',
      type: FieldType.BOOLEAN,
      icon: 'IconCheck',
      isNullable: false,
      ...{
        defaultValue: false,
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.splitTerms,
      name: 'splitTerms',
      label: 'Split agreement / partner pool',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: true,
      ...{
        description:
          'Confirm whether the other 50% belongs to partners collectively before calculating allocations.',
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.yourExpectedShare,
      name: 'yourExpectedShare',
      label: 'Your expected share',
      type: FieldType.CURRENCY,
      icon: 'IconCurrencyDollar',
      isNullable: true,
      ...{
        universalSettings: {
          format: 'full',
          decimals: 2,
        },
        disabledFieldPermissionActions: ['canUpdateFieldValue'],
      },
    },
    {
      universalIdentifier:
        LUMBER_OBJECTS.commission.fields.partnerPoolExpectedShare,
      name: 'partnerPoolExpectedShare',
      label: 'Partner pool expected share',
      type: FieldType.CURRENCY,
      icon: 'IconCurrencyDollar',
      isNullable: true,
      ...{
        universalSettings: {
          format: 'full',
          decimals: 2,
        },
        disabledFieldPermissionActions: ['canUpdateFieldValue'],
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.yourPaid,
      name: 'yourPaid',
      label: 'Paid to your side',
      type: FieldType.CURRENCY,
      icon: 'IconCurrencyDollar',
      isNullable: true,
      ...{
        universalSettings: {
          format: 'full',
          decimals: 2,
        },
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.partnerPoolPaid,
      name: 'partnerPoolPaid',
      label: 'Paid to partner pool',
      type: FieldType.CURRENCY,
      icon: 'IconCurrencyDollar',
      isNullable: true,
      ...{
        universalSettings: {
          format: 'full',
          decimals: 2,
        },
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.payoutNotes,
      name: 'payoutNotes',
      label: 'Partner payout notes',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: true,
    },
    {
      universalIdentifier: LUMBER_OBJECTS.commission.fields.notes,
      name: 'notes',
      label: 'Commission notes',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: true,
    },
  ],
});
