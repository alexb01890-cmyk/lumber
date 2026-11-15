import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';
import { LUMBER_COMPANY_FIELDS } from '../constants/lumber-company-fields';

export default defineField({
  universalIdentifier: LUMBER_COMPANY_FIELDS.company_lumberReorderPlans,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  name: 'lumberReorderPlans',
  label: 'Lumber reorder plans',
  type: FieldType.RELATION,
  icon: 'IconRepeat',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.reorder.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.reorder.fields.customer,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
