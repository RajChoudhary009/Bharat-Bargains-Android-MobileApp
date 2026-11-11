import React, { useContext } from 'react';
import { GlobleInfoProvider } from './src/context/GlobleInfoContext';
import { GlobleInfo } from './src/context/GlobleInfoContext';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import Splash from './src/screens/Splash';
import LoginPage from './src/Auth/LoginPage';
import OtpVerify from './src/Auth/Otpvarify';
import Eyewear from './src/screens/Eyewear';
import Footwears from './src/screens/Footwears';
import Clothings from './src/screens/Clothings';
import Jewellery from './src/screens/Jewellery';
import Bags from './src/screens/Bags';
import ProductDetail from './src/screens/ProductDetail';
import CheckOutPage from './src/screens/CheckOutPage';

// Tabs
import HomePage from './src/tabs/HomePage';
import CategoriesScreen from './src/tabs/CategoriesScreen'
import OffersScreen from './src/tabs/OffersScreen'
import CartScreen from './src/tabs/CartScreen'
import AccountScreen from './src/tabs/AccountScreen'

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// cart count from (context). 0 hone par badge nahi dikhega.
const CART_COUNT = 2;

// Har tab ka config: filled icon (selected), outline icon (unselected)
const TAB_CONFIG = {
    HomeTab: { label: 'Home', active: 'home', inactive: 'home-outline' },
    CategoriesTab: { label: 'Categories', active: 'grid', inactive: 'grid-outline' },
    OffersTab: { label: 'Offers', active: 'pricetag', inactive: 'pricetag-outline' },
    CartTab: { label: 'Cart', active: 'cart', inactive: 'cart-outline' },
    AccountTab: { label: 'Account', active: 'person', inactive: 'person-outline' },
};

// Bottom tabs
const MainTabs = () => {
    const { cartlistItems} = useContext(GlobleInfo);
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => {
                const config = TAB_CONFIG[route.name];
                return {
                    headerShown: false,
                    // tabBarActiveTintColor: '#2874F0', //  blue
                    tabBarActiveTintColor: '#F5B800', //  gold
                    tabBarInactiveTintColor: '#C99700',
                    tabBarLabel: config.label,
                    tabBarLabelStyle: styles.label,
                    tabBarStyle: [
                        styles.tabBar,
                        {
                            height: 60 + insets.bottom,
                            paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
                        },
                    ],
                    tabBarHideOnKeyboard: true,
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons
                            name={focused ? config.active : config.inactive}
                            size={30}
                            color={color}
                        />
                    ),
                };
            }}
        >
            <Tab.Screen name="HomeTab" component={HomePage} />
            <Tab.Screen name="CategoriesTab" component={CategoriesScreen} />
            <Tab.Screen name="OffersTab" component={OffersScreen} />
            <Tab.Screen name="CartTab" component={CartScreen}
                options={{
                    tabBarBadge: cartlistItems.length > 0 ? cartlistItems.length : undefined,
                    tabBarBadgeStyle: styles.badge,
                }}
            />
            <Tab.Screen name="AccountTab" component={AccountScreen} />
        </Tab.Navigator>
    );
};

const App = () => {
    return (
        <SafeAreaProvider>
            <GlobleInfoProvider>
                <NavigationContainer>

                    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }} >
                        <Stack.Screen name="Splash" component={Splash} />
                        <Stack.Screen name="LoginPage" component={LoginPage} />
                        <Stack.Screen name="OtpVerify" component={OtpVerify} />

                        {/* Bottom tabs (swipe-back band, taaki login pe wapas na jaye) */}
                        <Stack.Screen
                            name="Home"
                            component={MainTabs}
                            options={{ gestureEnabled: false }}
                        />

                        {/* Full screen pages (tabs ke bina) */}
                        <Stack.Screen name="Eyewear" component={Eyewear} />
                        <Stack.Screen name="Footwear" component={Footwears} />
                        <Stack.Screen name="Clothings" component={Clothings} />
                        <Stack.Screen name="Jewellery" component={Jewellery} />
                        <Stack.Screen name="Bags" component={Bags} />
                        <Stack.Screen name="ProductItem" component={ProductDetail} />
                        <Stack.Screen name="CheckOutPage" component={CheckOutPage} />
                    </Stack.Navigator>

                </NavigationContainer>
            </GlobleInfoProvider>
        </SafeAreaProvider>
    );
};

export default App;

const styles = StyleSheet.create({
    tabBar: {
        paddingTop: 2,
        backgroundColor: '#fff',
        borderTopWidth: 0,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
        marginBottom: 0,
    },
    badge: {
        backgroundColor: '#FF3B30',
        color: '#fff',
        fontSize: 10,
    },
});