import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { tokens } from 'ui';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconsName;
  color: string;
  size: number;
  focused: boolean;
}

function TabIcon({ name, color, size, focused }: TabIconProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: focused ? `${tokens.colors.primary}22` : 'transparent',
      }}
    >
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Avaliar',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'camera' : 'camera-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
