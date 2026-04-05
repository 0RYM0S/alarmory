import React, { createContext, useContext, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/src/hooks/useTheme';
import HomeScreen from './index';
import SettingsScreen from './settings';

// ─── Tab navigation context ──────────────────────────────────────────────────

interface TabNavCtx {
  switchToTab: (i: number) => void;
  setTabScrollEnabled: (enabled: boolean) => void;
}

export const TabNavigationContext = createContext<TabNavCtx>({
  switchToTab: () => {},
  setTabScrollEnabled: () => {},
});

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [tabScrollEnabled, setTabScrollEnabled] = useState(true);

  function switchToTab(i: number) {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setActiveTab(i);
  }

  const tabs = [
    { iconName: 'alarm' as const, label: 'ALARMS', index: 0 },
    { iconName: 'settings' as const, label: 'SETTINGS', index: 1 },
  ];

  return (
    <TabNavigationContext.Provider value={{ switchToTab, setTabScrollEnabled }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Pager */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={tabScrollEnabled}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const tab = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveTab(tab);
          }}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={{ width, flex: 1 }}>
            <HomeScreen />
          </View>
          <View style={{ width, flex: 1 }}>
            <SettingsScreen />
          </View>
        </ScrollView>

        {/* Tab bar */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: colors.tabBar, borderTopColor: colors.border },
          ]}
        >
          {tabs.map(({ iconName, label, index }) => {
            const active = activeTab === index;
            const tint = active ? colors.tabIconSelected : colors.tabIconDefault;
            return (
              <Pressable
                key={index}
                style={styles.tabItem}
                onPress={() => switchToTab(index)}
              >
                <MaterialIcons name={iconName} size={22} color={tint} />
                <Text style={[styles.tabLabel, { color: tint }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </TabNavigationContext.Provider>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
