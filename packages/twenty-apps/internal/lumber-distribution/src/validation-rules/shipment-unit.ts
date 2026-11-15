import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: 'b769647a-9f29-4179-96c1-6b76d252f738',
  objectUniversalIdentifier: LUMBER_OBJECTS.shipment.universalIdentifier,
  name: 'shipment-unit',
  expression: 'not isDefined(quantity) or isDefined(quantityUnit)',
  message: 'Choose the unit for this shipment lot quantity.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.shipment.fields.quantityUnit,
});
