import {
  defineField,
  FieldType,
  RelationType,
  OnDeleteAction,
} from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.visit.fields.product,
  objectUniversalIdentifier: LUMBER_OBJECTS.visit.universalIdentifier,
  name: 'product',
  label: 'Primary sample product',
  type: FieldType.RELATION,
  icon: 'IconBox',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.product.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.product.fields.sampleVisits,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'productId',
  },
});
