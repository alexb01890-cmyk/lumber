import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: '716a8ad0-d55c-4145-8865-053af1101fb9',
  name: 'Default Commission Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: 'a24350d6-b004-4c0e-bcf7-b30b5c6d3cea',
  tabs: [
    {
      universalIdentifier: 'e4433073-b515-4f5c-bfe3-fb3f039bf01c',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '884d7faa-82e8-433e-83dc-559eee929dc5',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: '191ebca1-fb4c-49b6-a51f-c07c0d442fb2',
          },
        },
      ],
    },
    {
      universalIdentifier: '668fb759-3578-4bb6-aae8-91615f6f1c12',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'c53669aa-e926-47f2-8fa1-e3d954951fcc',
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
