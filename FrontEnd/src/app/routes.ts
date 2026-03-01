import { createBrowserRouter } from 'react-router';
import { Home } from './pages/Home';
import { Chat } from './pages/Chat';
import { Groups } from './pages/Groups';
import { GroupChat } from './pages/GroupChat';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/server/:serverId',
    Component: Chat,
  },
  {
    path: '/server/:serverId/channel/:channelId',
    Component: Chat,
  },
  {
    path: '/groups',
    Component: Groups,
  },
  {
    path: '/group/:groupId',
    Component: GroupChat,
  },
  {
    path: '/group/:groupId/channel/:channelId',
    Component: GroupChat,
  },
]);
