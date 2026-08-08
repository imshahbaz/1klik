import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Modal, Portal, Switch, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ListRow from '../ui/Row';
import { Hairline } from '../ui/Panel';
import { radius, space } from '../../theme/tokens';

interface ProfileMenuProps {
  readonly styles?: any;
  readonly theme: any;
  readonly showProfileMenu: boolean;
  readonly setShowProfileMenu: (val: boolean) => void;
  readonly user: any;
  readonly logout: () => Promise<void>;
  readonly isDarkMode: boolean;
  readonly toggleTheme: () => void;
  readonly router: any;
}

/**
 * Material 3 bottom sheet. Anchoring account actions to the bottom edge puts
 * them in thumb reach and matches the sheet pattern Android uses for
 * contextual menus — the previous side drawer was a desktop-nav idiom.
 */
export default function ProfileMenu({
  theme,
  showProfileMenu,
  setShowProfileMenu,
  user,
  logout,
  isDarkMode,
  toggleTheme,
  router,
}: ProfileMenuProps) {
  const insets = useSafeAreaInsets();
  const close = () => setShowProfileMenu(false);

  const identity = user?.name || user?.email || user?.mobile || user?.username || 'Guest';

  return (
    <Portal>
      <Modal
        visible={showProfileMenu}
        onDismiss={close}
        contentContainerStyle={styles.host}
        style={styles.modal}
      >
        {/* Tapping the area above the sheet dismisses it, as on a native sheet. */}
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close menu" />

        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, space.md) },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          <View style={styles.identity}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryBackground }]}>
              <Ionicons name="person" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary }}>
                {identity}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>
                {user ? 'Signed in' : 'Sign in to trade and connect brokers'}
              </Text>
            </View>
          </View>

          <Hairline />

          <ListRow
            title="Dark mode"
            icon={isDarkMode ? 'moon' : 'sunny'}
            iconTint={theme.textSecondary}
            trailing={<Switch value={isDarkMode} onValueChange={toggleTheme} color={theme.primary} />}
          />

          {user ? (
            <>
              <ListRow
                title="Account settings"
                icon="settings-outline"
                showChevron
                onPress={() => {
                  close();
                  router.push('/settings');
                }}
              />
              <ListRow
                title="Broker connections"
                icon="git-network-outline"
                showChevron
                onPress={() => {
                  close();
                  router.push('/brokers');
                }}
              />
              <Hairline />
              <ListRow
                title="Sign out"
                icon="log-out-outline"
                iconTint={theme.danger}
                iconBackground={theme.dangerBackground}
                onPress={async () => {
                  await logout();
                  close();
                }}
              />
            </>
          ) : (
            <ListRow
              title="Sign in"
              subtitle="Unlock strategies, orders and portfolio sync"
              icon="log-in-outline"
              iconTint={theme.primary}
              iconBackground={theme.primaryBackground}
              showChevron
              onPress={() => {
                close();
                router.push('/login');
              }}
            />
          )}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  host: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    // Only the top corners round — the sheet is anchored to the screen edge.
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: space.sm,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginBottom: space.md,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
