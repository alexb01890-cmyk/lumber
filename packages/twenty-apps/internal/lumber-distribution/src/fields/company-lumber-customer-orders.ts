import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';
import { LUMBER_COMPANY_FIELDS } from '../constants/lumber-company-fields';

export default defineField({
  universalIdentifier: LUMBER_COMPANY_FIELDS.company_lumberCustomerOrders,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  name: 'lumberCustomerOrders',
  label: 'Lumber customer orders',
  type: FieldType.RELATION,
  icon: 'IconShoppingCart',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.order.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.order.fields.customer,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
