import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: 'b2b40bae-a662-4c5f-ab35-3ae45dc9b125',
  objectUniversalIdentifier: LUMBER_OBJECTS.shipment.universalIdentifier,
  name: 'delivered-shipment-date',
  expression:
    'status != "DELIVERED" or (isDefined(deliveredAt) and isDefined(quantity) and quantity > 0)',
  message:
    'A delivered lot needs its actual delivery date and positive quantity.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.shipment.fields.deliveredAt,
});
