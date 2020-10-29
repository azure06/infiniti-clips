import { GetterTree } from 'vuex';
import { RootState, NetworkState } from '@/store/types';
import { toDictionary } from '@/utils/object';

const getters: GetterTree<NetworkState, RootState> = {
  loading: (state: NetworkState) => state.loading,
  thisUser: (state: NetworkState) => state.thisUser,
  users: (state: NetworkState) => state.users,
  userDictionary: (state: NetworkState) => toDictionary(state.users),
  roomDictionary: (state: NetworkState) => toDictionary(state.rooms),
  rooms: (state: NetworkState) => state.rooms,
  unreadMessagesByUser: (state: NetworkState, getters: any) => {
    const unread = state.rooms.map((room) => ({
      id: room.userIds[0],
      size: (getters.thisUser
        ? room.messages.filter(
            (message) =>
              message.senderId !== getters.thisUser.id &&
              message.status === 'sent'
          )
        : []
      ).length,
    }));
    return toDictionary(unread);
  },
  unreadMessagesTotal: (state: NetworkState, getters: any) =>
    Object.values(getters.unreadMessagesByUser).reduce(
      (acc, value) => (value as any).size + acc,
      0
    ),
};

export default getters;