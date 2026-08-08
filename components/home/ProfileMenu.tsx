import React from 'react';
import { View } from 'react-native';
import { Portal, Modal as PaperModal, Switch as PaperSwitch, Text as PaperText, Button as PaperButton, Divider, Avatar, Card, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface ProfileMenuProps {
  readonly styles: any;
  readonly theme: any;
  readonly showProfileMenu: boolean;
  readonly setShowProfileMenu: (val: boolean) => void;
  readonly user: any;
  readonly logout: () => Promise<void>;
  readonly isDarkMode: boolean;
  readonly toggleTheme: () => void;
  readonly router: any;
}

export default function ProfileMenu({
  styles,
  theme,
  showProfileMenu,
  setShowProfileMenu,
  user,
  logout,
  isDarkMode,
  toggleTheme,
  router
}: ProfileMenuProps) {
  return (
    <Portal>
      <PaperModal
        visible={showProfileMenu}
        onDismiss={() => setShowProfileMenu(false)}
        contentContainerStyle={{
          flex: 1,
          justifyContent: 'flex-start',
          alignItems: 'flex-end',
        }}
      >
        <View style={[styles.drawerPanel, { backgroundColor: theme.background, height: '100%', width: '80%', maxWidth: 320 }]}>
          {/* Header */}
          <View style={[styles.drawerHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16 }]}>
            <IconButton
              icon={({ size, color }) => <Ionicons name="arrow-back" size={size || 22} color={color || theme.textPrimary} />}
              onPress={() => setShowProfileMenu(false)}
            />
            <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary }}>
              Profile
            </PaperText>
            <View style={{ width: 40 }} />
          </View>

          <Divider style={{ backgroundColor: theme.border, marginVertical: 8 }} />

          {/* Drawer Body */}
          <View style={{ padding: 16, flex: 1 }}>
            {user ? (
              <Card style={{ backgroundColor: theme.card, borderRadius: 20, padding: 8 }}>
                <Card.Content style={{ alignItems: 'center' }}>
                  <View style={{ marginBottom: 12, marginTop: 8 }}>
                    {user.profile ? (
                      <Avatar.Image size={64} source={{ uri: user.profile }} />
                    ) : (
                      <Avatar.Icon size={64} icon="account" style={{ backgroundColor: theme.primaryBackground }} color={theme.primary} />
                    )}
                  </View>
                  <PaperText variant="labelMedium" style={{ color: theme.textSecondary, fontWeight: '600' }}>Logged In As</PaperText>
                  <PaperText variant="titleSmall" style={{ color: theme.textPrimary, fontWeight: '700', marginTop: 2, textAlign: 'center' }} numberOfLines={1}>
                    {user.name || user.email || user.mobile || user.username || 'User'}
                  </PaperText>

                  <Divider style={{ backgroundColor: theme.border, width: '100%', marginVertical: 16 }} />

                  {/* Dark mode switch */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
                    <PaperText variant="bodyMedium" style={{ color: theme.textPrimary, fontWeight: '600' }}>Dark Mode</PaperText>
                    <PaperSwitch value={isDarkMode} onValueChange={toggleTheme} color={theme.primary} />
                  </View>

                  <PaperButton
                    mode="outlined"
                    onPress={() => {
                      setShowProfileMenu(false);
                      router.push('/settings');
                    }}
                    icon={({ size }) => <Ionicons name="settings-outline" size={size || 18} color={theme.textPrimary} />}
                    textColor={theme.textPrimary}
                    style={{ width: '100%', borderRadius: 12, marginBottom: 10 }}
                  >
                    Settings
                  </PaperButton>

                  <PaperButton
                    mode="contained"
                    onPress={async () => {
                      await logout();
                      setShowProfileMenu(false);
                    }}
                    icon={({ size }) => <Ionicons name="log-out-outline" size={size || 18} color="#ffffff" />}
                    buttonColor={theme.danger}
                    textColor="#ffffff"
                    style={{ width: '100%', borderRadius: 12 }}
                  >
                    Logout
                  </PaperButton>
                </Card.Content>
              </Card>
            ) : (
              <Card style={{ backgroundColor: theme.card, borderRadius: 20, padding: 8 }}>
                <Card.Content style={{ alignItems: 'center' }}>
                  <Avatar.Icon size={64} icon="account-outline" color={theme.iconMuted} style={{ marginBottom: 12, backgroundColor: theme.borderLight }} />
                  <PaperText variant="labelMedium" style={{ color: theme.textSecondary, fontWeight: '600' }}>Account Status</PaperText>
                  <PaperText variant="titleMedium" style={{ color: theme.textPrimary, fontWeight: '700', marginTop: 2 }}>Not logged in</PaperText>
                  <PaperText variant="bodySmall" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
                    Log in to unlock custom algorithmic strategies, live market status metrics, and portfolio integrations.
                  </PaperText>

                  <Divider style={{ backgroundColor: theme.border, width: '100%', marginVertical: 16 }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
                    <PaperText variant="bodyMedium" style={{ color: theme.textPrimary, fontWeight: '600' }}>Dark Mode</PaperText>
                    <PaperSwitch value={isDarkMode} onValueChange={toggleTheme} color={theme.primary} />
                  </View>

                  <PaperButton
                    mode="contained"
                    onPress={() => {
                      setShowProfileMenu(false);
                      router.push('/login');
                    }}
                    icon={({ size }) => <Ionicons name="log-in-outline" size={size || 18} color="#ffffff" />}
                    buttonColor={theme.primary}
                    textColor="#ffffff"
                    style={{ width: '100%', borderRadius: 12 }}
                  >
                    Login
                  </PaperButton>
                </Card.Content>
              </Card>
            )}
          </View>
        </View>
      </PaperModal>
    </Portal>
  );
}
