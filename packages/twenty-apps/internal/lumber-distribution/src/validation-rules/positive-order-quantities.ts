import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: 'a0bfdc69-e9be-4313-8beb-dc9652d92b25',
  objectUniversalIdentifier: LUMBER_OBJECTS.orderLine.universalIdentifier,
  name: 'positive-order-quantities',
  expression:
    '(not isDefined(quantity) or quantity > 0) and (not isDefined(pricingQuantity) or pricingQuantity > 0)',
  message: 'Ordered and pricing quantities must be positive when entered.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.orderLine.fields.quantity,
});
