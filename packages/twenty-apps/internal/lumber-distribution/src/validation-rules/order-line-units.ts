import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: '36b01681-6f69-4c6c-95aa-0e05ec3806b9',
  objectUniversalIdentifier: LUMBER_OBJECTS.orderLine.universalIdentifier,
  name: 'order-line-units',
  expression:
    '(not isDefined(quantity) or isDefined(quantityUnit)) and (not isDefined(pricingQuantity) or isDefined(pricingUnit))',
  message: 'Choose an explicit unit for each entered quantity.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.orderLine.fields.quantityUnit,
});
