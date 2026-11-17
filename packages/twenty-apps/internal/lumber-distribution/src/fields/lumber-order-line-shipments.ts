import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineField({
  universalIdentifier: LUMBER_OBJECTS.orderLine.fields.shipments,
  objectUniversalIdentifier: LUMBER_OBJECTS.orderLine.universalIdentifier,
  name: 'shipments',
  label: 'Shipment lots',
  type: FieldType.RELATION,
  icon: 'IconTruckDelivery',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.shipment.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.shipment.fields.orderLine,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
