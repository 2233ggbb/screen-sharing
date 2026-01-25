[1] [Renderer Console 0]: [ScreenSharing] 停止track: audio at http://localhost:5173/src/renderer/utils/logger.ts:4
[1] [Renderer Console 0]: [ScreenSharing] 停止track: video at http://localhost:5173/src/renderer/utils/logger.ts:4
[1] [Renderer Console 1]: [ScreenSharing] 屏幕流已停止 at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [31136:0125/000819.010:ERROR:third_party\webrtc\modules\desktop_capture\win\wgc_capturer_win.cc:343] Source is not capturable.
[1] [31136:0125/000819.072:ERROR:third_party\webrtc\modules\desktop_capture\win\wgc_capturer_win.cc:343] Source is not capturable.
[1] [31136:0125/001016.865:ERROR:third_party\webrtc\modules\desktop_capture\win\wgc_capturer_win.cc:343] Source is not capturable.
[1] [31136:0125/001016.930:ERROR:third_party\webrtc\modules\desktop_capture\win\wgc_capturer_win.cc:343] Source is not capturable.
[1] [Renderer Console 1]: [ScreenSharing] 成功获取屏幕流: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [Controls] 准备开始共享 [object Object] at http://localhost:5173/src/renderer/components/Controls/index.tsx:50   
[1] [Renderer Console 1]: [Controls] 服务器确认开始共享 at http://localhost:5173/src/renderer/components/Controls/index.tsx:66
[1] [Renderer Console 1]: [Controls] 向所有成员发送offer at http://localhost:5173/src/renderer/components/Controls/index.tsx:81
[1] [Renderer Console 1]: [useRoomWebRTC] 开始创建连接并发送Offer to: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:29
[1] [Renderer Console 1]: [ScreenSharing] 关闭P2P连接: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:7       
[1] [Renderer Console 1]: [ScreenSharing] 创建P2P连接: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:7       
[1] [Renderer Console 1]: [useRoomWebRTC] PeerConnection 已创建，添加本地流... at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:86
[1] [Renderer Console 0]: [ScreenSharing] 添加track到连接: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:4
[1] [Renderer Console 0]: [ScreenSharing] 添加track到连接: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:4
[1] [Renderer Console 1]: [useRoomWebRTC] 本地流已添加，创建 Offer... at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:88
[1] [Renderer Console 1]: [ScreenSharing] 创建Offer: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [useRoomWebRTC] Offer 已创建，发送中... at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:90
[1] [Renderer Console 1]: [Socket] 发送: SEND_OFFER [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:197    
[1] [Renderer Console 1]: %c[ICE] ★★★ 本地(host)候选生成 ★★★ color: green; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:122
[1] [Renderer Console 1]: [ICE] 候选字符串: candidate:3383153498 1 udp 2122129151 192.168.84.85 52790 typ host generation 0 ufrag r/IU network-id 1 network-cost 10 at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:132
[1] [Renderer Console 1]: [ScreenSharing] 本地ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 调用 onIceCandidate 回调发送候选... at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:144
[1] [Renderer Console 1]: [useRoomWebRTC] 本地ICE候选生成，准备发送: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:39
[1] [Renderer Console 1]: [Socket] 发送: SEND_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:222
[1] [Renderer Console 1]: %c[ICE] ★ IPv6 候选 ★ 本地(host) color: purple; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:117
[1] [Renderer Console 1]: %c[ICE] ★★★ 本地(host)候选生成 ★★★ color: green; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:122
[1] [Renderer Console 1]: [ICE] 候选字符串: candidate:3963395736 1 udp 2122262783 2409:895a:a8b:42d:3d3e:117f:1fe4:b2f0 52791 typ host generation 0 ufrag r/IU network-id 2 network-cost 10 at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:132
[1] [Renderer Console 1]: [ScreenSharing] 本地ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 调用 onIceCandidate 回调发送候选... at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:144
[1] [Renderer Console 1]: [useRoomWebRTC] 本地ICE候选生成，准备发送: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:39
[1] [Renderer Console 1]: [Socket] 发送: SEND_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:222
[1] [Renderer Console 1]: [ScreenSharing] ICE收集状态 [fJCktICd4mtBNPRbWnpbq]: gathering at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: %c[ICE] ★ IPv6 候选 ★ 本地(host) color: purple; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:117
[1] [Renderer Console 1]: %c[ICE] ★★★ 本地(host)候选生成 ★★★ color: green; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:122
[1] [Renderer Console 1]: [ICE] 候选字符串: candidate:667952621 1 udp 2122197247 2409:895a:a8b:42d:7f70:4d61:c47b:a309 52792 typ host generation 0 ufrag r/IU network-id 3 network-cost 10 at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:132
[1] [Renderer Console 1]: [ScreenSharing] 本地ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 调用 onIceCandidate 回调发送候选... at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:144
[1] [Renderer Console 1]: [useRoomWebRTC] 本地ICE候选生成，准备发送: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:39
[1] [Renderer Console 1]: [Socket] 发送: SEND_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:222
[1] [Renderer Console 1]: %c[ICE] ★★★ STUN反射(srflx)候选生成 ★★★ color: orange; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:122
[1] [Renderer Console 1]: [ICE] 候选字符串: candidate:1726755428 1 udp 1685921535 223.104.67.162 64392 typ srflx raddr 192.168.84.85 rport 52790 generation 0 ufrag r/IU network-id 1 network-cost 10 at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:132    
[1] [Renderer Console 1]: [ScreenSharing] 本地ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 调用 onIceCandidate 回调发送候选... at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:144
[1] [Renderer Console 1]: [useRoomWebRTC] 本地ICE候选生成，准备发送: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:39
[1] [Renderer Console 1]: [Socket] 发送: SEND_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:222
[1] [Renderer Console 1]: %c[ICE] ★★★ STUN反射(srflx)候选生成 ★★★ color: orange; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:122
[1] [Renderer Console 1]: [ICE] 候选字符串: candidate:1726755428 1 udp 1685921535 223.104.67.162 8103 typ srflx raddr 192.168.84.85 rport 52790 generation 0 ufrag r/IU network-id 1 network-cost 10 at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:132     
[1] [Renderer Console 1]: [ScreenSharing] 本地ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 调用 onIceCandidate 回调发送候选... at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:144
[1] [Renderer Console 1]: [useRoomWebRTC] 本地ICE候选生成，准备发送: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:39
[1] [Renderer Console 1]: [Socket] 发送: SEND_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:222
[1] [Renderer Console 1]: %c[ICE] ★★★ 本地(host)候选生成 ★★★ color: green; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:122
[1] [Renderer Console 1]: [ICE] 候选字符串: candidate:3077124546 1 tcp 1518149375 192.168.84.85 9 typ host tcptype active generation 0 ufrag r/IU network-id 1 network-cost 10 at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:132
[1] [Renderer Console 1]: [ScreenSharing] 本地ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 调用 onIceCandidate 回调发送候选... at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:144
[1] [Renderer Console 1]: [useRoomWebRTC] 本地ICE候选生成，准备发送: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:39
[1] [Renderer Console 1]: [Socket] 发送: SEND_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:222
[1] [Renderer Console 1]: %c[ICE] ★ IPv6 候选 ★ 本地(host) color: purple; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:117
[1] [Renderer Console 1]: %c[ICE] ★★★ 本地(host)候选生成 ★★★ color: green; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:122
[1] [Renderer Console 1]: [ICE] 候选字符串: candidate:2465430528 1 tcp 1518283007 2409:895a:a8b:42d:3d3e:117f:1fe4:b2f0 9 typ host tcptype active generation 0 ufrag r/IU network-id 2 network-cost 10 at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:132   
[1] [Renderer Console 1]: [ScreenSharing] 本地ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 调用 onIceCandidate 回调发送候选... at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:144
[1] [Renderer Console 1]: [useRoomWebRTC] 本地ICE候选生成，准备发送: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:39
[1] [Renderer Console 1]: [Socket] 发送: SEND_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:222
[1] [Renderer Console 1]: %c[ICE] ★ IPv6 候选 ★ 本地(host) color: purple; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:117
[1] [Renderer Console 1]: %c[ICE] ★★★ 本地(host)候选生成 ★★★ color: green; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:122
[1] [Renderer Console 1]: [ICE] 候选字符串: candidate:1495254901 1 tcp 1518217471 2409:895a:a8b:42d:7f70:4d61:c47b:a309 9 typ host tcptype active generation 0 ufrag r/IU network-id 3 network-cost 10 at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:132   
[1] [Renderer Console 1]: [ScreenSharing] 本地ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 调用 onIceCandidate 回调发送候选... at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:144
[1] [Renderer Console 1]: [useRoomWebRTC] 本地ICE候选生成，准备发送: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:39
[1] [Renderer Console 1]: [Socket] 发送: SEND_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:222
[1] [Renderer Console 1]: %c[ICE] ★★★ STUN反射(srflx)候选生成 ★★★ color: orange; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:122
[1] [Renderer Console 1]: [ICE] 候选字符串: candidate:1726755428 1 udp 1685921535 223.104.67.162 50629 typ srflx raddr 192.168.84.85 rport 52790 generation 0 ufrag r/IU network-id 1 network-cost 10 at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:132    
[1] [Renderer Console 1]: [ScreenSharing] 本地ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 调用 onIceCandidate 回调发送候选... at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:144
[1] [Renderer Console 1]: [useRoomWebRTC] 本地ICE候选生成，准备发送: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:39
[1] [Renderer Console 1]: [Socket] 发送: SEND_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:222
[1] [Renderer Console 1]: [useRoomWebRTC] 已向成员发送offer 222 at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:111
[1] [Renderer Console 1]: %c[ICE] ★★★ STUN反射(srflx)候选生成 ★★★ color: orange; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:122
[1] [Renderer Console 1]: [ICE] 候选字符串: candidate:1726755428 1 udp 1685921535 223.104.67.162 62945 typ srflx raddr 192.168.84.85 rport 52790 generation 0 ufrag r/IU network-id 1 network-cost 10 at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:132    
[1] [Renderer Console 1]: [ScreenSharing] 本地ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 调用 onIceCandidate 回调发送候选... at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:144
[1] [Renderer Console 1]: [useRoomWebRTC] 本地ICE候选生成，准备发送: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:39
[1] [Renderer Console 1]: [Socket] 发送: SEND_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:222
[1] [Renderer Console 1]: [ScreenSharing] 收到Answer: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [Socket] 事件: WEBRTC_ANSWER [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:124 
[1] [Renderer Console 1]: [useRoomWebRTC] 处理Answer，fromUserId: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:210
[1] [Renderer Console 0]: [ScreenSharing] [setRemoteDescription] 当前 signaling state: have-local-offer, 类型: answer at http://localhost:5173/src/renderer/utils/logger.ts:4
[1] [Renderer Console 1]: [ScreenSharing] 设置远程描述: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [useRoomWebRTC] Answer处理完成，远程描述已设置: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:217
[1] [Renderer Console 1]: [ScreenSharing] 收到远程ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [Socket] 事件: WEBRTC_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:139
[1] [Renderer Console 1]: [useRoomWebRTC] 处理远程ICE候选: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:226
[1] [Renderer Console 1]: [ICE] 添加远程候选成功 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:467
[1] [Renderer Console 0]: [ScreenSharing] 添加ICE候选成功: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:4   
[1] [Renderer Console 1]: [useRoomWebRTC] ICE候选已添加: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:237
[1] [Renderer Console 1]: [ScreenSharing] 收到远程ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [Socket] 事件: WEBRTC_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:139
[1] [Renderer Console 1]: [useRoomWebRTC] 处理远程ICE候选: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:226
[1] [Renderer Console 1]: [ICE] 添加远程候选成功 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:467
[1] [Renderer Console 0]: [ScreenSharing] 添加ICE候选成功: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:4   
[1] [Renderer Console 1]: [useRoomWebRTC] ICE候选已添加: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:237
[1] [Renderer Console 1]: [ScreenSharing] 收到远程ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [Socket] 事件: WEBRTC_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:139
[1] [Renderer Console 1]: [useRoomWebRTC] 处理远程ICE候选: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:226
[1] [Renderer Console 1]: [ICE] 添加远程候选成功 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:467
[1] [Renderer Console 0]: [ScreenSharing] 添加ICE候选成功: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:4   
[1] [Renderer Console 1]: [useRoomWebRTC] ICE候选已添加: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:237
[1] [Renderer Console 1]: [ScreenSharing] ICE连接状态 [fJCktICd4mtBNPRbWnpbq]: checking at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 连接状态变化 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:180
[1] [Renderer Console 1]: [ScreenSharing] 连接状态变化 [fJCktICd4mtBNPRbWnpbq]: connecting at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [P2P] 连接状态变化 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:229
[1] [Renderer Console 1]: [ScreenSharing] 收到远程ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [Socket] 事件: WEBRTC_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:139
[1] [Renderer Console 1]: [useRoomWebRTC] 处理远程ICE候选: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:226
[1] [Renderer Console 1]: [ICE] 添加远程候选成功 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:467
[1] [Renderer Console 0]: [ScreenSharing] 添加ICE候选成功: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:4   
[1] [Renderer Console 1]: [useRoomWebRTC] ICE候选已添加: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:237
[1] [Renderer Console 1]: [ScreenSharing] 收到远程ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [Socket] 事件: WEBRTC_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:139
[1] [Renderer Console 1]: [useRoomWebRTC] 处理远程ICE候选: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:226
[1] [Renderer Console 1]: [ICE] 添加远程候选成功 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:467
[1] [Renderer Console 0]: [ScreenSharing] 添加ICE候选成功: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:4   
[1] [Renderer Console 1]: [useRoomWebRTC] ICE候选已添加: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:237
[1] [Renderer Console 1]: [ScreenSharing] 收到远程ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [Socket] 事件: WEBRTC_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:139
[1] [Renderer Console 1]: [useRoomWebRTC] 处理远程ICE候选: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:226
[1] [Renderer Console 1]: [ICE] 添加远程候选成功 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:467
[1] [Renderer Console 0]: [ScreenSharing] 添加ICE候选成功: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:4   
[1] [Renderer Console 1]: [useRoomWebRTC] ICE候选已添加: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:237
[1] [Renderer Console 1]: [ScreenSharing] 收到远程ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [Socket] 事件: WEBRTC_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:139
[1] [Renderer Console 1]: [useRoomWebRTC] 处理远程ICE候选: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:226
[1] [Renderer Console 1]: [ICE] 添加远程候选成功 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:467
[1] [Renderer Console 0]: [ScreenSharing] 添加ICE候选成功: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:4   
[1] [Renderer Console 1]: [useRoomWebRTC] ICE候选已添加: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:237
[1] [Renderer Console 1]: [ScreenSharing] ICE连接状态 [fJCktICd4mtBNPRbWnpbq]: connected at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ICE] 连接状态变化 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:180
[1] [Renderer Console 1]: [ScreenSharing] P2P连接成功 [fJCktICd4mtBNPRbWnpbq] at http://localhost:5173/src/renderer/utils/logger.ts:7      
[1] [Renderer Console 1]: %c[ICE] ✓ 连接成功！ [fJCktICd4mtBNPRbWnpbq] color: green; font-weight: bold; font-size: 16px; at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:216
[1] [Renderer Console 1]: [ScreenSharing] ICE收集状态 [fJCktICd4mtBNPRbWnpbq]: complete at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: %c[ICE] ✅ ICE 收集完成 [fJCktICd4mtBNPRbWnpbq] color: blue; font-weight: bold; at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:163
[1] [Renderer Console 1]: [ICE] 通知服务器 ICE 收集完成 [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:166
[1] [Renderer Console 1]: [useRoomWebRTC] ICE 收集完成，通知服务器协调: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:79
[1] [Renderer Console 1]: [Socket] 发送: ICE_GATHERING_COMPLETE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:235
[1] [Renderer Console 1]: %c[ICE] ★★★ ICE候选收集完成 ★★★ color: blue; font-weight: bold; [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:151
[1] [Renderer Console 1]: [ScreenSharing] ICE候选收集完成: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:7   
[1] [Renderer Console 1]: %c[ICE] 连接类型: 🎯 P2P直连 [fJCktICd4mtBNPRbWnpbq] color: green; font-weight: bold; at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:589
[1] [Renderer Console 1]: [ICE] 连接详情: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:591     
[1] [Renderer Console 1]: [ScreenSharing] 连接类型检测完成 [fJCktICd4mtBNPRbWnpbq]: direct at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [ScreenSharing] 收到远程ICE候选: [object Object] at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [Socket] 事件: WEBRTC_ICE_CANDIDATE [object Object] at http://localhost:5173/src/renderer/services/socket/client.ts:139
[1] [Renderer Console 1]: [useRoomWebRTC] 处理远程ICE候选: [object Object] at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:226
[1] [Renderer Console 1]: [ICE] 添加远程候选成功 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:467
[1] [Renderer Console 0]: [ScreenSharing] 添加ICE候选成功: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/utils/logger.ts:4   
[1] [Renderer Console 1]: [useRoomWebRTC] ICE候选已添加: fJCktICd4mtBNPRbWnpbq at http://localhost:5173/src/renderer/pages/Room/hooks/useRoomWebRTC.ts:237
[1] [Renderer Console 1]: [ScreenSharing] 连接状态变化 [fJCktICd4mtBNPRbWnpbq]: connected at http://localhost:5173/src/renderer/utils/logger.ts:7
[1] [Renderer Console 1]: [P2P] 连接状态变化 [fJCktICd4mtBNPRbWnpbq]: [object Object] at http://localhost:5173/src/renderer/services/webrtc/peer-connection.ts:229
