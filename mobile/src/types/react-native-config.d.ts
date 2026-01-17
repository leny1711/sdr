declare module 'react-native-config' {
  export interface ReactNativeConfig {
    API_URL?: string;
    SOCKET_URL?: string;
  }

  export const Config: ReactNativeConfig;
  export default Config;
}
