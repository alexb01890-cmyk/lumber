import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.product.fields.orderLines,
  objectUniversalIdentifier: LUMBER_OBJECTS.product.universalIdentifier,
  name: 'orderLines',
  label: 'Order lines',
  type: FieldType.RELATION,
  icon: 'IconListDetails',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.orderLine.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.orderLine.fields.product,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
