import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.product.fields.reorderPlans,
  objectUniversalIdentifier: LUMBER_OBJECTS.product.universalIdentifier,
  name: 'reorderPlans',
  label: 'Reorder plans',
  type: FieldType.RELATION,
  icon: 'IconRepeat',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.reorder.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.reorder.fields.product,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
