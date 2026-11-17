import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: '219b9a37-328f-465e-b736-abf201b868f2',
  name: 'Default Reorder plan Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: '32d05b14-1d3b-49b9-85d5-14f3051d894b',
  tabs: [
    {
      universalIdentifier: '3b453d3e-b080-45c9-87f3-3e99cd66d928',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '23bdeca8-7757-40a8-8139-d4a3c653af3b',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: 'e33ddd37-6212-4bba-8e8d-508a954604ac',
          },
        },
      ],
    },
    {
      universalIdentifier: '29092298-752a-474a-981a-1fe5c95fb59d',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'd4c563c5-0da9-4a36-8ccb-49e69a92f844',
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
