import React, { useCallback, useRef, useState, useEffect } from 'react';

import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useAntMedia, rtc_view } from '@antmedia/react-native-ant-media';

import InCallManager from 'react-native-incall-manager';

export default function App() {
  var defaultStreamName = 'testv1';
  const webSocketUrl = 'ws://141.95.165.123:5080/WebRTCAppEE/websocket';

  const [localMedia, setLocalMedia] = useState('');
  const streamNameRef = useRef<string>(defaultStreamName);
  const [remoteMedia, setRemoteStream] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);

  const adaptor = useAntMedia({
    url: webSocketUrl,
    mediaConstraints: {
      audio: true,
      video: {
        width: 640,
        height: 480,
        frameRate: 30,
        facingMode: 'front',
      },
    },
    callback(command: any) {
      switch (command) {
        case 'pong':
          break;
        case 'joined':
          console.log('play_started');
          setIsPlaying(true);
          break;
        case 'leaved':
          console.log('leaved!');
          setRemoteStream('');
          setIsPlaying(false);
          break;
        default:
          console.log(command);
          break;
      }
    },
    callbackError: (err: any, data: any) => {
      console.error('callbackError', err, data);
    },
    peer_connection_config: {
      iceServers: [
        {
          url: 'stun:stun.l.google.com:19302',
        },
      ],
    },
    debug: true,
  });

  useEffect(() => {
    if (adaptor) {
      const verify = () => {
        if (
          adaptor.localStream.current &&
          adaptor.localStream.current.toURL()
        ) {
          return setLocalMedia(adaptor.localStream.current.toURL());
        }
        setTimeout(verify, 3000);
      };
      verify();
    }
  }, [adaptor]);

  useEffect(() => {
    if (localMedia && remoteMedia) {
      InCallManager.start({ media: 'video' });
    }
  }, [localMedia, remoteMedia]);

  useEffect(() => {
    if (adaptor && Object.keys(adaptor.remoteStreams).length > 0) {
      for (let i in adaptor.remoteStreams) {
        let st =
          adaptor.remoteStreams[i] && 'toURL' in adaptor.remoteStreams[i]
            ? adaptor.remoteStreams[i].toURL()
            : null;
        setRemoteStream(st || '');
        break;
      }
    }
  }, [adaptor]);

  const handlePublish = useCallback(() => {
    if (!adaptor) {
      return;
    }

    adaptor.join(streamNameRef.current);
  }, [adaptor]);

  const handleStop = useCallback(() => {
    if (!adaptor) {
      return;
    }
    adaptor.leave(streamNameRef.current);
    InCallManager.stop();
    setIsPlaying(false);
  }, [adaptor]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.heading}>Ant Media WebRTC Peer to Peer</Text>
        {localMedia ? <>{rtc_view(localMedia, styles.localPlayer)}</> : <></>}
        {!isPlaying ? (
          <>
            <TouchableOpacity onPress={handlePublish} style={styles.button}>
              <Text>Join</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
          {remoteMedia ? (
          <>{rtc_view(remoteMedia, styles.streamPlayer)}</>
        ) : (
          <></>
        )}
            <TouchableOpacity onPress={handleStop} style={styles.button}>
              <Text>Leave</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    alignSelf: 'center',
    //marginVertical: 0,
    width: '80%',
    height: '80%',
  },
  streamPlayer: {
    zIndex: 1,
    width: '50%',
    height: '50%',
    alignSelf: 'center',
  },
  localPlayer: {
    width: '50%',
    height: '50%',
    alignSelf: 'center',
    //position: 'absolute',
    //bottom: '15%',
    //alignSelf: 'flex-end',
    //zIndex: 2,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    marginBottom: 10,
  },
  heading: {
    alignSelf: 'center',
  },
});
