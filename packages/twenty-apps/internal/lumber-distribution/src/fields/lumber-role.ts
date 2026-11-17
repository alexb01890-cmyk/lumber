import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LUMBER_COMPANY_FIELDS } from '../constants/lumber-company-fields';

export default defineField({
  universalIdentifier: LUMBER_COMPANY_FIELDS.lumberRole,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  name: 'lumberRole',
  label: 'Lumber business role',
  type: FieldType.SELECT,
  icon: 'IconList',
  isNullable: true,
  ...{
    options: [
      {
        id: '4e7ce3da-f627-4337-b951-a19faeca184c',
        value: 'PROSPECT',
        label: 'Prospect',
        color: 'blue',
        position: 0,
      },
      {
        id: 'f590ff73-513b-4252-a661-f87e3ee0e6aa',
        value: 'CUSTOMER',
        label: 'Customer',
        color: 'green',
        position: 1,
      },
      {
        id: 'd4d01070-4ca0-47a0-8732-2eac1fc43141',
        value: 'SUPPLIER',
        label: 'Supplier',
        color: 'orange',
        position: 2,
      },
      {
        id: '2d22bd38-5d3e-4fdb-92a1-f8685bddb136',
        value: 'BOTH',
        label: 'Customer and supplier',
        color: 'purple',
        position: 3,
      },
    ],
  },
});
