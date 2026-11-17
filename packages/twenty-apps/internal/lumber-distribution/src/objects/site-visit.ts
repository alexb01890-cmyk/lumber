import { defineObject, FieldType } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineObject({
  universalIdentifier: LUMBER_OBJECTS.visit.universalIdentifier,
  nameSingular: 'siteVisit',
  namePlural: 'siteVisits',
  labelSingular: 'Site visit',
  labelPlural: 'Site visits',
  icon: 'IconMapPin',
  labelIdentifierFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.visit.fields.name,
  fields: [
    {
      universalIdentifier: LUMBER_OBJECTS.visit.fields.name,
      name: 'name',
      label: 'Name',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: false,
      defaultValue: "''",
    },
    {
      universalIdentifier: LUMBER_OBJECTS.visit.fields.status,
      name: 'status',
      label: 'Status',
      type: FieldType.SELECT,
      icon: 'IconList',
      isNullable: false,
      ...{
        options: [
          {
            id: '8bc0fe4a-b768-4309-92fb-cfc8976d7ccb',
            value: 'PLANNED',
            label: 'Planned',
            color: 'blue',
            position: 0,
          },
          {
            id: '8ca1d5de-b851-4f11-8eea-6de6fc482349',
            value: 'COMPLETED',
            label: 'Completed',
            color: 'green',
            position: 1,
          },
          {
            id: 'a41b37e1-a0c0-43ba-91b5-b246a3319674',
            value: 'CANCELLED',
            label: 'Cancelled',
            color: 'gray',
            position: 2,
          },
        ],
        defaultValue: "'PLANNED'",
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.visit.fields.scheduledAt,
      name: 'scheduledAt',
      label: 'Scheduled at',
      type: FieldType.DATE_TIME,
      icon: 'IconCalendar',
      isNullable: true,
    },
    {
      universalIdentifier: LUMBER_OBJECTS.visit.fields.location,
      name: 'location',
      label: 'Visit location',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: true,
    },
    {
      universalIdentifier: LUMBER_OBJECTS.visit.fields.samplesShown,
      name: 'samplesShown',
      label: 'Samples shown / left',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: true,
      ...{
        description:
          'List product names, sample references, and whether samples were left with the customer.',
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.visit.fields.photos,
      name: 'photos',
      label: 'Visit / sample photos',
      type: FieldType.FILES,
      icon: 'IconPhoto',
      isNullable: true,
      ...{
        universalSettings: {
          maxNumberOfValues: 10,
        },
      },
    },
    {
      universalIdentifier: LUMBER_OBJECTS.visit.fields.feedback,
      name: 'feedback',
      label: 'Customer feedback',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: true,
    },
    {
      universalIdentifier: LUMBER_OBJECTS.visit.fields.nextAction,
      name: 'nextAction',
      label: 'Next action',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: true,
    },
    {
      universalIdentifier: LUMBER_OBJECTS.visit.fields.followUpAt,
      name: 'followUpAt',
      label: 'Follow up at',
      type: FieldType.DATE_TIME,
      icon: 'IconCalendar',
      isNullable: true,
    },
    {
      universalIdentifier: LUMBER_OBJECTS.visit.fields.notes,
      name: 'notes',
      label: 'Notes',
      type: FieldType.TEXT,
      icon: 'IconAbc',
      isNullable: true,
    },
  ],
});
