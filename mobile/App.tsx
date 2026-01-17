/**
 * 应用入口
 */

import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './src/screens/HomeScreen';
import RoomScreen from './src/screens/RoomScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { darkTheme, lightTheme } from './src/theme';
import { useSettingsStore } from './src/store/useSettingsStore';

// 忽略一些无关紧要的警告
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// 导航类型定义
export type RootStackParamList = {
  Home: undefined;
  Room: { roomId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  // 根据设置选择主题
  const themeSetting = useSettingsStore((state) => state.theme);
  const theme = themeSetting === 'dark' ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme as any}>
          <NavigationContainer>
            <StatusBar
              barStyle="light-content"
              backgroundColor="#141414"
              translucent={false}
            />
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Room" component={RoomScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;