import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: '0b0eae02-8223-4e12-8206-741576048bca',
  objectUniversalIdentifier: LUMBER_OBJECTS.shipment.universalIdentifier,
  name: 'positive-shipment-quantity',
  expression: 'not isDefined(quantity) or quantity > 0',
  message: 'Shipment lot quantity must be positive when entered.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.shipment.fields.quantity,
});
