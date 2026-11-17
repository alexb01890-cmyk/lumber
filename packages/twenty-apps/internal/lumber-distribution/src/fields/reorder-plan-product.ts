import {
  defineField,
  FieldType,
  RelationType,
  OnDeleteAction,
} from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.reorder.fields.product,
  objectUniversalIdentifier: LUMBER_OBJECTS.reorder.universalIdentifier,
  name: 'product',
  label: 'Product',
  type: FieldType.RELATION,
  icon: 'IconBox',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.product.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.product.fields.reorderPlans,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'productId',
  },
});
