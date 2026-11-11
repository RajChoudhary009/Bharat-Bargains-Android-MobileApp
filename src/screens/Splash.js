import React, { useEffect } from 'react';
import { Image, View, StatusBar } from 'react-native';
import logo from '../Assets/images/bharat_logo.jpeg';
import { useNavigation } from '@react-navigation/native';

const BLACK = '#000';

const Splash = () => {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      navigation.navigate('Home'); // Ensure 'About' screen exists in your navigator
    }, 2000);
  }, []);

  return (
    <>
      <StatusBar backgroundColor={BLACK} barStyle="light-content" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Image
          source={logo}
          style={{ width: 350, height: 350 }}
          resizeMode="contain"
        />

        {/* <Text style={{ color: "#fff"}}>Bharat Bargains</Text> */}
      </View>
    </>
  );
}

export default Splash;
