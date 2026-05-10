import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>VAMOS DESENVOLVER NOSSO APP, E O DAVI É GOSTOSO!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8C1AF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
