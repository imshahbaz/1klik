import React from 'react';
import { View, Text, TouchableOpacity, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

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
    <Modal
      visible={showProfileMenu}
      transparent={true}
      animationType="none"
      onRequestClose={() => setShowProfileMenu(false)}
    >
      <View style={styles.sideMenuOverlay}>
        {/* Backdrop click dismiss */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        />

        {/* Drawer Panel */}
        <View style={styles.drawerPanel}>
          {/* Custom Navigation Header (Same style as Screener Screen!) */}
          <View style={styles.drawerHeader}>
            <TouchableOpacity style={styles.drawerBackButton} onPress={() => setShowProfileMenu(false)}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.drawerHeaderTitle}>Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Drawer Body (Same style as Screener Screen!) */}
          <View style={styles.drawerBody}>
            {user ? (
              <View style={styles.profileDetailsCard}>
                <View style={styles.avatarCircle}>
                  {user.profile ? (
                    <Image
                      source={{ uri: user.profile }}
                      contentFit="cover"
                      transition={120}
                      cachePolicy="memory-disk"
                      recyclingKey={user.profile}
                      style={styles.drawerAvatar}
                    />
                  ) : (
                    <Ionicons name="person" size={36} color={theme.secondary} />
                  )}
                </View>
                <Text style={styles.profileLabel}>Logged In As</Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user.name || user.email || user.mobile || user.username || 'User'}
                </Text>
                <View style={styles.profileDivider} />

                <View style={styles.themeToggleRow}>
                  <Text style={styles.themeToggleLabel}>Dark Mode</Text>
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={theme.card}
                  />
                </View>

                <TouchableOpacity
                  style={styles.drawerSettingsButton}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push('/settings');
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="settings-outline" size={18} color={theme.textPrimary} />
                  <Text style={styles.settingsButtonText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerLogoutButton}
                  onPress={async () => {
                    await logout();
                    setShowProfileMenu(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="log-out-outline" size={18} color="#ffffff" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.profileDetailsCard}>
                <View style={styles.avatarCircleGray}>
                  <Ionicons name="person-outline" size={36} color={theme.iconMuted} />
                </View>
                <Text style={styles.profileLabel}>Account Status</Text>
                <Text style={styles.profileEmail}>Not logged in</Text>
                <Text style={styles.profileSubtext}>
                  Log in to unlock custom algorithmic strategies, live market status metrics, and portfolio integrations.
                </Text>
                <View style={styles.profileDivider} />

                <View style={styles.themeToggleRow}>
                  <Text style={styles.themeToggleLabel}>Dark Mode</Text>
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={theme.card}
                  />
                </View>

                <TouchableOpacity
                  style={styles.drawerLoginButton}
                  onPress={() => {
                    setShowProfileMenu(false);
                    router.push('/login');
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="log-in-outline" size={18} color={theme.buttonPrimaryText} />
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
