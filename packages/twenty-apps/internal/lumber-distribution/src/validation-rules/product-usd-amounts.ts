import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: '4a7b368a-e298-4c13-93c6-8eead093e396',
  objectUniversalIdentifier: LUMBER_OBJECTS.product.universalIdentifier,
  name: 'product-usd-amounts',
  expression:
    '(not isDefined(referencePrice.amountMicros) or referencePrice.currencyCode == "USD")',
  message:
    'Use USD for all amounts in this first version. Currency conversion is not supported.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.product.fields.referencePrice,
});
