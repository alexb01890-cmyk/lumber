import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LUMBER_OBJECTS } from '../constants/lumber-objects';
import { LUMBER_COMPANY_FIELDS } from '../constants/lumber-company-fields';

export default defineField({
  universalIdentifier: LUMBER_COMPANY_FIELDS.person_lumberOrders,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  name: 'lumberOrders',
  label: 'Lumber orders',
  type: FieldType.RELATION,
  icon: 'IconShoppingCart',
  relationTargetObjectMetadataUniversalIdentifier:
    LUMBER_OBJECTS.order.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LUMBER_OBJECTS.order.fields.contact,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
