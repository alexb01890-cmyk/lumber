import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: '69ad1dbc-c663-49ae-8609-d8a0897bb7ae',
  objectUniversalIdentifier: LUMBER_OBJECTS.product.universalIdentifier,
  name: 'product-lead-time',
  expression: 'not isDefined(leadTimeDays) or leadTimeDays >= 0',
  message: 'Lead time must be zero or a positive number of days.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.product.fields.leadTimeDays,
});
