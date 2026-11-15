import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.order.fields.reorderPlans,
  objectUniversalIdentifier: LUMBER_OBJECTS.order.universalIdentifier,
  name: 'reorderPlans',
  label: 'Reorder plans',
  type: FieldType.RELATION,
  icon: 'IconRepeat',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.reorder.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.reorder.fields.referenceOrder,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
