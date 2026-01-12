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
import { darkTheme } from './src/theme';

// 忽略一些无关紧要的警告
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// 导航类型定义
export type RootStackParamList = {
  Home: undefined;
  Room: { roomId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  // 使用暗色主题（与视频共享场景更匹配）
  const theme = darkTheme;

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
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;

curl http://adminv2.jfcsdev.qiniu.io/fc-audit-api/v1/scheduledomainconfig/audit/pending/list -XPOST -d '{"page":1, "size":10}' -H "content-type: application/json"