import {
  defineField,
  FieldType,
  RelationType,
  OnDeleteAction,
} from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.reorder.fields.referenceOrder,
  objectUniversalIdentifier: LUMBER_OBJECTS.reorder.universalIdentifier,
  name: 'referenceOrder',
  label: 'Reference order',
  type: FieldType.RELATION,
  icon: 'IconShoppingCart',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.order.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.order.fields.reorderPlans,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'referenceOrderId',
  },
});
