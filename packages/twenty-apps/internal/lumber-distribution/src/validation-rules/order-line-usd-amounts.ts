import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: '9c35ed53-46ed-4c15-a83a-46cf81bf8a70',
  objectUniversalIdentifier: LUMBER_OBJECTS.orderLine.universalIdentifier,
  name: 'order-line-usd-amounts',
  expression:
    '(not isDefined(unitPrice.amountMicros) or unitPrice.currencyCode == "USD") and (not isDefined(lineValue.amountMicros) or lineValue.currencyCode == "USD")',
  message:
    'Use USD for all amounts in this first version. Currency conversion is not supported.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.orderLine.fields.unitPrice,
});
