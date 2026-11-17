import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.order.fields.commissions,
  objectUniversalIdentifier: LUMBER_OBJECTS.order.universalIdentifier,
  name: 'commissions',
  label: 'Commissions',
  type: FieldType.RELATION,
  icon: 'IconPercentage',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.commission.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.commission.fields.order,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
