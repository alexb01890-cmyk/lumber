import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';
import { LUMBER_COMPANY_FIELDS } from '../constants/lumber-company-fields';

export default defineField({
  universalIdentifier: LUMBER_COMPANY_FIELDS.company_lumberSiteVisits,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  name: 'lumberSiteVisits',
  label: 'Lumber site visits',
  type: FieldType.RELATION,
  icon: 'IconMapPin',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.visit.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.visit.fields.customer,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
