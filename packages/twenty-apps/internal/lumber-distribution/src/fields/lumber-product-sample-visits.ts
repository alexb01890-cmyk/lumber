import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.product.fields.sampleVisits,
  objectUniversalIdentifier: LUMBER_OBJECTS.product.universalIdentifier,
  name: 'sampleVisits',
  label: 'Sample visits',
  type: FieldType.RELATION,
  icon: 'IconMapPin',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.visit.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.visit.fields.product,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
