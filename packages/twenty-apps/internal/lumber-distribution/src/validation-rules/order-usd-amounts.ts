import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: 'a3d4ff02-be55-4412-9fd3-1eb26108696e',
  objectUniversalIdentifier: LUMBER_OBJECTS.order.universalIdentifier,
  name: 'order-usd-amounts',
  expression:
    '(not isDefined(orderValue.amountMicros) or orderValue.currencyCode == "USD")',
  message:
    'Use USD for all amounts in this first version. Currency conversion is not supported.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.order.fields.orderValue,
});
