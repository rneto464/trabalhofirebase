import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import colors from './src/theme/colors';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CadastroAnuncioScreen from './src/screens/CadastroAnuncioScreen';
import MeusAnunciosScreen from './src/screens/MeusAnunciosScreen';

const Stack = createNativeStackNavigator();

function Logo() {
  return (
    <View style={styles.logo}>
      <Ionicons name="fast-food" size={22} color={colors.primaryDark} />
      <Text style={styles.logoText}>Lanchonete da Mari</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerTitle: () => <Logo />,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Ionicons
                name="person-circle-outline"
                size={28}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
        })}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="CadastroAnuncio" component={CadastroAnuncioScreen} />
        <Stack.Screen name="MeusAnuncios" component={MeusAnunciosScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginLeft: 6,
  },
});
