import {
  AggregateOperations,
  definePageLayout,
  PageLayoutTabLayoutMode,
} from 'twenty-sdk/define';

import { LUMBER_OBJECTS } from 'src/constants/lumber-objects';
import {
  MAIN_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  MAIN_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const CHART_TIME_SETTINGS = {
  timezone: 'America/New_York',
  firstDayOfTheWeek: 1,
} as const;

export default definePageLayout({
  universalIdentifier: MAIN_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Overview',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: MAIN_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Overview',
      position: 0,
      icon: 'IconChartBar',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: '9e88a38e-3ac0-46e0-9091-06a67959c73b',
          title: 'Confirmed order value',
          type: 'GRAPH',
          objectUniversalIdentifier: LUMBER_OBJECTS.order.universalIdentifier,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 0,
            column: 0,
            rowSpan: 2,
            columnSpan: 4,
          },
          configuration: {
            configurationType: 'AGGREGATE_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              LUMBER_OBJECTS.order.fields.orderValue,
            aggregateOperation: AggregateOperations.SUM,
            displayDataLabel: true,
            ...CHART_TIME_SETTINGS,
            filter: {
              recordFilters: [
                {
                  fieldMetadataUniversalIdentifier:
                    LUMBER_OBJECTS.order.fields.status,
                  operand: 'IS',
                  value: '["CONFIRMED"]',
                },
              ],
            },
          },
        },
        {
          universalIdentifier: 'd007080a-e3b2-4f6f-847b-d4ae1497d32e',
          title: 'Planned site visits',
          type: 'GRAPH',
          objectUniversalIdentifier: LUMBER_OBJECTS.visit.universalIdentifier,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 0,
            column: 4,
            rowSpan: 2,
            columnSpan: 4,
          },
          configuration: {
            configurationType: 'AGGREGATE_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              LUMBER_OBJECTS.visit.fields.name,
            aggregateOperation: AggregateOperations.COUNT,
            displayDataLabel: true,
            ...CHART_TIME_SETTINGS,
            filter: {
              recordFilters: [
                {
                  fieldMetadataUniversalIdentifier:
                    LUMBER_OBJECTS.visit.fields.status,
                  operand: 'IS',
                  value: '["PLANNED"]',
                },
              ],
            },
          },
        },
        {
          universalIdentifier: '1027bd0a-71a4-4baa-86b1-b5cd95d93226',
          title: 'Undelivered shipment lots',
          type: 'GRAPH',
          objectUniversalIdentifier:
            LUMBER_OBJECTS.shipment.universalIdentifier,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 0,
            column: 8,
            rowSpan: 2,
            columnSpan: 4,
          },
          configuration: {
            configurationType: 'AGGREGATE_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              LUMBER_OBJECTS.shipment.fields.name,
            aggregateOperation: AggregateOperations.COUNT,
            displayDataLabel: true,
            ...CHART_TIME_SETTINGS,
            filter: {
              recordFilters: [
                {
                  fieldMetadataUniversalIdentifier:
                    LUMBER_OBJECTS.shipment.fields.status,
                  operand: 'IS',
                  value: '["PLANNED","IN_TRANSIT","DELAYED"]',
                },
              ],
            },
          },
        },
        {
          universalIdentifier: '40b4dc69-2460-40f5-a201-3e8eda8d259c',
          title: 'Expected commission · agreed terms',
          type: 'GRAPH',
          objectUniversalIdentifier:
            LUMBER_OBJECTS.commission.universalIdentifier,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 2,
            column: 0,
            rowSpan: 2,
            columnSpan: 4,
          },
          configuration: {
            configurationType: 'AGGREGATE_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              LUMBER_OBJECTS.commission.fields.expectedCommission,
            aggregateOperation: AggregateOperations.SUM,
            displayDataLabel: true,
            ...CHART_TIME_SETTINGS,
            filter: {
              recordFilters: [
                {
                  fieldMetadataUniversalIdentifier:
                    LUMBER_OBJECTS.commission.fields.status,
                  operand: 'IS',
                  value: '["CONFIRMED"]',
                },
              ],
            },
          },
        },
        {
          universalIdentifier: '367395d1-000b-4d04-a50f-0b197f9691bc',
          title: 'Commission received · agreed terms',
          type: 'GRAPH',
          objectUniversalIdentifier:
            LUMBER_OBJECTS.commission.universalIdentifier,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 2,
            column: 4,
            rowSpan: 2,
            columnSpan: 4,
          },
          configuration: {
            configurationType: 'AGGREGATE_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              LUMBER_OBJECTS.commission.fields.receivedCommission,
            aggregateOperation: AggregateOperations.SUM,
            displayDataLabel: true,
            ...CHART_TIME_SETTINGS,
            filter: {
              recordFilters: [
                {
                  fieldMetadataUniversalIdentifier:
                    LUMBER_OBJECTS.commission.fields.status,
                  operand: 'IS',
                  value: '["CONFIRMED"]',
                },
              ],
            },
          },
        },
        {
          universalIdentifier: '5d11ec1b-ef7f-4688-ba19-7f27c7020813',
          title: 'Your expected allocation · agreed split',
          type: 'GRAPH',
          objectUniversalIdentifier:
            LUMBER_OBJECTS.commission.universalIdentifier,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 2,
            column: 8,
            rowSpan: 2,
            columnSpan: 4,
          },
          configuration: {
            configurationType: 'AGGREGATE_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              LUMBER_OBJECTS.commission.fields.yourExpectedShare,
            aggregateOperation: AggregateOperations.SUM,
            displayDataLabel: true,
            ...CHART_TIME_SETTINGS,
            filter: {
              recordFilters: [
                {
                  fieldMetadataUniversalIdentifier:
                    LUMBER_OBJECTS.commission.fields.status,
                  operand: 'IS',
                  value: '["CONFIRMED"]',
                },
                {
                  fieldMetadataUniversalIdentifier:
                    LUMBER_OBJECTS.commission.fields.splitConfirmed,
                  operand: 'IS',
                  value: 'true',
                },
              ],
            },
          },
        },
        {
          universalIdentifier: 'f4979db7-3150-4168-9891-2aff38502a38',
          title: 'Sales orders by stage',
          type: 'GRAPH',
          objectUniversalIdentifier: LUMBER_OBJECTS.order.universalIdentifier,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 4,
            column: 0,
            rowSpan: 5,
            columnSpan: 6,
          },
          configuration: {
            configurationType: 'PIE_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              LUMBER_OBJECTS.order.fields.name,
            aggregateOperation: AggregateOperations.COUNT,
            groupByFieldMetadataUniversalIdentifier:
              LUMBER_OBJECTS.order.fields.status,
            displayLegend: true,
            displayDataLabel: true,
            ...CHART_TIME_SETTINGS,
          },
        },
        {
          universalIdentifier: 'f90795a3-53f5-4658-9d2b-9134ea72eed6',
          title: 'Shipment lots by status',
          type: 'GRAPH',
          objectUniversalIdentifier:
            LUMBER_OBJECTS.shipment.universalIdentifier,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 4,
            column: 6,
            rowSpan: 5,
            columnSpan: 6,
          },
          configuration: {
            configurationType: 'PIE_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              LUMBER_OBJECTS.shipment.fields.name,
            aggregateOperation: AggregateOperations.COUNT,
            groupByFieldMetadataUniversalIdentifier:
              LUMBER_OBJECTS.shipment.fields.status,
            displayLegend: true,
            displayDataLabel: true,
            ...CHART_TIME_SETTINGS,
          },
        },
      ],
    },
  ],
});
