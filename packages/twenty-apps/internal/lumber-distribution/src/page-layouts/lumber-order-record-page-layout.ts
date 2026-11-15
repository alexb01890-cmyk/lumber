import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: '17670d3d-64f6-440b-84ed-1e2f8a6652df',
  name: 'Default Order Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: '0afd93ac-a4aa-48b1-877c-730cf3e5f6b0',
  tabs: [
    {
      universalIdentifier: 'f4f29f3c-f238-4b7c-bee9-6113de5dd6de',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '7a43f42b-84f7-4b8f-b6b7-56014ad60173',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: '27d4c265-4e0d-4ded-b122-6379e262ac32',
          },
        },
      ],
    },
    {
      universalIdentifier: '22a20459-7f61-45a2-8c9a-e85008082fbd',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '5ddcac56-ae3b-4012-8e9e-0b04270a6508',
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
