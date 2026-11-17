import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.order.fields.orderLines,
  objectUniversalIdentifier: LUMBER_OBJECTS.order.universalIdentifier,
  name: 'orderLines',
  label: 'Order lines',
  type: FieldType.RELATION,
  icon: 'IconListDetails',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.orderLine.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.orderLine.fields.order,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
