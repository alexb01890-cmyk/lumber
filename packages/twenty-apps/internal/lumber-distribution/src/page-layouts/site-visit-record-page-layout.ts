import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: 'bf3f4454-d52d-49fe-91e7-127563a9ed70',
  name: 'Default Site visit Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: '100c3020-24c2-4089-8bd8-baac4489cadd',
  tabs: [
    {
      universalIdentifier: '59d5afa7-078c-4312-a6a5-09780e201fce',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '36f7bbef-3f71-49bd-89f5-209de0df011b',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: '645c1514-b5fe-4faf-b363-391385a61e47',
          },
        },
      ],
    },
    {
      universalIdentifier: '53971501-58a6-4e74-a749-0229ad31985c',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'cff39563-5013-4287-9959-8019e87f1143',
          title: 'Timeline',
          type: 'TIMELINE',
          configuration: {
            configurationType: 'TIMELINE',
          },
        },
      ],
    },
  ],
});
