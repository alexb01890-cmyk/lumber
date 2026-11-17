import {
  defineField,
  FieldType,
  RelationType,
  OnDeleteAction,
} from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.shipment.fields.orderLine,
  objectUniversalIdentifier: LUMBER_OBJECTS.shipment.universalIdentifier,
  name: 'orderLine',
  label: 'Order line',
  type: FieldType.RELATION,
  icon: 'IconListDetails',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.orderLine.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.orderLine.fields.shipments,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'orderLineId',
  },
});
