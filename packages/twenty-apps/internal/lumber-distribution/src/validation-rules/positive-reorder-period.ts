import { defineValidationRule } from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';

export default defineValidationRule({
  universalIdentifier: '57ac7ee6-6073-464d-8020-025048bd170f',
  objectUniversalIdentifier: LUMBER_OBJECTS.reorder.universalIdentifier,
  name: 'positive-reorder-period',
  expression:
    '(not isDefined(repeatMonths) or repeatMonths > 0) and (not isDefined(expectedQuantity) or expectedQuantity > 0) and (not isDefined(leadTimeDays) or leadTimeDays >= 0)',
  message:
    'Repeat months and quantity must be positive; planning lead time cannot be negative.',
  errorFieldUniversalIdentifier: LUMBER_OBJECTS.reorder.fields.repeatMonths,
});
