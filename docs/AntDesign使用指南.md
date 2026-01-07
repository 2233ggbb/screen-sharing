# Ant Design 组件库使用指南

## 文档信息

| 项目名称 | 多人屏幕共享系统 |
|---------|-----------------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-01-04 |
| 文档类型 | UI组件库使用指南 |

---

## 1. Ant Design 选型理由

### 1.1 为什么选择 Ant Design

| 优势 | 说明 |
|------|------|
| **企业级** | 专为企业级产品设计，稳定可靠 |
| **组件丰富** | 60+ 高质量React组件，开箱即用 |
| **TypeScript支持** | 完整的TypeScript定义，类型安全 |
| **Less定制** | 原生支持Less，可深度定制主题 |
| **成熟稳定** | 社区活跃，文档完善，问题少 |
| **Electron兼容** | 完美支持Electron环境 |
| **国际化** | 内置i18n支持，多语言切换方便 |

### 1.2 与其他组件库对比

| 组件库 | 优势 | 劣势 | 结论 |
|-------|------|------|------|
| **Ant Design** | 企业级、组件丰富、支持Less | 包体积较大 | ✅ 选用 |
| **Material-UI** | 设计精美、社区大 | 不支持Less、定制复杂 | ❌ 不选 |
| **Chakra UI** | 现代化、易用 | 组件较少、不支持Less | ❌ 不选 |
| **Arco Design** | 字节出品、性能好 | 生态较小 | 🟡 备选 |

---

## 2. 安装配置

### 2.1 安装依赖

```bash
cd client

# 安装Ant Design
npm install antd

# 安装相关依赖
npm install @ant-design/icons
npm install @ant-design/pro-components  # 高级组件（可选）
```

### 2.2 配置按需加载

**方式一：使用 Vite 插件（推荐）**

```bash
npm install vite-plugin-imp -D
```

`vite.config.ts`配置：
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vitePluginImp from 'vite-plugin-imp';

export default defineConfig({
  plugins: [
    react(),
    vitePluginImp({
      libList: [
        {
          libName: 'antd',
          style: (name) => `antd/es/${name}/style`,
        },
      ],
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          '@primary-color': '#1890ff',
          '@link-color': '#1890ff',
          '@border-radius-base': '4px',
          '@font-size-base': '14px',
        },
      },
    },
  },
});
```

**方式二：手动按需引入**

```typescript
// ❌ 不推荐：全量引入
import { Button } from 'antd';
import 'antd/dist/antd.css';

// ✅ 推荐：按需引入
import Button from 'antd/es/button';
import 'antd/es/button/style';
```

### 2.3 主题定制

创建 `src/renderer/styles/theme.less`：

```less
// 覆盖Ant Design默认变量
@import '~antd/lib/style/themes/default.less';

// 主色
@primary-color: #1890ff;
@link-color: #1890ff;
@success-color: #52c41a;
@warning-color: #faad14;
@error-color: #f5222d;
@font-size-base: 14px;
@heading-color: rgba(0, 0, 0, 0.85);
@text-color: rgba(0, 0, 0, 0.65);
@text-color-secondary: rgba(0, 0, 0, 0.45);
@disabled-color: rgba(0, 0, 0, 0.25);
@border-radius-base: 4px;
@border-color-base: #d9d9d9;
@box-shadow-base: 0 2px 8px rgba(0, 0, 0, 0.15);

// 自定义暗色主题（可选）
:global(.dark-theme) {
  @import '~antd/lib/style/themes/dark.less';
}
```

在 `src/renderer/App.tsx` 中引入：

```typescript
import './styles/theme.less';
```

---

## 3. 项目中常用组件

### 3.1 布局组件

#### Layout - 页面布局

```typescript
import { Layout } from 'antd';

const { Header, Sider, Content, Footer } = Layout;

function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header>多人屏幕共享</Header>
      <Layout>
        <Sider width={200}>侧边栏</Sider>
        <Content>内容区域</Content>
      </Layout>
      <Footer>底部信息</Footer>
    </Layout>
  );
}
```

#### Space - 间距

```typescript
import { Space, Button } from 'antd';

function Actions() {
  return (
    <Space>
      <Button type="primary">开始共享</Button>
      <Button>停止共享</Button>
      <Button danger>离开房间</Button>
    </Space>
  );
}
```

#### Grid - 栅格

```typescript
import { Row, Col, Card } from 'antd';

function VideoGrid({ streams }) {
  return (
    <Row gutter={[16, 16]}>
      {streams.map(stream => (
        <Col xs={24} sm={12} md={8} lg={6} key={stream.id}>
          <Card>
            <video src={stream.url} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
```

### 3.2 表单组件

#### Form - 表单

```typescript
import { Form, Input, Button, message } from 'antd';

function CreateRoomForm() {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('创建房间:', values);
    message.success('房间创建成功');
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        label="房间名称"
        name="roomName"
        rules={[{ required: true, message: '请输入房间名称' }]}
      >
        <Input placeholder="请输入房间名称" />
      </Form.Item>

      <Form.Item
        label="房间密码"
        name="password"
      >
        <Input.Password placeholder="可选" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          创建房间
        </Button>
      </Form.Item>
    </Form>
  );
}
```

#### Input - 输入框

```typescript
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

<Input placeholder="输入房间ID" />
<Input.Password placeholder="输入密码" />
<Input prefix={<SearchOutlined />} placeholder="搜索" />
```

### 3.3 数据展示组件

#### List - 列表

```typescript
import { List, Avatar } from 'antd';

interface User {
  id: string;
  nickname: string;
  avatar?: string;
  isSharing: boolean;
}

function UserList({ users }: { users: User[] }) {
  return (
    <List
      dataSource={users}
      renderItem={(user) => (
        <List.Item>
          <List.Item.Meta
            avatar={<Avatar src={user.avatar}>{user.nickname[0]}</Avatar>}
            title={user.nickname}
            description={user.isSharing ? '正在共享屏幕' : '观看中'}
          />
        </List.Item>
      )}
    />
  );
}
```

#### Card - 卡片

```typescript
import { Card } from 'antd';

function VideoCard({ stream }) {
  return (
    <Card
      hoverable
      cover={<video src={stream.url} style={{ width: '100%' }} />}
      actions={[
        <Button key="focus">聚焦</Button>,
        <Button key="fullscreen">全屏</Button>,
      ]}
    >
      <Card.Meta
        title={stream.title}
        description={`${stream.user.nickname} 的共享`}
      />
    </Card>
  );
}
```

#### Badge - 徽标

```typescript
import { Badge, Avatar } from 'antd';

<Badge count={5} offset={[-5, 5]}>
  <Avatar shape="square" size="large">
    用户
  </Avatar>
</Badge>

<Badge status="processing" text="正在共享" />
<Badge status="success" text="已连接" />
<Badge status="error" text="连接失败" />
```

### 3.4 反馈组件

#### Message - 全局提示

```typescript
import { message } from 'antd';

// 成功提示
message.success('加入房间成功');

// 错误提示
message.error('房间不存在');

// 警告提示
message.warning('网络连接不稳定');

// 加载提示
const hide = message.loading('正在连接...', 0);
// 完成后隐藏
setTimeout(hide, 2500);
```

#### Modal - 对话框

```typescript
import { Modal, Button } from 'antd';
import { useState } from 'react';

function ScreenSelector() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onClick={() => setVisible(true)}>
        选择共享源
      </Button>

      <Modal
        title="选择要共享的屏幕或窗口"
        open={visible}
        onOk={() => setVisible(false)}
        onCancel={() => setVisible(false)}
        width={800}
      >
        {/* 屏幕/窗口列表 */}
      </Modal>
    </>
  );
}
```

#### Notification - 通知提醒

```typescript
import { notification } from 'antd';

notification.success({
  message: '用户加入',
  description: '张三 加入了房间',
  placement: 'topRight',
});

notification.warning({
  message: '网络质量',
  description: '当前网络延迟较高，可能影响共享质量',
});
```

#### Spin - 加载中

```typescript
import { Spin } from 'antd';

function Loading() {
  return (
    <div style={{ textAlign: 'center', padding: 50 }}>
      <Spin size="large" tip="正在加载..." />
    </div>
  );
}
```

### 3.5 导航组件

#### Menu - 导航菜单

```typescript
import { Menu } from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';

function SideMenu() {
  return (
    <Menu
      mode="inline"
      defaultSelectedKeys={['home']}
      items={[
        {
          key: 'home',
          icon: <HomeOutlined />,
          label: '首页',
        },
        {
          key: 'rooms',
          icon: <TeamOutlined />,
          label: '房间',
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: '设置',
        },
      ]}
    />
  );
}
```

#### Tabs - 标签页

```typescript
import { Tabs } from 'antd';

function RoomTabs() {
  return (
    <Tabs
      items={[
        {
          key: 'streams',
          label: '屏幕共享',
          children: <StreamList />,
        },
        {
          key: 'members',
          label: '成员列表',
          children: <MemberList />,
        },
        {
          key: 'chat',
          label: '聊天',
          children: <ChatPanel />,
        },
      ]}
    />
  );
}
```

---

## 4. 图标使用

### 4.1 常用图标

```typescript
import {
  UserOutlined,
  VideoCameraOutlined,
  DesktopOutlined,
  SettingOutlined,
  LogoutOutlined,
  PlusOutlined,
  ShareAltOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  FullscreenOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';

// 使用示例
<Button icon={<ShareAltOutlined />}>开始共享</Button>
<Button icon={<StopOutlined />}>停止共享</Button>
```

### 4.2 自定义图标

```typescript
import Icon from '@ant-design/icons';
import type { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';

const ScreenShareSvg = () => (
  <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
    <path d="..." />
  </svg>
);

const ScreenShareIcon = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={ScreenShareSvg} {...props} />
);

// 使用
<ScreenShareIcon style={{ fontSize: 24 }} />
```

---

## 5. 实战示例

### 5.1 首页（创建/加入房间）

```typescript
import { Card, Tabs, Form, Input, Button, message } from 'antd';
import { PlusOutlined, LoginOutlined } from '@ant-design/icons';
import styles from './Home.module.less';

export default function HomePage() {
  const [createForm] = Form.useForm();
  const [joinForm] = Form.useForm();

  const handleCreate = async (values: any) => {
    try {
      // 调用创建房间API
      message.success('房间创建成功');
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleJoin = async (values: any) => {
    try {
      // 调用加入房间API
      message.success('加入成功');
    } catch (error) {
      message.error('加入失败');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="多人屏幕共享" style={{ width: 500 }}>
        <Tabs
          items={[
            {
              key: 'create',
              label: <span><PlusOutlined />创建房间</span>,
              children: (
                <Form form={createForm} onFinish={handleCreate} layout="vertical">
                  <Form.Item
                    name="roomName"
                    label="房间名称"
                    rules={[{ required: true, message: '请输入房间名称' }]}
                  >
                    <Input placeholder="请输入房间名称" />
                  </Form.Item>
                  <Form.Item name="password" label="房间密码">
                    <Input.Password placeholder="可选" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      创建房间
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'join',
              label: <span><LoginOutlined />加入房间</span>,
              children: (
                <Form form={joinForm} onFinish={handleJoin} layout="vertical">
                  <Form.Item
                    name="roomId"
                    label="房间ID"
                    rules={[{ required: true, message: '请输入房间ID' }]}
                  >
                    <Input placeholder="请输入房间ID" />
                  </Form.Item>
                  <Form.Item name="password" label="房间密码">
                    <Input.Password placeholder="如果房间有密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      加入房间
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
```

### 5.2 房间页面（屏幕共享视图）

```typescript
import { Layout, Row, Col, Card, List, Avatar, Button, Space, Badge } from 'antd';
import {
  ShareAltOutlined,
  StopOutlined,
  LogoutOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import styles from './Room.module.less';

const { Header, Sider, Content } = Layout;

export default function RoomPage() {
  return (
    <Layout className={styles.roomLayout}>
      <Header className={styles.header}>
        <Space>
          <h2>房间: ABC123</h2>
          <Badge count={5} />
        </Space>
        <Space>
          <Button icon={<ShareAltOutlined />}>开始共享</Button>
          <Button icon={<LogoutOutlined />} danger>
            离开房间
          </Button>
        </Space>
      </Header>

      <Layout>
        <Content className={styles.content}>
          <Row gutter={[16, 16]}>
            {streams.map((stream) => (
              <Col xs={24} sm={12} md={8} lg={6} key={stream.id}>
                <Card
                  hoverable
                  cover={
                    <div className={styles.videoWrapper}>
                      <video src={stream.url} />
                    </div>
                  }
                  actions={[
                    <Button
                      key="fullscreen"
                      icon={<FullscreenOutlined />}
                      type="text"
                    >
                      全屏
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    avatar={<Avatar>{stream.user.nickname[0]}</Avatar>}
                    title={stream.user.nickname}
                    description={
                      <Badge
                        status={stream.quality === 'good' ? 'success' : 'warning'}
                        text={`${stream.resolution}@${stream.fps}fps`}
                      />
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Content>

        <Sider width={250} theme="light">
          <div className={styles.sider}>
            <h3>房间成员 ({members.length})</h3>
            <List
              dataSource={members}
              renderItem={(member) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{member.nickname[0]}</Avatar>}
                    title={member.nickname}
                    description={
                      <Badge
                        status={member.isSharing ? 'processing' : 'default'}
                        text={member.isSharing ? '共享中' : '观看中'}
                      />
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </Sider>
      </Layout>
    </Layout>
  );
}
```

---

## 6. 最佳实践

### 6.1 性能优化

```typescript
// ✅ 使用React.memo避免不必要的重渲染
const VideoCard = React.memo(({ stream }) => {
  return <Card>...</Card>;
});

// ✅ 使用虚拟滚动处理大量数据
import { List } from 'antd';

<List
  dataSource={largeDataset}
  pagination={{ pageSize: 10 }}
  renderItem={(item) => <List.Item>...</List.Item>}
/>
```

### 6.2 响应式设计

```typescript
import { Grid } from 'antd';

const { useBreakpoint } = Grid;

function ResponsiveComponent() {
  const screens = useBreakpoint();

  return (
    <div>
      {screens.md ? <DesktopView /> : <MobileView />}
    </div>
  );
}
```

### 6.3 暗色主题切换

```typescript
import { ConfigProvider, theme } from 'antd';
import { useState } from 'antd';

function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <YourApp />
    </ConfigProvider>
  );
}
```

---

## 7. 常见问题

### Q1: Ant Design与CSS Modules如何配合使用？

**A**: Ant Design的全局样式和CSS Modules可以共存：

```typescript
// 组件中
import { Button } from 'antd';
import styles from './MyComponent.module.less';

function MyComponent() {
  return (
    <div className={styles.container}>
      <Button className={styles.customButton}>按钮</Button>
    </div>
  );
}
```

```less
// MyComponent.module.less
.container {
  padding: 20px;
}

.customButton {
  // 覆盖Ant Design样式
  :global(.ant-btn) {
    border-radius: 8px;
  }
}
```

### Q2: 如何减小Ant Design的包体积？

**A**: 
1. 使用按需加载（vite-plugin-imp）
2. 只引入需要的组件
3. 使用Tree Shaking
4. 生产环境构建时自动优化

### Q3: 如何自定义Ant Design组件样式？

**A**: 三种方式：
1. 修改Less变量（推荐）
2. 使用`:global`覆盖（谨慎使用）
3. 使用ConfigProvider的theme配置

---

## 8. 参考资源

- **Ant Design官网**: https://ant.design/
- **组件文档**: https://ant.design/components/overview-cn/
- **图标库**: https://ant.design/components/icon-cn/
- **定制主题**: https://ant.design/docs/react/customize-theme-cn

---

**文档结束**
